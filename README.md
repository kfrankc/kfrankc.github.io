# @bykfrankc

[![LICENSE](https://img.shields.io/badge/license-MIT-lightgrey.svg)](https://raw.githubusercontent.com/mmistakes/minimal-mistakes/master/LICENSE)
[![Jekyll](https://img.shields.io/badge/jekyll-%3E%3D%203.6-blue.svg)](https://jekyllrb.com/)
[![Ruby gem](https://img.shields.io/gem/v/minimal-mistakes-jekyll.svg)](https://rubygems.org/gems/minimal-mistakes-jekyll)

Personal Portfolio and Blog built on top of [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/), [Masonry](https://masonry.desandro.com/), and [Imageloaded](https://imagesloaded.desandro.com/).

## Building

### Local Development

`bundle exec jekyll serve` and go to `localhost:4000`.

### .gitignore

There's a few files/folders I am excluding, for various reasons (ex. some are static files that are built from Jekyll).

```
*.gem
*.sublime-project
*.sublime-workspace
.bundle
.DS_Store
.jekyll-metadata
.sass-cache
_asset_bundler_cache
_site
codekit-config.json
example/_site
Gemfile.lock
node_modules
npm-debug.log*
```