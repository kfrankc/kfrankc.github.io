(function (root) {
  var RANGE = 8;
  var CALIBRATE_N = 10;
  var FOLLOW = 26;
  var listening = false;
  var allowed = false;
  var asked = false;
  var pending = null;
  var onTilt = null;
  var targetX = 0;
  var targetY = 0;
  var currentX = 0;
  var currentY = 0;
  var hasSample = false;
  var snapNext = false;
  var raf = 0;
  var lastT = 0;
  var restGamma = 0;
  var restBeta = 70;
  var restGammaSum = 0;
  var restBetaSum = 0;
  var restN = 0;
  var calibrated = false;

  function resetRest() {
    restGamma = 0;
    restBeta = 70;
    restGammaSum = 0;
    restBetaSum = 0;
    restN = 0;
    calibrated = false;
    hasSample = false;
    targetX = 0;
    targetY = 0;
    currentX = 0;
    currentY = 0;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function isMobile() {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function setTarget(gamma, beta) {
    if (gamma == null || beta == null) return;
    if (!calibrated) {
      restGammaSum += gamma;
      restBetaSum += beta;
      restN += 1;
      targetX = 0;
      targetY = 0;
      hasSample = true;
      if (restN < CALIBRATE_N) return;
      restGamma = restGammaSum / restN;
      restBeta = restBetaSum / restN;
      calibrated = true;
      snapNext = true;
    }
    targetX = clamp((gamma - restGamma) / RANGE, -1, 1);
    targetY = clamp((restBeta - beta) / RANGE, -1, 1);
    hasSample = true;
  }

  function onOrient(e) {
    setTarget(e.gamma, e.beta);
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!onTilt || !hasSample) return;
    var dt = lastT ? Math.min(0.048, (now - lastT) / 1000) : 0.016;
    lastT = now;
    if (snapNext) {
      currentX = targetX;
      currentY = targetY;
      snapNext = false;
    } else {
      var k = 1 - Math.exp(-FOLLOW * dt);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
    }
    onTilt(currentX, currentY);
  }

  function startListening() {
    if (listening) return;
    listening = true;
    window.addEventListener('deviceorientation', onOrient, { capture: true, passive: true });
    if (!raf) {
      lastT = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  function stopListening() {
    if (listening) {
      listening = false;
      window.removeEventListener('deviceorientation', onOrient, { capture: true });
    }
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    lastT = 0;
  }

  function request() {
    if (!isMobile()) return Promise.resolve(false);
    if (pending) return pending;
    if (asked) {
      if (allowed) startListening();
      return Promise.resolve(allowed);
    }
    asked = true;
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      try {
        pending = DOE.requestPermission()
          .then(function (state) {
            allowed = state === 'granted';
            pending = null;
            if (allowed) startListening();
            return allowed;
          })
          .catch(function () {
            allowed = false;
            pending = null;
            return false;
          });
        return pending;
      } catch (err) {
        allowed = false;
        return Promise.resolve(false);
      }
    }
    allowed = typeof DOE !== 'undefined';
    if (allowed) startListening();
    return Promise.resolve(allowed);
  }

  root.FocusGyro = {
    isMobile: isMobile,
    request: request,
    start: function (handler) {
      if (!isMobile()) return;
      onTilt = handler;
      resetRest();
      snapNext = true;
      lastT = 0;
      request();
    },
    stop: function () {
      onTilt = null;
      snapNext = false;
      resetRest();
      stopListening();
    }
  };
})(window);
