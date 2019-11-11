# ipsium-blog-generator

Generate dummy blog entries (Markdown file) with [Lorem-Ipsum](https://en.wikipedia.org/wiki/Lorem_ipsum).

Intended to be used for testing [Hexo](https://hexo.io).

## How to use

```bash
$ git clone https://github.com/seaoak/ipsum-blog-generator
$ cd ipsum-blog-generator
$ mkdir source
$ ./index.js 2000 foobar
```

As a result, 2000 files will be generated in `./source/` directory.
These files are Markdown text and have the extension `.md`.

In above example, first argument `2000` is the number of entries generated.
First argument should be an integer.

Second argument `foobar` is the "salt" to use by internal random number generator.
If changed, different data will be generated.
If the same string is specified, the same data will be generated (useful to reproduce).
Second argument should be a string.
