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
    var to = clamp(Math.round(progress), 0, n - 1);
    if (to === fromIndex) return;
    behindIndex = fromIndex;
    fromIndex = to;
  }

  function updateDirection(next) {
    if (Math.abs(next - progress) < 0.03) return;
    direction = next > progress ? 1 : -1;
  }

  function updateIsFirst(next) {
    for (var i = 0; i < n; i++) {
      var d = next - i;
      var prev = progress - i;
      if (d * prev <= 0) isFirst[i] = true;
      if (Math.abs(d) >= 1) isFirst[i] = false;
    }
  }

  function cardZIndex(index, first) {
    if (first) return 100;
    var front = clamp(Math.round(progress), 0, n - 1);
    var behind = fromIndex !== front ? fromIndex : behindIndex;
    if (behind < 0 || behind === front) return 20 - Math.abs(progress - index);
    if (index === behind) return 80;
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
    var scale = first ? transform(Math.min(ad, 1), [0, 0.5, 1], [1, 0.97, 1]) : 1;
    var zIndex = cardZIndex(index, first);
    var z = transform(d, [-2, -1, 0, 1, 2], [-180, -90, 0, -90, -180], true) + (zIndex - 50) * 0.35;
    return {
      x: x,
      rotateY: rotateY,
      rotateZ: -1.1 * d,
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

  function showFocusImage(card) {
    var img = card.querySelector('img');
    var w = Number(card.getAttribute('data-width')) || (img && img.naturalWidth) || 1;
    var h = Number(card.getAttribute('data-height')) || (img && img.naturalHeight) || 1;
    focusCard.style.setProperty('--img-w', String(w));
    focusCard.style.setProperty('--img-h', String(h));
    focusImage.alt = card.getAttribute('data-title') || '';
    focusImage.src = card.getAttribute('data-full') || (img && img.src) || '';
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
    if (focusOpen || flying) return;
    flying = true;
    focusOpen = true;
    document.body.classList.add('is-sketch-focus');
    showFocusImage(currentCard());
    focusCard.classList.add('is-preparing');
    overlay.classList.add('is-open');
    backdrop.classList.remove('is-out');
    requestAnimationFrame(function () {
      var fly = flyFromSource();
      focusCard.style.transition = 'none';
      setFocusFly(fly);
      currentCard().classList.add('is-open');
      focusCard.classList.remove('is-preparing');
      requestAnimationFrame(function () {
        backdrop.classList.add('is-in');
        focusCard.style.transition = 'transform 0.9s ' + EASE_MORPH;
        focusCard.style.transform = '';
        setTimeout(function () {
          flying = false;
          focusCard.style.transition = 'transform 0.15s ease-out';
          addEventListener('mousemove', handleFocusMove);
        }, DUR_MORPH);
      });
    });
  }

  function closeFocus() {
    if (!focusOpen || flying) return;
    flying = true;
    removeEventListener('mousemove', handleFocusMove);
    resetFocusTilt(true);
    var source = currentCard();
    var fly = flyFromSource();
    backdrop.classList.remove('is-in');
    backdrop.classList.add('is-out');
    focusCard.style.transition = 'transform 0.9s ' + EASE_MORPH;
    setFocusFly(fly);
    setTimeout(function () {
      overlay.classList.remove('is-open');
      backdrop.classList.remove('is-out');
      focusCard.style.transition = 'none';
      focusCard.style.transform = '';
      focusImage.removeAttribute('src');
      if (source) source.classList.remove('is-open');
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

  function settleTo(index) {
    if (drag) fromIndex = drag.start;
    var from = scroller.scrollLeft;
    var to = clamp(index, 0, n - 1) * slideWidth();
    var dist = Math.abs(to - from);
    cancelSettle();
    if (dist < 0.5) {
      scroller.scrollLeft = to;
      setDragging(false);
      return;
    }
    var dur = clamp(360 + dist * 0.4, 400, 580);
    var t0 = performance.now();
    setDragging(true);
    function tick(now) {
      var t = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - t, 4);
      scroller.scrollLeft = from + (to - from) * eased;
      if (t < 1) {
        settleRaf = requestAnimationFrame(tick);
        return;
      }
      settleRaf = 0;
      scroller.scrollLeft = to;
      setDragging(false);
    }
    settleRaf = requestAnimationFrame(tick);
  }

  scroller.addEventListener('scroll', function () {
    if (focusOpen) return;
    setProgress(progressFromScroll());
    if (Math.abs(progress - Math.round(progress)) < 0.02) commitBehind();
  }, { passive: true });

  scroller.addEventListener('touchstart', beginGesture, { passive: true });
  scroller.addEventListener('scrollend', commitBehind);

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
      if (dt > 0) drag.vx = (e.clientX - drag.lastX) / dt;
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
})();
