(function () {
  var stack = document.getElementById('homeSketchesStack');
  var scroller = document.getElementById('homeSketchesScroller');
  var overlay = document.getElementById('homeFocusOverlay');
  var backdrop = document.getElementById('homeFocusBackdrop');
  var focusCard = document.getElementById('homeFocusCard');
  var focusImage = document.getElementById('homeFocusImage');
  var shine = document.getElementById('homeFocusShine');
  var dotsRoot = document.getElementById('homeSketchesDots');
  if (!stack || !scroller || !overlay || !focusCard || !focusImage) return;
  focusCard.classList.add('is-preparing');

  var cards = Array.from(stack.querySelectorAll('.home-sketch'));
  var dots = dotsRoot ? Array.from(dotsRoot.querySelectorAll('.home-sketches-dot')) : [];
  var n = cards.length;
  if (!n) return;

  var progress = 0;
  var direction = 1;
  var fromIndex = 0;
  var behindIndex = -1;
  var isFirst = cards.map(function (_, i) { return i === 0; });
  var drag = null;
  var focusOpen = false;
  var flying = false;
  var stackReady = false;
  var CLOSE_WHEEL = 8;
  var DUR_MORPH = 900;
  var EASE_MORPH = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
  var useDrag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function transform(value, input, output, unclamped) {
    var last = input.length - 1;
    var i;
    if (value <= input[0]) {
      if (!unclamped) return output[0];
      return mix(output[0], output[1], (value - input[0]) / (input[1] - input[0]));
    }
    if (value >= input[last]) {
      if (!unclamped) return output[last];
      return mix(output[last - 1], output[last], (value - input[last - 1]) / (input[last] - input[last - 1]));
    }
    for (i = 1; i <= last; i++) {
      if (value <= input[i]) {
        return mix(output[i - 1], output[i], (value - input[i - 1]) / (input[i] - input[i - 1]));
      }
    }
    return output[last];
  }

  function beginGesture() {
    fromIndex = snapIndex();
  }

  function commitBehind() {
    if (Math.abs(progress - Math.round(progress)) > 0.002) return;
    var to = clamp(Math.round(progress), 0, n - 1);
    if (to === fromIndex) return;
    behindIndex = fromIndex;
  }

  function updateDirection(next) {
    if (Math.abs(next - progress) < 0.03) return;
    direction = next > progress ? 1 : -1;
  }

  function updateIsFirst(next) {
    for (var i = 0; i < n; i++) {
      isFirst[i] = i === fromIndex && Math.abs(next - i) < 1;
    }
  }

  function behindCard() {
    var front = clamp(Math.round(progress), 0, n - 1);
    var behind = fromIndex !== front ? fromIndex : behindIndex;
    if (behind < 0 || behind === front) return -1;
    return behind;
  }

  function cardZIndex(index, first) {
    if (first) return 100;
    if (index === clamp(Math.round(progress), 0, n - 1)) return 90;
    if (index === behindCard()) return 80;
    return 20 - Math.abs(progress - index);
  }

  function pose(index) {
    var d = progress - index;
    var ad = Math.abs(d);
    var first = isFirst[index];
    var x = first
      ? transform(d, [-1, -0.5, 0, 0.5, 1], [12, 77, 0, -77, -12], true)
      : transform(d, [-1, 0, 1], [12, 0, -12], true);
    var rotateY = transform(ad % 1, [0, 0.5, 1], [0, first ? -6 : -8, 0]) * direction;
    var rotateZ = first
      ? transform(d, [-1, -0.5, 0, 0.5, 1], [1.1, 8, 0, -8, -1.1], true)
      : -1.1 * d;
    var scale = first ? transform(Math.min(ad, 1), [0, 0.5, 1], [1, 0.93, 1]) : 1;
    var zIndex = cardZIndex(index, first);
    var z = transform(d, [-2, -1, 0, 1, 2], [-180, -90, 0, -90, -180], true);
    if (index === behindCard()) z += 24;
    return {
      x: x,
      rotateY: rotateY,
      rotateZ: rotateZ,
      scale: scale,
      z: z,
      zIndex: zIndex
    };
  }

  function layout() {
    var front = Math.round(progress);
    for (var i = 0; i < n; i++) {
      var card = cards[i];
      var next = pose(i);
      card.classList.toggle('is-front', front === i);
      card.style.zIndex = String(Math.round(next.zIndex * 10));
      card.style.transform =
        'translate(-50%,-50%) translateX(' + next.x + '%) translateZ(' + next.z +
        'px) rotateY(' + next.rotateY + 'deg) rotateZ(' + next.rotateZ +
        'deg) scale(' + next.scale + ')';
      if (dots[i]) dots[i].classList.toggle('is-active', front === i);
    }
  }

  function setProgress(next) {
    updateDirection(next);
    updateIsFirst(next);
    progress = next;
    layout();
  }

  function slideWidth() {
    return scroller.clientWidth || 1;
  }

  function progressFromScroll() {
    return scroller.scrollLeft / slideWidth();
  }

  function snapIndex() {
    return clamp(Math.round(progressFromScroll()), 0, n - 1);
  }

  function currentCard() {
    return cards[clamp(Math.round(progress), 0, n - 1)];
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

  function paintFrame() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function showFocusImage(card, useThumb) {
    var img = card.querySelector('img');
    var w = Number(card.getAttribute('data-width')) || (img && img.naturalWidth) || 1;
    var h = Number(card.getAttribute('data-height')) || (img && img.naturalHeight) || 1;
    var src = useThumb && img
      ? (img.currentSrc || img.src)
      : (card.getAttribute('data-full') || (img && img.src) || '');
    focusCard.style.setProperty('--img-w', String(w));
    focusCard.style.setProperty('--img-h', String(h));
    focusImage.alt = card.getAttribute('data-title') || '';
    if (src && focusImage.src !== new URL(src, location.href).href) {
      focusImage.src = src;
    }
    return whenDecoded(focusImage);
  }

  function promoteFullImage(card) {
    var src = card && card.getAttribute('data-full');
    if (!src || focusImage.src === new URL(src, location.href).href) return;
    var hi = new Image();
    hi.onload = function () { focusImage.src = src; };
    hi.src = src;
  }

  function sourceRect() {
    return currentCard().getBoundingClientRect();
  }

  function flyFromSource() {
    var from = sourceRect();
    var to = focusCard.getBoundingClientRect();
    if (!from.width || !to.width) return null;
    return {
      x: from.left + from.width / 2 - (to.left + to.width / 2),
      y: from.top + from.height / 2 - (to.top + to.height / 2),
      scale: from.width / to.width
    };
  }

  function setFocusFly(fly) {
    focusCard.style.transform = fly
      ? 'translate(' + fly.x + 'px,' + fly.y + 'px) scale(' + fly.scale + ')'
      : '';
  }

  function applyFocusTilt(clientX, clientY) {
    var rect = focusCard.getBoundingClientRect();
    var percentX = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    var percentY = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    focusCard.style.transform =
      'perspective(1000px) rotateX(' + (-percentY * 15) + 'deg) rotateY(' + (percentX * 15) + 'deg) scale(1.02)';
    if (!shine) return;
    var xPercent = ((clientX - rect.left) / rect.width) * 100;
    var yPercent = ((clientY - rect.top) / rect.height) * 100;
    shine.style.background =
      'radial-gradient(circle at ' + xPercent + '% ' + yPercent + '%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 40%, transparent 80%)';
    shine.style.opacity = '1';
  }

  function resetFocusTilt(immediate) {
    if (shine) shine.style.opacity = '0';
    if (immediate) {
      focusCard.style.transition = 'none';
      focusCard.style.transform = '';
      return;
    }
    focusCard.style.transition = 'transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)';
    focusCard.style.transform = '';
  }

  function handleFocusMove(e) {
    if (!focusOpen || flying) return;
    var rect = focusCard.getBoundingClientRect();
    var over =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (over) {
      focusCard.style.transition = 'transform 0.15s ease-out';
      applyFocusTilt(e.clientX, e.clientY);
    } else {
      resetFocusTilt(false);
    }
  }

  function openFocus() {
    if (!stackReady || focusOpen || flying) return;
    var card = currentCard();
    flying = true;
    focusCard.classList.add('is-preparing');
    focusCard.style.transition = 'none';
    showFocusImage(card, true).then(function () {
      if (!flying) return;
      requestAnimationFrame(function () {
        var fly = flyFromSource();
        setFocusFly(fly);
        focusCard.getBoundingClientRect();
        requestAnimationFrame(function () {
          focusCard.classList.remove('is-preparing');
          requestAnimationFrame(function () {
            card.classList.add('is-open');
            overlay.classList.remove('is-closing');
            overlay.classList.add('is-open', 'is-dimmed');
            document.body.classList.add('is-sketch-focus');
            focusOpen = true;
            focusCard.style.transition = 'transform 0.9s ' + EASE_MORPH;
            focusCard.style.transform = '';
            setTimeout(function () {
              flying = false;
              promoteFullImage(card);
              focusCard.style.transition = 'transform 0.15s ease-out';
              addEventListener('mousemove', handleFocusMove);
            }, DUR_MORPH);
          });
        });
      });
    });
  }

  function closeFocus() {
    if (!focusOpen || flying) return;
    flying = true;
    removeEventListener('mousemove', handleFocusMove);
    resetFocusTilt(true);
    var source = currentCard();
    showFocusImage(source, true);
    var fly = flyFromSource();
    overlay.classList.add('is-closing');
    overlay.classList.remove('is-dimmed');
    focusCard.style.transition = 'transform 0.9s ' + EASE_MORPH;
    setFocusFly(fly);
    setTimeout(function () {
      if (source) source.classList.remove('is-open');
      overlay.classList.remove('is-open', 'is-closing', 'is-dimmed');
      focusCard.style.transition = 'none';
      focusCard.style.transform = '';
      focusCard.classList.add('is-preparing');
      focusImage.removeAttribute('src');
      document.body.classList.remove('is-sketch-focus');
      focusOpen = false;
      flying = false;
    }, DUR_MORPH);
  }

  function setDragging(active) {
    scroller.classList.toggle('is-dragging', active);
  }

  var settleRaf = 0;

  function cancelSettle() {
    if (settleRaf) cancelAnimationFrame(settleRaf);
    settleRaf = 0;
  }

  function finishLand(index) {
    var x = clamp(index, 0, n - 1) * slideWidth();
    scroller.scrollLeft = x;
    setProgress(index);
    commitBehind();
    requestAnimationFrame(function () {
      scroller.scrollLeft = x;
      setDragging(false);
    });
  }

  function settleTo(index) {
    if (drag) fromIndex = drag.start;
    var from = scroller.scrollLeft;
    var to = clamp(index, 0, n - 1) * slideWidth();
    var dist = Math.abs(to - from);
    cancelSettle();
    setDragging(true);
    if (dist < 0.5) {
      finishLand(index);
      return;
    }
    var dur = clamp(360 + dist * 0.4, 400, 580);
    var t0 = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - t, 4);
      scroller.scrollLeft = from + (to - from) * eased;
      if (t < 1) {
        settleRaf = requestAnimationFrame(tick);
        return;
      }
      settleRaf = 0;
      finishLand(index);
    }
    settleRaf = requestAnimationFrame(tick);
  }

  scroller.addEventListener('scroll', function () {
    if (focusOpen) return;
    setProgress(progressFromScroll());
    commitBehind();
  }, { passive: true });

  scroller.addEventListener('touchstart', beginGesture, { passive: true });
  scroller.addEventListener('scrollend', function () {
    if (drag || settleRaf) return;
    var landed = clamp(Math.round(progressFromScroll()), 0, n - 1);
    if (Math.abs(progressFromScroll() - landed) > 0.002) {
      scroller.scrollLeft = landed * slideWidth();
      setProgress(landed);
    }
    commitBehind();
  });

  if (useDrag) {
    scroller.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      cancelSettle();
      beginGesture();
      drag = {
        x: e.clientX,
        origin: scroller.scrollLeft,
        start: snapIndex(),
        moved: 0,
        lastX: e.clientX,
        lastT: performance.now(),
        vx: 0
      };
      setDragging(true);
      try { scroller.setPointerCapture(e.pointerId); } catch (err) {}
    });

    scroller.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var now = performance.now();
      var dt = now - drag.lastT;
      if (dt > 0 && dt < 64) drag.vx = drag.vx * 0.6 + ((e.clientX - drag.lastX) / dt) * 0.4;
      drag.lastX = e.clientX;
      drag.lastT = now;
      var w = slideWidth();
      var dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.moved < 4) return;
      if (e.cancelable) e.preventDefault();
      scroller.scrollLeft = clamp(drag.origin - dx, (drag.start - 1) * w, (drag.start + 1) * w);
    });

    function endDrag() {
      if (!drag) return;
      var start = drag.start;
      var moved = drag.moved;
      var vx = drag.vx;
      var p = progressFromScroll();
      drag = null;
      if (moved < 8) {
        setDragging(false);
        openFocus();
        return;
      }
      var next = start;
      if (vx < -0.35 || p - start > 0.2) next = start + 1;
      else if (vx > 0.35 || start - p > 0.2) next = start - 1;
      settleTo(next);
    }

    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointercancel', endDrag);
  } else {
    scroller.addEventListener('click', function () {
      if (Math.abs(progress - Math.round(progress)) > 0.02) return;
      openFocus();
    });
  }

  scroller.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFocus();
    } else if (e.key === 'ArrowRight' && snapIndex() < n - 1) {
      e.preventDefault();
      settleTo(snapIndex() + 1);
    } else if (e.key === 'ArrowLeft' && snapIndex() > 0) {
      e.preventDefault();
      settleTo(snapIndex() - 1);
    }
  });

  overlay.addEventListener('pointerdown', function (e) {
    if (e.target === overlay || e.target === backdrop) closeFocus();
  });

  addEventListener('wheel', function (e) {
    if (!focusOpen) return;
    if (e.ctrlKey) return;
    e.preventDefault();
    var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) >= CLOSE_WHEEL) closeFocus();
  }, { capture: true, passive: false });

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && focusOpen) closeFocus();
  });

  layout();

  function warmupStack() {
    var root = document.getElementById('homeSketches');
    Promise.all(cards.map(function (card) {
      var thumb = card.querySelector('img');
      var full = new Image();
      full.src = card.getAttribute('data-full') || (thumb && thumb.src) || '';
      return Promise.all([whenDecoded(thumb), whenDecoded(full)]);
    })).then(function () {
      if (root) root.classList.add('is-ready');
      stackReady = true;
    }).catch(function () {
      if (root) root.classList.add('is-ready');
      stackReady = true;
    });
  }

  warmupStack();
})();
