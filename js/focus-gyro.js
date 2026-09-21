(function (root) {
  var REST_BETA = 90;
  var REST_GAMMA = 0;
  var RANGE = 22;
  var SMOOTH = 0.22;
  var listening = false;
  var allowed = false;
  var asked = false;
  var pending = null;
  var onTilt = null;
  var sx = 0;
  var sy = 0;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function isMobile() {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function onOrient(e) {
    if (!onTilt || e.beta == null || e.gamma == null) return;
    var px = clamp((e.gamma - REST_GAMMA) / RANGE, -1, 1);
    var py = clamp((e.beta - REST_BETA) / RANGE, -1, 1);
    sx += (px - sx) * SMOOTH;
    sy += (py - sy) * SMOOTH;
    onTilt(sx, sy);
  }

  function startListening() {
    if (listening) return;
    listening = true;
    window.addEventListener('deviceorientation', onOrient, { capture: true, passive: true });
  }

  function stopListening() {
    if (!listening) return;
    listening = false;
    window.removeEventListener('deviceorientation', onOrient, { capture: true });
  }

  function request() {
    if (!isMobile()) return Promise.resolve(false);
    if (pending) return pending;
    if (asked) return Promise.resolve(allowed);
    asked = true;
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      try {
        pending = DOE.requestPermission()
          .then(function (state) {
            allowed = state === 'granted';
            pending = null;
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
    return Promise.resolve(allowed);
  }

  root.FocusGyro = {
    isMobile: isMobile,
    request: request,
    start: function (handler) {
      if (!isMobile()) return;
      onTilt = handler;
      sx = 0;
      sy = 0;
      request().then(function (ok) {
        if (ok && onTilt === handler) startListening();
      });
    },
    stop: function () {
      onTilt = null;
      sx = 0;
      sy = 0;
      stopListening();
    }
  };
})(window);
