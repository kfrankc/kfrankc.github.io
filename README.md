# @bykfrankc

[![LICENSE](https://img.shields.io/badge/license-MIT-lightgrey.svg)](https://raw.githubusercontent.com/mmistakes/minimal-mistakes/master/LICENSE)
[![Jekyll](https://img.shields.io/badge/jekyll-%3E%3D%203.6-blue.svg)](https://jekyllrb.com/)
[![Ruby gem](https://img.shields.io/gem/v/minimal-mistakes-jekyll.svg)](https://rubygems.org/gems/minimal-mistakes-jekyll)

Personal Portfolio and Blog built on top of [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/), [Masonry](https://masonry.desandro.com/), and [Imageloaded](https://imagesloaded.desandro.com/).

## Building

### Local Development

1. Check that you have Ruby 2.1.0 or higher installed.

```
$ ruby --version
> ruby 2.X.X
```

If you don't have Ruby installed, install [Ruby 2.1.0 or higher](https://www.ruby-lang.org/en/downloads/). Follow [this guide](https://stackoverflow.com/questions/37720892/you-dont-have-write-permissions-for-the-var-lib-gems-2-3-0-directory) for using `rbenv` (preferred method to install Ruby)

2. Install Bundler

```
$ gem install bundler
```

3. Install all dependencies

```
$ bundle install
```

4. Build site locally

```
$ bundle exec jekyll serve
```

This loads the site at `localhost:4000`.

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
vendor
```