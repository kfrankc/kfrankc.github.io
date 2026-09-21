(function () {
  var LERP = 0.1;
  var TOUCH_DRAG_LERP = 1;
  var GAP_PX = 48;
  var coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)');

  function isPinchZoom(e) {
    return !!(e && e.ctrlKey);
  }

  function pointerCount(map) {
    var n = 0;
    for (var id in map) {
      if (map[id]) n += 1;
    }
    return n;
  }

  function isTallViewport() {
    return window.innerHeight > window.innerWidth;
  }

  function Carousel(rootEl, stageEl) {
    this.stage = stageEl;
    this.slots = Array.from(rootEl.querySelectorAll('.slot'));
    this.vertical = isTallViewport();
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.sizes = [];
    this.widths = [];
    this.centers = [];
    this.anchor = 0;
    this.periodX = 0;
    this.velocity = 0;
    this.flick = 0;
    this.lastTick = 0;
    this.drag = null;
    this.moved = 0;
    this.pressSlot = null;
    this.pointers = Object.create(null);
    this.pinch = false;
    this.stoppingFlick = false;
    this.locked = false;
    this.onWheel = this.onWheel.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  Carousel.prototype.prepare = function () {
    this.measure();
    if (this.slots[0]) void this.slots[0].offsetHeight;
    this.applyTransforms();
  };

  Carousel.prototype.start = function () {
    this.prepare();
    this.stage.addEventListener('wheel', this.onWheel, { capture: true, passive: false });
    this.stage.addEventListener('pointerdown', this.onPointerDown);
    this.stage.addEventListener('pointermove', this.onPointerMove);
    this.stage.addEventListener('pointerup', this.onPointerUp);
    this.stage.addEventListener('pointercancel', this.onPointerUp);
  };

  Carousel.prototype.stop = function () {
    this.stage.removeEventListener('wheel', this.onWheel, { capture: true });
    this.stage.removeEventListener('pointerdown', this.onPointerDown);
    this.stage.removeEventListener('pointermove', this.onPointerMove);
    this.stage.removeEventListener('pointerup', this.onPointerUp);
    this.stage.removeEventListener('pointercancel', this.onPointerUp);
  };

  Carousel.prototype.syncAxis = function () {
    this.vertical = isTallViewport();
    this.stage.classList.toggle('is-tall', this.vertical);
    document.body.classList.toggle('postcards-tall', this.vertical);
  };

  Carousel.prototype.measure = function () {
    this.syncAxis();
    var n = this.slots.length;
    this.sizes = [];
    this.widths = [];
    this.centers = [];
    var pos = 0;
    for (var i = 0; i < n; i++) {
      var w = this.slots[i].offsetWidth;
      var h = this.slots[i].offsetHeight;
      this.widths[i] = w;
      this.sizes[i] = this.vertical ? h : w;
      this.centers[i] = pos + this.sizes[i] / 2;
      pos += this.sizes[i] + GAP_PX;
    }
    this.periodX = pos;
    this.anchor = this.centers[Math.floor(n / 2)] || 0;
  };

  Carousel.prototype.onWheel = function (e) {
    if (isPinchZoom(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.locked) return;
    var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    this.targetScrollX += delta;
  };

  Carousel.prototype.onPointerDown = function (e) {
    this.pointers[e.pointerId] = true;
    if (pointerCount(this.pointers) > 1) {
      this.drag = null;
      this.pinch = true;
      return;
    }
    if (this.locked || e.button !== 0) return;
    if (e.cancelable) e.preventDefault();
    this.stoppingFlick = Math.abs(this.flick) > 0.05 || Math.abs(this.targetScrollX - this.scrollX) > 8;
    this.flick = 0;
    if (this.stoppingFlick) this.targetScrollX = this.scrollX;
    var pos = this.vertical ? e.clientY : e.clientX;
    this.drag = {
      pos: pos,
      origin: this.targetScrollX,
      lastPos: pos,
      lastT: performance.now(),
      vx: 0
    };
    this.moved = 0;
    this.pressSlot = e.target && e.target.closest ? e.target.closest('.slot') : null;
    if (this.pressSlot && this.pressSlot.blur) this.pressSlot.blur();
    this.stage.setPointerCapture(e.pointerId);
    if (this.pressSlot && typeof this.onPress === 'function') this.onPress(this.pressSlot);
  };

  Carousel.prototype.onPointerMove = function (e) {
    if (pointerCount(this.pointers) > 1) {
      this.drag = null;
      this.pinch = true;
      return;
    }
    if (!this.drag) return;
    var pos = this.vertical ? e.clientY : e.clientX;
    var now = performance.now();
    var dt = now - this.drag.lastT;
    if (dt > 0 && dt < 64) {
      this.drag.vx = this.drag.vx * 0.55 + ((pos - this.drag.lastPos) / dt) * 0.45;
    } else if (dt >= 64) {
      this.drag.vx = 0;
    }
    this.drag.lastPos = pos;
    this.drag.lastT = now;
    var delta = pos - this.drag.pos;
    this.moved = Math.max(this.moved, Math.abs(delta));
    this.targetScrollX = this.drag.origin - delta;
  };

  Carousel.prototype.onPointerUp = function (e) {
    if (e && e.pointerId != null) delete this.pointers[e.pointerId];
    var slot = this.pressSlot;
    var shouldOpen = !this.didDrag() && !this.pinch && !this.stoppingFlick && slot && pointerCount(this.pointers) === 0;
    if (pointerCount(this.pointers) === 0) {
      if (this.drag && this.didDrag() && coarsePointer.matches) {
        this.flick = -this.drag.vx;
        if (Math.abs(this.flick) < 0.15) this.flick = 0;
      }
      this.drag = null;
      this.pressSlot = null;
      this.pinch = false;
    }
    if (shouldOpen && typeof this.onActivate === 'function') this.onActivate(slot);
  };

  Carousel.prototype.didDrag = function () {
    return this.moved > 6;
  };

  Carousel.prototype.applyTransforms = function () {
    var rect = this.stage.getBoundingClientRect();
    var vw = rect.width;
    var vh = rect.height;
    var half = this.periodX / 2;
    var maxW = 0;
    for (var m = 0; m < this.widths.length; m++) {
      if (this.widths[m] > maxW) maxW = this.widths[m];
    }
    var fadeWide = !this.vertical && vw >= 2600;
    var side = Math.max(0, (vw - maxW) / 2);
    var fade = Math.min(Math.max(side * 0.85, 48), 180);
    for (var i = 0; i < this.slots.length; i++) {
      var rel = (this.centers[i] || 0) - this.anchor - this.scrollX;
      if (this.periodX) {
        rel = ((rel % this.periodX) + this.periodX) % this.periodX;
        if (rel >= half) rel -= this.periodX;
      }
      var slot = this.slots[i];
      var cellW = this.widths[i] || slot.offsetWidth;
      var cellH = slot.offsetHeight;
      var x = this.vertical ? vw / 2 - cellW / 2 : vw / 2 + rel - cellW / 2;
      var y = this.vertical ? vh / 2 + rel - cellH / 2 : vh / 2 - cellH / 2;
      slot.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      if (slot.classList.contains('is-open')) {
        slot.style.opacity = '0';
        continue;
      }
      if (!slot.classList.contains('is-settled')) continue;
      if (!fadeWide) {
        slot.style.opacity = '';
        slot.style.pointerEvents = '';
        continue;
      }
      var edge = Math.min(x / fade, (vw - x - cellW) / fade);
      var opacity = edge > 1 ? 1 : edge < 0 ? 0 : edge;
      slot.style.opacity = opacity.toFixed(3);
      slot.style.pointerEvents = opacity < 0.08 ? 'none' : '';
    }
  };

  Carousel.prototype.tick = function () {
    var now = performance.now();
    var dt = this.lastTick ? Math.min(32, now - this.lastTick) : 16;
    this.lastTick = now;
    if (!this.drag && this.flick) {
      this.targetScrollX += this.flick * dt;
      this.flick *= Math.pow(0.94, dt / 16);
      if (Math.abs(this.flick) < 0.02) this.flick = 0;
    }
    var prev = this.scrollX;
    var lerp = this.drag && coarsePointer.matches ? TOUCH_DRAG_LERP : LERP;
    this.scrollX += (this.targetScrollX - this.scrollX) * lerp;
    this.velocity = this.scrollX - prev;
    this.applyTransforms();
  };

  var stage = document.getElementById('postcardStage');
  var root = document.getElementById('postcardCarousel');
  if (!stage || !root) return;

  var carousel = new Carousel(root, stage);
  carousel.start();

  (function revealSlots() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    carousel.slots.forEach(function (slot, i) {
      var img = slot.querySelector('img');
      function show() {
        if (reduce) {
          slot.classList.add('is-in', 'is-settled');
          return;
        }
        setTimeout(function () {
          slot.classList.add('is-in');
          slot.addEventListener('animationend', function () {
            slot.classList.add('is-settled');
          }, { once: true });
        }, i * 70);
      }
      if (!img || (img.complete && img.naturalWidth)) show();
      else {
        img.addEventListener('load', show, { once: true });
        img.addEventListener('error', show, { once: true });
      }
    });
  })();

  var raf = null;
  function loop() {
    carousel.tick();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  function relayout() {
    var t = carousel.periodX ? carousel.scrollX / carousel.periodX : 0;
    carousel.measure();
    carousel.scrollX = t * carousel.periodX;
    carousel.targetScrollX = carousel.scrollX;
    carousel.applyTransforms();
  }
  addEventListener('resize', relayout);
  addEventListener('orientationchange', relayout);

  var polaroidOverlay = document.getElementById('polaroid-overlay');
  var polaroidBackdrop = document.getElementById('polaroid-backdrop');
  var polaroid = document.getElementById('polaroid');
  var polaroidImageContainer = document.getElementById('polaroid-image-container');
  var polaroidImage = document.getElementById('polaroid-image');
  if (!polaroidOverlay || !polaroid) return;
  var hasGsap = typeof gsap !== 'undefined';

  var isPolaroidOpen = false;
  var polaroidLoadToken = 0;
  var pendingFullSrc = null;
  var shine = null;
  var originSlot = null;
  var flyReady = false;
  var morphing = false;
  var pendingScroll = 0;
  var dismissDrag = null;
  var dismissPointers = Object.create(null);
  var dismissPinch = false;
  var ignoreDismissUntil = 0;
  var DUR_MORPH = 0.9;
  var EASE_MORPH = 'power2.inOut';
  var CLOSE_WHEEL = 8;
  var CLOSE_DRAG = 16;

  function getPolaroidMaxSize() {
    var mobile = window.matchMedia('(max-width: 767px)').matches;
    return {
      maxW: mobile ? window.innerWidth * 0.85 : Math.min(window.innerWidth * 0.7, 800),
      maxH: mobile ? window.innerHeight * 0.6 : window.innerHeight * 0.65
    };
  }

  function applyPolaroidChrome() {
    var imgW = parseFloat(polaroidImageContainer.style.width);
    if (!imgW) return;
    var pad = imgW * 0.016;
    polaroid.style.setProperty('--fig-w', imgW + 'px');
    polaroid.style.padding = pad + 'px';
  }

  function sizePolaroidFrame(w, h) {
    var width = Math.max(1, Number(w) || 1);
    var height = Math.max(1, Number(h) || 1);
    var max = getPolaroidMaxSize();
    var scale = Math.min(max.maxW / width, max.maxH / height, 1);
    polaroidImageContainer.style.width = Math.round(width * scale) + 'px';
    polaroidImageContainer.style.height = Math.round(height * scale) + 'px';
    applyPolaroidChrome();
  }

  function whenDecoded(img) {
    if (!img || !img.src) return Promise.resolve();
    if (img.decode) return img.decode().catch(function () {});
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(function (resolve) {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }

  function loadPolaroidImage(thumbSrc, fullSrc, alt, w, h) {
    var token = ++polaroidLoadToken;
    pendingFullSrc = fullSrc && fullSrc !== thumbSrc ? fullSrc : null;
    polaroidImage.alt = alt || '';
    sizePolaroidFrame(w, h);
    polaroidImage.classList.add('is-visible');
    polaroidImageContainer.classList.add('is-loaded');
    polaroidImageContainer.classList.remove('is-loading');
    var src = thumbSrc || fullSrc;
    if (src && polaroidImage.src !== new URL(src, location.href).href) {
      polaroidImage.src = src;
    }
    return whenDecoded(polaroidImage).then(function () {
      return token === polaroidLoadToken;
    });
  }

  function promoteFullImage() {
    if (!pendingFullSrc) return;
    var src = pendingFullSrc;
    var token = polaroidLoadToken;
    pendingFullSrc = null;
    var hi = new Image();
    hi.onload = function () {
      if (token !== polaroidLoadToken) return;
      polaroidImage.src = src;
    };
    hi.src = src;
  }

  function sourceRect() {
    return originSlot ? originSlot.getBoundingClientRect() : null;
  }

  function destRect() {
    var imgW = parseFloat(polaroidImageContainer.style.width) || polaroidImageContainer.offsetWidth || 0;
    var imgH = parseFloat(polaroidImageContainer.style.height) || polaroidImageContainer.offsetHeight || 0;
    var pad = imgW * 0.016;
    var w = imgW ? imgW + pad * 2 : polaroid.offsetWidth;
    var h = imgH ? imgH + pad * 2 : polaroid.offsetHeight;
    if (!w || !h) return { left: 0, top: 0, width: 0, height: 0 };
    return {
      left: (window.innerWidth - w) / 2,
      top: (window.innerHeight - h) / 2,
      width: w,
      height: h
    };
  }

  function flyFromSource() {
    var from = sourceRect();
    var to = destRect();
    if (!from || !from.width || !to.width) return null;
    return {
      x: from.left + from.width / 2 - (to.left + to.width / 2),
      y: from.top + from.height / 2 - (to.top + to.height / 2),
      scale: from.width / to.width,
      origin: '50% 50%'
    };
  }

  function getShine() {
    if (!shine) {
      shine = polaroid.querySelector('.polaroid-shine');
      if (!shine) {
        shine = document.createElement('div');
        shine.className = 'polaroid-shine';
        polaroid.appendChild(shine);
      }
    }
    return shine;
  }

  function applyPolaroidTilt(clientX, clientY) {
    if (hasGsap) {
      gsap.killTweensOf(polaroid);
      gsap.killTweensOf(getShine());
    }
    var rect = polaroid.getBoundingClientRect();
    var percentX = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    var percentY = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    polaroid.style.transform =
      'perspective(1000px) rotateX(' + (-percentY * 15) + 'deg) rotateY(' + (percentX * 15) + 'deg) scale(1.02)';
    var shineEl = getShine();
    var xPercent = ((clientX - rect.left) / rect.width) * 100;
    var yPercent = ((clientY - rect.top) / rect.height) * 100;
    shineEl.style.background =
      'radial-gradient(circle at ' + xPercent + '% ' + yPercent + '%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 40%, transparent 80%)';
    shineEl.style.opacity = '1';
  }

  function resetPolaroidTilt() {
    if (!hasGsap) {
      polaroid.style.transform = '';
      getShine().style.opacity = '0';
      return;
    }
    gsap.to(polaroid, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: function () { polaroid.style.transform = ''; }
    });
    gsap.to(getShine(), { opacity: 0, duration: 0.4, ease: 'power2.out' });
  }

  function handleMouseMove(e) {
    if (!isPolaroidOpen || !flyReady) return;
    var rect = polaroid.getBoundingClientRect();
    var over =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (over) applyPolaroidTilt(e.clientX, e.clientY);
    else resetPolaroidTilt();
  }

  function armOverlay() {
    polaroidOverlay.classList.add('is-arming');
    ignoreDismissUntil = Date.now() + 450;
    setTimeout(function () {
      polaroidOverlay.classList.remove('is-arming');
    }, 450);
  }

  function dismissBlocked() {
    return Date.now() < ignoreDismissUntil;
  }

  function coverSource() {
    polaroid.classList.remove('is-preparing');
  }

  function startFocusChrome() {
    polaroidOverlay.classList.add('active', 'is-dimmed');
    armOverlay();
  }

  function hideSource() {
    if (originSlot) originSlot.classList.add('is-open');
  }

  function openPolaroid() {
    isPolaroidOpen = true;
    flyReady = false;
    morphing = true;
    carousel.locked = true;
    polaroidOverlay.style.opacity = '';
    polaroidBackdrop.style.opacity = '';
    polaroid.classList.add('is-flying', 'is-preparing');
    polaroidOverlay.classList.remove('is-closing', 'active', 'is-dimmed');

    if (!hasGsap) {
      coverSource();
      startFocusChrome();
      hideSource();
      flyReady = true;
      morphing = false;
      document.addEventListener('mousemove', handleMouseMove);
      return;
    }

    gsap.killTweensOf(polaroid);
    applyPolaroidChrome();

    requestAnimationFrame(function () {
      applyPolaroidChrome();
      var fly = flyFromSource();
      if (!fly) {
        polaroid.classList.remove('is-flying');
        coverSource();
        startFocusChrome();
        hideSource();
        flyReady = true;
        morphing = false;
        promoteFullImage();
        document.addEventListener('mousemove', handleMouseMove);
        return;
      }
      gsap.set(polaroid, {
        x: fly.x,
        y: fly.y,
        scale: fly.scale,
        transformOrigin: fly.origin
      });
      polaroid.getBoundingClientRect();
      requestAnimationFrame(function () {
        coverSource();
        requestAnimationFrame(function () {
          startFocusChrome();
          gsap.fromTo(polaroid, {
            x: fly.x,
            y: fly.y,
            scale: fly.scale
          }, {
            x: 0,
            y: 0,
            scale: 1,
            duration: DUR_MORPH,
            ease: EASE_MORPH,
            onStart: hideSource,
            onComplete: function () {
              polaroid.classList.remove('is-flying');
              flyReady = true;
              morphing = false;
              promoteFullImage();
              document.addEventListener('mousemove', handleMouseMove);
            }
          });
        });
      });
    });
  }

  function resetPolaroidDom() {
    var slot = originSlot;
    if (slot) slot.classList.remove('is-open');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        polaroidOverlay.classList.remove('active', 'is-closing', 'is-arming', 'is-dimmed');
        polaroid.classList.remove('is-flying', 'is-preparing');
        originSlot = null;
        carousel.locked = false;
        flyReady = false;
        morphing = false;
        if (pendingScroll) {
          carousel.targetScrollX += pendingScroll;
          pendingScroll = 0;
        }
        polaroidOverlay.style.opacity = '';
        polaroidBackdrop.style.opacity = '';
        if (hasGsap) {
          gsap.set(polaroid, { x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1, clearProps: 'transform' });
        }
        polaroid.style.opacity = '';
        polaroid.style.transform = '';
        pendingFullSrc = null;
        polaroidImage.classList.remove('is-visible');
        polaroidImage.removeAttribute('src');
        polaroidImageContainer.classList.remove('is-loading', 'is-loaded');
        polaroidImageContainer.style.width = '';
        polaroidImageContainer.style.height = '';
        dismissPointers = Object.create(null);
        dismissPinch = false;
        dismissDrag = null;
      });
    });
  }

  function closePolaroid() {
    if (!isPolaroidOpen) return;
    isPolaroidOpen = false;
    flyReady = false;
    morphing = true;
    polaroidLoadToken += 1;
    document.removeEventListener('mousemove', handleMouseMove);
    if (hasGsap) {
      gsap.killTweensOf(polaroid);
      gsap.killTweensOf(getShine());
    }
    getShine().style.opacity = '0';
    polaroidOverlay.classList.add('is-closing');
    polaroidOverlay.classList.remove('is-dimmed');

    if (!hasGsap) {
      resetPolaroidDom();
      return;
    }

    polaroid.classList.add('is-flying');
    gsap.set(polaroid, { rotateX: 0, rotateY: 0, scale: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, opacity: 1 });
    applyPolaroidChrome();
    polaroid.getBoundingClientRect();
    var fly = flyFromSource();
    if (!fly) {
      gsap.to(polaroid, {
        scale: 0.85,
        duration: 0.35,
        ease: 'power3.in',
        onComplete: resetPolaroidDom
      });
      return;
    }
    gsap.to(polaroid, {
      x: fly.x,
      y: fly.y,
      scale: fly.scale,
      rotateX: 0,
      rotateY: 0,
      transformOrigin: fly.origin,
      duration: DUR_MORPH,
      ease: EASE_MORPH,
      onComplete: resetPolaroidDom
    });
  }

  function slotImageArgs(slot) {
    var img = slot.querySelector('img');
    if (!img) return null;
    return [
      img.src,
      img.dataset.full || img.src,
      img.alt,
      img.getAttribute('width') || img.naturalWidth,
      img.getAttribute('height') || img.naturalHeight
    ];
  }

  function warmSlot(slot) {
    if (isPolaroidOpen || morphing || !slot) return;
    var args = slotImageArgs(slot);
    if (args) loadPolaroidImage.apply(null, args);
  }

  function openFromSlot(slot) {
    if (isPolaroidOpen || morphing || !slot) return;
    var args = slotImageArgs(slot);
    if (!args) return;
    originSlot = slot;
    morphing = true;
    loadPolaroidImage.apply(null, args).then(function (ready) {
      if (!ready || originSlot !== slot) {
        morphing = false;
        return;
      }
      openPolaroid();
    });
  }

  carousel.onPress = warmSlot;
  carousel.onActivate = openFromSlot;

  carousel.slots.forEach(function (slot) {
    slot.addEventListener('mousedown', function (e) { e.preventDefault(); });
    slot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFromSlot(slot);
      }
    });
  });

  function dismissFromScroll(delta) {
    if (!isPolaroidOpen || dismissBlocked()) return;
    pendingScroll += delta;
    closePolaroid();
  }

  function onDismissWheel(e) {
    if (!isPolaroidOpen) return;
    if (isPinchZoom(e)) return;
    e.preventDefault();
    var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) >= CLOSE_WHEEL) dismissFromScroll(delta);
  }

  function onDismissPointerDown(e) {
    if (e.pointerId != null) dismissPointers[e.pointerId] = true;
    if (pointerCount(dismissPointers) > 1) {
      dismissDrag = null;
      dismissPinch = true;
      return;
    }
    if (!isPolaroidOpen || dismissBlocked() || e.button) return;
    dismissDrag = { x: e.clientX, y: e.clientY };
    if (e.pointerId != null && polaroidOverlay.setPointerCapture) {
      try { polaroidOverlay.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }

  function onDismissPointerMove(e) {
    if (!isPolaroidOpen) return;
    if (pointerCount(dismissPointers) > 1 || dismissPinch) {
      dismissDrag = null;
      dismissPinch = true;
      return;
    }
    if (!dismissDrag) return;
    var dx = e.clientX - dismissDrag.x;
    var dy = e.clientY - dismissDrag.y;
    if (Math.hypot(dx, dy) < CLOSE_DRAG) return;
    var delta = Math.abs(dx) >= Math.abs(dy) ? -dx : dy;
    dismissDrag = null;
    dismissFromScroll(delta);
  }

  function onDismissPointerUp(e) {
    if (e && e.pointerId != null) delete dismissPointers[e.pointerId];
    if (pointerCount(dismissPointers) === 0) {
      dismissDrag = null;
      dismissPinch = false;
    }
  }

  polaroidOverlay.addEventListener('click', function (e) {
    if (dismissBlocked()) return;
    if (e.target === polaroidOverlay || e.target === polaroidBackdrop) closePolaroid();
  });

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isPolaroidOpen) closePolaroid();
  });

  addEventListener('wheel', onDismissWheel, { capture: true, passive: false });
  polaroidOverlay.addEventListener('pointerdown', onDismissPointerDown);
  polaroidOverlay.addEventListener('pointermove', onDismissPointerMove);
  polaroidOverlay.addEventListener('pointerup', onDismissPointerUp);
  polaroidOverlay.addEventListener('pointercancel', onDismissPointerUp);
})();
