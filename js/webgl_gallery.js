(() => {
  // ns-params:@params
  var params_default = { gallery: [{ name: "desert.jpg" }, { name: "bonfire.jpg" }, { name: "bunche.jpg" }, { name: "seattle.jpg" }, { name: "cherry-blossoms.jpg" }, { name: "sunset.jpg" }, { name: "shipwreck.jpg" }, { name: "tahoe.jpg" }, { name: "road.jpg" }, { name: "lick-observatory.jpg" }, { name: "salt-flats.jpg" }, { name: "dusk.jpg" }, { name: "hwy-1.jpg" }] };

  // <stdin>
  var env = "production";
  if (env === "production") {
    console.log = function() {
    };
  }
  var Grid = class {
    // The constructor receives all the following parameters:
    // - gridSize: The size (width and height) for smallest unit size
    // - gridColumns: Number of columns for the grid (width = gridColumns * gridSize)
    // - gridRows: Number of rows for the grid (height = gridRows * gridSize)
    // - gridMin: Min width and height limits for rectangles (in grid units)
    constructor(gridSize2, gridColumns2, gridRows2, gridMin2) {
      this.gridSize = gridSize2;
      this.gridColumns = gridColumns2;
      this.gridRows = gridRows2;
      this.gridMin = gridMin2;
      this.rects = [];
      this.currentRects = [{ x: 0, y: 0, w: this.gridColumns, h: this.gridRows }];
    }
    // Takes the first rectangle on the list, and divides it in 2 more rectangles if possible
    splitCurrentRect() {
      if (this.currentRects.length) {
        const currentRect = this.currentRects.shift();
        const cutVertical = currentRect.w > currentRect.h;
        const cutSide = cutVertical ? currentRect.w : currentRect.h;
        const cutSize = cutVertical ? "w" : "h";
        const cutAxis = cutVertical ? "x" : "y";
        if (cutSide > this.gridMin * 2) {
          const rect1Size = randomInRange(this.gridMin, cutSide - this.gridMin);
          const rect1 = Object.assign({}, currentRect, { [cutSize]: rect1Size });
          const rect2 = Object.assign({}, currentRect, { [cutAxis]: currentRect[cutAxis] + rect1Size, [cutSize]: currentRect[cutSize] - rect1Size });
          this.currentRects.push(rect1, rect2);
        } else {
          this.rects.push(currentRect);
          this.splitCurrentRect();
        }
      }
    }
    // Call `splitCurrentRect` until there is no more rectangles on the list
    // Then return the list of rectangles
    generateRects() {
      while (this.currentRects.length) {
        this.splitCurrentRect();
      }
      return this.rects;
    }
  };
  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  var view = document.querySelector(".view");
  var resources = PIXI.Loader.shared.resources;
  var pointerDownTarget = 0;
  var pointerStart = new PIXI.Point();
  var pointerDiffStart = new PIXI.Point();
  var width;
  var height;
  var app;
  var background;
  var uniforms;
  var diffX;
  var diffY;
  var gridSize = 50;
  var gridMin = 10;
  var imagePadding = 50;
  var isMobileDevice = window.matchMedia("only screen and (max-width: 700px)").matches;
  var isTabletDevice = window.matchMedia("only screen and (min-width: 701px) and (max-width: 1400px)").matches;
  if (isMobileDevice) {
    console.log("this is a mobile device");
    gridSize = 25;
    gridMin = 10;
    imagePadding = 25;
  }
  if (isTabletDevice) {
    console.log("this is a tablet");
    gridSize = 40;
    gridMin = 10;
    imagePadding = 35;
  }
  var gridColumnsCount;
  var gridRowsCount;
  var gridColumns;
  var gridRows;
  var grid;
  var widthRest;
  var heightRest;
  var centerX;
  var centerY;
  var rects;
  var images;
  var imagesUrls;
  var container;
  var imagesUsed;
  var checker = (arr) => arr.every((v) => v === true);
  function initDimensions() {
    width = window.innerWidth;
    height = window.innerHeight;
    diffX = 0;
    diffY = 0;
  }
  function initUniforms() {
    uniforms = {
      uResolution: new PIXI.Point(width, height),
      uPointerDiff: new PIXI.Point(),
      uPointerDown: pointerDownTarget
    };
  }
  function initGrid() {
    gridColumnsCount = Math.ceil(width / gridSize);
    gridRowsCount = Math.ceil(height / gridSize);
    gridColumns = gridColumnsCount * 2;
    gridRows = gridRowsCount * 2;
    grid = new Grid(gridSize, gridColumns, gridRows, gridMin);
    widthRest = Math.ceil(gridColumnsCount * gridSize - width);
    heightRest = Math.ceil(gridRowsCount * gridSize - height);
    centerX = gridColumns * gridSize / 2 - gridColumnsCount * gridSize / 2;
    centerY = gridRows * gridSize / 2 - gridRowsCount * gridSize / 2;
    rects = grid.generateRects();
    images = [];
    imagesUrls = {};
    imagesUsed = [...Array(params_default.gallery.length)].map(() => {
      return false;
    });
  }
  function initApp() {
    app = new PIXI.Application({ view });
    app.renderer.autoDensity = true;
    app.renderer.resize(width, height);
    const stageFragmentShader = resources["../shaders/stage_fragment.glsl"].data;
    const stageFilter = new PIXI.Filter(void 0, stageFragmentShader, uniforms);
    app.stage.filters = [stageFilter];
  }
  function initBackground() {
    background = new PIXI.Sprite();
    background.width = width;
    background.height = height;
    const backgroundFragmentShader = resources["../shaders/background_fragment.glsl"].data;
    const backgroundFilter = new PIXI.Filter(void 0, backgroundFragmentShader, uniforms);
    background.filters = [backgroundFilter];
    app.stage.addChild(background);
  }
  function initContainer() {
    container = new PIXI.Container();
    app.stage.addChild(container);
  }
  function setAll(arr, val) {
    var i, n = arr.length;
    for (i = 0; i < n; ++i) {
      arr[i] = val;
    }
  }
  function loadTextureForImage(index) {
    const image = images[index];
    const rect = rects[index];
    const { signal } = rect.controller = new AbortController();
    var idx = Math.floor(Math.random() * params_default.gallery.length);
    if (checker(imagesUsed)) {
      console.log("resetting values");
      setAll(imagesUsed, false);
    }
    if (imagesUsed[idx]) {
      loadTextureForImage(index);
    } else {
      let onTextureUpdate = function() {
        console.log("name: " + params_default.gallery[idx].name + " | width:" + baseTexture.width + " | height: " + baseTexture.height);
        console.log("rect | width: " + image.width + " | height: " + image.height);
        let desired_w, desired_h;
        if (baseTexture.width >= baseTexture.height) {
          console.log("image width >= image height");
          if (image.width >= image.height) {
            console.log("rect width >= rect height");
            desired_w = baseTexture.width * (image.width / baseTexture.height);
            baseTexture.width = desired_w;
            baseTexture.height = image.width;
          } else {
            console.log("rect width < rect height");
            desired_w = baseTexture.width * (image.height / baseTexture.height);
            baseTexture.width = desired_w;
            baseTexture.height = image.height;
          }
        } else {
          console.log("image width < image height");
          if (image.width >= image.height) {
            console.log("rect width >= rect height");
            desired_h = baseTexture.height * (image.width / baseTexture.width);
            baseTexture.height = desired_h;
            baseTexture.width = image.width;
          } else {
            console.log("rect width < rect height");
            desired_h = baseTexture.height * (image.height / baseTexture.width);
            baseTexture.height = desired_h;
            baseTexture.width = image.height;
          }
        }
        baseTexture.width = Math.ceil(baseTexture.width);
        baseTexture.height = Math.ceil(baseTexture.height);
        console.log("NEW width:" + baseTexture.width + " | NEW height: " + baseTexture.height);
        imageTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(0, 0, image.width, image.height));
        image.texture = imageTexture;
        rect.loaded = true;
      };
      let baseTexture, imageTexture;
      imagesUsed[idx] = true;
      baseTexture = new PIXI.BaseTexture.from(params_default.gallery[idx].name);
      if (baseTexture.valid) {
        console.log("valid!");
        onTextureUpdate();
      } else {
        console.log("not valid yet..");
        baseTexture.on("update", onTextureUpdate);
      }
    }
  }
  function initRectsAndImages() {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(16777215);
    rects.forEach((rect) => {
      const image = new PIXI.Sprite();
      image.x = rect.x * gridSize;
      image.y = rect.y * gridSize;
      image.width = rect.w * gridSize - imagePadding;
      image.height = rect.h * gridSize - imagePadding;
      image.alpha = 0;
      images.push(image);
      graphics.drawRect(image.x, image.y, image.width, image.height);
    });
    graphics.endFill();
    container.addChild(graphics);
    images.forEach((image) => {
      container.addChild(image);
    });
    console.log("number of rects: " + rects.length);
  }
  function checkRectsAndImages() {
    rects.forEach((rect, index) => {
      const image = images[index];
      if (rectIntersectsWithViewport(rect)) {
        if (!rect.discovered) {
          rect.discovered = true;
          loadTextureForImage(index);
        }
        if (rect.loaded && image.alpha < 1) {
          image.alpha += 0.02;
        }
      } else {
        if (rect.discovered && !rect.loaded) {
          rect.discovered = false;
          rect.controller.abort();
        }
        if (image.alpha > 0) {
          image.alpha -= 0.02;
        }
      }
    });
  }
  function rectIntersectsWithViewport(rect) {
    return rect.x * gridSize + container.x <= width && 0 <= (rect.x + rect.w) * gridSize + container.x && rect.y * gridSize + container.y <= height && 0 <= (rect.y + rect.h) * gridSize + container.y;
  }
  function initEvents() {
    app.stage.interactive = true;
    app.stage.on("pointerdown", onPointerDown).on("pointerup", onPointerUp).on("pointerupoutside", onPointerUp).on("pointermove", onPointerMove);
  }
  function onPointerDown(e) {
    const { x, y } = e.data.global;
    pointerDownTarget = 1;
    pointerStart.set(x, y);
    pointerDiffStart = uniforms.uPointerDiff.clone();
  }
  function onPointerUp() {
    pointerDownTarget = 0;
  }
  function onPointerMove(e) {
    const { x, y } = e.data.global;
    if (pointerDownTarget) {
      diffX = pointerDiffStart.x + (x - pointerStart.x);
      diffY = pointerDiffStart.y + (y - pointerStart.y);
      diffX = diffX > 0 ? Math.min(diffX, centerX + imagePadding) : Math.max(diffX, -(centerX + widthRest));
      diffY = diffY > 0 ? Math.min(diffY, centerY + imagePadding) : Math.max(diffY, -(centerY + heightRest));
    }
  }
  function init() {
    initDimensions();
    initUniforms();
    initGrid();
    initApp();
    initBackground();
    initContainer();
    initRectsAndImages();
    initEvents();
    app.ticker.add(() => {
      uniforms.uPointerDown += (pointerDownTarget - uniforms.uPointerDown) * 0.075;
      uniforms.uPointerDiff.x += (diffX - uniforms.uPointerDiff.x) * 0.2;
      uniforms.uPointerDiff.y += (diffY - uniforms.uPointerDiff.y) * 0.2;
      container.x = uniforms.uPointerDiff.x - centerX;
      container.y = uniforms.uPointerDiff.y - centerY;
      checkRectsAndImages();
    });
  }
  function clean() {
    app.ticker.stop();
    app.stage.off("pointerdown", onPointerDown).off("pointerup", onPointerUp).off("pointerupoutside", onPointerUp).off("pointermove", onPointerMove);
    rects.forEach((rect) => {
      if (rect.discovered && !rect.loaded) {
        rect.controller.abort();
      }
    });
  }
  var resizeTimer;
  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      clean();
      init();
    }, 200);
  }
  window.addEventListener("resize", onResize);
  PIXI.Loader.shared.add([
    "../shaders/stage_fragment.glsl",
    "../shaders/background_fragment.glsl"
  ]).load(init);
})();
