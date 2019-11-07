#!/usr/bin/env node
//==============================================================================
// ipsum-blog-generator
//==============================================================================

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const { loremIpsum } = require('lorem-ipsum');

const destDir = './source/';

//============================================================================

function calculateXorShift128(...args) {
  // This is a *pure* function
  // https://ja.wikipedia.org/wiki/Xorshift
  assert(args.length < 2, args);
  const [vec] = args;
  if (args.length === 0 || vec === undefined) {
    const x = 123456789;
    const y = 362436069;
    const z = 521288629;
    const w = 88675123;
    return calculateXorShift128(Object.freeze([x, y, z, w]));
  }
  assert(Array.isArray(vec), args);
  assert(vec.length === 4, args);
  const [x, y, z, w] = vec;
  const t = x ^ (x << 11);
  const x1 = y;
  const y1 = z;
  const z1 = w;
  const w1 = (w ^ (w >>> 19)) ^ (t ^ (t >>> 8));
  return Object.freeze([w1, Object.freeze([x1, y1, z1, w1])]);
}

function reduceToDecimalFraction(...args) {
  // make a "[0,1)" decimal fraction from two 32bit signed integers
  assert(args.length === 2, args);
  const [x, y] = args;
  const significantBits = 31;
  const dropBits = 1 + significantBits - (Math.floor(Math.log2(Number.MAX_SAFE_INTEGER)) - significantBits); // 9 or 10
  assert(0 < dropBits && dropBits < significantBits);
  const x1 = x >>> dropBits; // always non-negative number
  const y1 = y >>> 1; // drop MSB (always non-negative number)
  if (x1 + 1 === 2 ** (significantBits - dropBits) && y1 + 1 === 2 ** significantBits) return 0;
  const z = x1 * (2 ** significantBits) + y1;
  assert(z >= 0);
  assert(z < Number.MAX_SAFE_INTEGER);
  const result = z / Number.MAX_SAFE_INTEGER;
  assert(result >= 0);
  assert(result < 1);
  return result;
}

function generatePRNG(seed) {
  const [_, vec0] = calculateXorShift128();
  let vec = Array.from(vec0); // not freezed
  vec[2] = 0 | Math.abs(0 | seed); // 32bit positive integer
  function myPseudoRandomNumberGenerator() {
    const [x, vec2] = calculateXorShift128(vec);
    const [y, vec3] = calculateXorShift128(vec2);
    const value = reduceToDecimalFraction(x, y);
    vec = vec3;
    return value;
  }
  return myPseudoRandomNumberGenerator;
}

function getIpsumParagraph(seed) {
  return loremIpsum({
    count: 1,
    format: "plain",
    paragraphLowerBound: 3,
    paragraphUpperBound: 7,
    random: generatePRNG(seed),
    sentenceLowerBound: 5,
    sentenceUpperBound: 15,
    suffix: "\n\n",
    units: "paragraph"
  });
}

//============================================================================

function getHash(str) {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(str);
  return sha1sum.digest('hex');
}

//============================================================================

function outputNewEntryAsync(name, text, assets) {
  const fullpath = destDir + name + '.md';
  assert(! assets); // not implemented yet
  return new Promise((resolve, reject) => {
    util.promisify(fs.stat)(name).then(() => {
      reject(new Error(`file ${fullpath} aldready exist`));
    }).catch(() => {
      util.promisify(fs.writeFile)(name, text).then(() => resolve()).catch(err => reject(err));
    });
  });
}

//============================================================================

function generateNewEntry(hint) {
  assert(hint.length === 160/4); // SHA-1
  const getSeed = (offset, len) => {
    assert(0 < len && len < 8);
    assert(0 <= offset && offset+len <= hint.length);
    return parseInt(hint.slice(offset, offset+len), 16);
  };
  const toTitle = str => str.split(/\s+/).slice(0, 5).join(' ');
  const hints = hint.split('').map(s => parseInt(s, 16));
  const title = toTitle(getIpsumParagraph(getSeed(0, 7)));
  const numOfParagraph = getSeed(7, 1) + 1;
  const body = Array(numOfParagraph).map((_, i) => {
    const seed = getSeed(9+i, 4);
    const text = getIpsumParagraph(seed);
    const isHeadding = seed % 7 == 0;
    if (isHeadding) {
      return '## ' + toTitle(text);
    }
    return text;
  }).join('\n\n');

  return `# ${title}\n\n${body}\n`;
}

//============================================================================

function generateNewBlog(numOfEntries, salt) {
  for (let i=0; i<numOfEntries; i++) {
    console.log('==================================================');
    console.log(generateNewEntry(getHash(salt + i)));
  }
}

console.log(getIpsumParagraph(33));
console.log('==================================================');
console.log(getIpsumParagraph(34));
console.log('==================================================');
console.log(getIpsumParagraph(33));
console.log('==================================================');
generateNewBlog(10, 'foobar');
