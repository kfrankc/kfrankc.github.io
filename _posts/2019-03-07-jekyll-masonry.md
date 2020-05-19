---
title: 'Building a Responsive Portfolio using Jekyll and Masonry'
date: 2019-03-07
permalink: /posts/2019/03/07/jekyll-masonry
tags:
  - javascript
  - design
  - masonry
  - jekyll
excerpt: ""
layout: single
toc: true
header:
  og_image: /assets/images/blog/responsive_website.png
---

{% include figure image_path="/assets/images/blog/responsive_website.png" alt="Responsive Website" caption="Jekyll + Masonry + imagesloaded = Responsive Portfolio." %}

## Background

My first experience using Jekyll for building a personal website was with [academicpages](https://github.com/academicpages/academicpages.github.io), which is an excellent theme that is mostly catered to, as you guessed, people in academia: it included many built-in [front matter](https://jekyllrb.com/docs/front-matter/) to list papers, publications, and talks. 

I later switched to [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/), which is theme academicpages forked from. MM offered more opportunities for customizations. It was around this time when I started to think about creating a custom home page to show some of my artwork and other engineering projects. I used to have this portfolio page done in pure HTML and CSS in my [personal website v1](https://github.com/kfrankc/kfrankc.github.io/releases), but with Jekyll, I figured the effort to refactor will be worth it. 

The features I wanted to implement included:

1. Easier project entry management using static Markdown (`.md`) files.
2. Load tiles seamlessly in masonry format for a clean viewing experience
3. Responsive tiles that can be customized and resized for any screen dimensions

I ultimately ended up using a combination of [Masonry](https://masonry.desandro.com/) and [imagesloaded](https://imagesloaded.desandro.com/) to achieve this. Below are the steps I took:

## Set up Minimal Mistakes

In Jekyll lingo, a portfolio page is simply a form of [collections](https://jekyllrb.com/docs/collections/), which serves to group related contents together. In the MM theme, `.md` file entries in a folder with the syntax `_<folder_name>` can be aggregated into a single view. 

In my case, I have a `_portfolio` folder with all my project/artwork entries, and I have a `portfolio-archive.md` file where these entries are aggreated. 

### Configure `portfolio-archive.md`

[Front Matter](https://jekyllrb.com/docs/front-matter/) is a useful configuration within a file that Jekyll will process first. MM has several features instrumented in the front matter that makes building collection pages extremely easy. 

For example, this is the front matter in my `portfolio-archive.md`:

```yaml
---
title: ""
layout: collection
permalink: /
collection: portfolio
entries_layout: grid
classes: wide
author_profile: true
sort_by: date
sort_order: reverse
home: true
---
```
We can go through each one:

* `title`: I left this empty, since my home page has a masthead, and doesn't need a title
* `layout`: I specify collection here to let Jekyll know that this is an aggregation page
* `permalink`: This page will be my home page, so I use `/`
* `collection`: This specifies which folder I pull content from. As mentioned before, I have a `_portfolio/` folder where I store my `.md` project/artwork files
* `entries_layout`: I use `grid` to lay out the entries in a portfolio-like format. More information on other layouts (here](https://mmistakes.github.io/minimal-mistakes/docs/layouts/).
* `classes`: I use `wide` to give myself more width for the grid
* `author_profile`: MM has a nice [customized author profile](https://mmistakes.github.io/minimal-mistakes/docs/authors/) that you can optionally include on each page.
* `sort_by`: I specify `date` values in the front matter of each entry so I can sort the grid by the most recent entry.
* `home`: I will cover this in [Load Javascript](#load-javascript) section.

That's it! In fact, I have no other content in my `portfolio-archive.md`. This front matter is all I need to populate my content. For each of my project/artwork `.md` files, I include a teaser tag with a local link to the asset. This teaser image (or gif) is what will be shown in the collection.

```yaml
header:
  teaser: assets/images/portfolio/bloodflow.gif
```

I have completed my first feature to manage my entries using collections in Jekyll. 

Next, I used Masonry and imagesLoaded to finish my second feature.

## Configure Masonry and imagesLoaded

One fallback of using purely MM `grid` layout is that the resulting tiles are not responsive to changes in orientation/screen size. I needed an external library, and Masonry was the clear choice. 

[Masonry](https://masonry.desandro.com/) is a Javascript library that enables cascading grid layout. It places `<div>` elements in _optimal_ positions based on the available vertical space on the screen. This allows tiles with unequal lengths and widths to stack optimally on the page, creating a layout very similar to that found in Pinterest.

Since my tiles will be images for each of my project/artwork, I wanted them to be loaded in the browser before Masonry kicks in and adjusts them. This will avoid the [image overlapping issue](https://masonry.desandro.com/layout.html#imagesloaded), and the library to use here is [imagesLoaded](https://imagesloaded.desandro.com/).

### Load Javascript

First, we need to load the scripts. In MM, we do this in the `custom.html` file under `head` folder in `_includes/`.

```html
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js"></script>
<script type="text/javascript" src="/assets/js/portfolio_masonry.js"></script>
```
**Note**: since I am only using these scripts for my portfolio page, I've added a front matter variable called `home` in my `portfolio-archive.md`, and I've nested the above script tags into a `if page.home` and `endif` Ruby tag.
{: .notice--danger}

### Instrument Masonry and imagesLoaded

The `portfolio_masonry.js` file contains the Javascript code to apply Masonry on the `<divs>` for each tile. Masonry works on a nested `<div>` object as follows:

```html
<div class="grid">
  <div class="grid-item"></div>
  <div class="grid-item"></div>
  ...
</div>
```

First, create the Masonry object using `grid`, then indicate `grid__item` as the `itemSelector` variable:

```js
$(window).on('load', function() {
    var grid = $('.grid__item');
    var container = document.querySelector('.archive');
    imagesLoaded(container, function() {
        grid.fadeIn();

        var msnry = new Masonry(document.querySelector('.archive'), {
           columnWidth: 100,
           itemSelector: '.grid__item',
           percentPosition: true,
           horizontalOrder: true,
        });
    });
});
```

I trigger this code on page load, and utilizes the imagesLoaded function to ensure I only run Masonry when all the images are loaded. There appears to be some image shifting as a result of Masonry on the images, so I made the `grid__item` class initially invisible, and only run the `grid.fadIn()` function within imagesLoaded.

## Implement responsive tiles

Lastly, I will make my Masonry layout responsive to various screen sizes and orientation. 

### Using Breakpoint

MM utilizes a tool called [Breakpoint](http://breakpoint-sass.com/) for organized media queries. At a high level, Breakpoint allows you to quickly define variables to hold the media query. This enables you to generate variables that account for different devices and orientations.

I made several Breakpoint variables to adjust the width of my `grid__items` class, which wraps each of my portfolio items. 

```scss
$small: (600px) (orientation portrait) !default;
$small-landscape: (600px) (orientation landscape) !default;
$medium: (768px) (orientation portrait) !default;
$medium-landscape: (1024px) (orientation landscape) !default;
$medium-wide: 900px !default;
$large: (1024px) !default;
$large-landscape: (1200px) (orientation landscape) !default;
```
I can use these variables in my `grid__items` class as follows:

```scss
.grid__item {
  display: none;
  @include breakpoint($small) {
    float: left;
  }

  @include breakpoint($small-landscape) {
    float: left;
    width: 40%;
  }

  @include breakpoint($medium) {
    float: left;
    width: 38%;
  }

  @include breakpoint($medium-landscape) {
    float: left;
    width: 27%;
  }

  @include breakpoint($large) {
    float: left;
    width: 35%;
  }

  @include breakpoint($large-landscape) {
    float: left;
    width: 30%;
  }
```

## Result

The testing in Chrome DevTools looks good:

{% include figure image_path="/assets/images/blog/responsive_website.gif" alt="Responsive Website" caption="A responsive portfolio" %}
