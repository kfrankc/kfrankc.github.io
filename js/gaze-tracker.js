/**
 * Gaze Tracker - Updates profile image based on mouse cursor position
 * Based on face_looker: https://github.com/kylan02/face_looker
 */

(function() {
    'use strict';

    // Configuration - must match your image generation parameters
    const P_MIN = -15.0;  // Minimum pupil position
    const P_MAX = 15.0;   // Maximum pupil position
    const STEP = 2.5;     // Step size between images
    const BASE_PATH = '/drawings/profile/variations/';
    
    let profileWrapper = null;
    let profileImage = null;
    let currentPx = 0;
    let currentPy = 0;
    
    // Image cache - stores preloaded Image objects
    const imageCache = new Map();
    
    // Animation frame tracking for smooth updates
    let animationFrameId = null;
    let pendingPx = null;
    let pendingPy = null;

    // Return-to-center animation state
    let returnAnimationId = null;
    let returnStartTime = null;
    let isReturning = false;
    const RETURN_DURATION_MS = 250; // duration of smooth return

    const isTouchDevice = () =>
        window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;

    /**
     * Round a number to the nearest step value
     */
    function roundToStep(value, step) {
        return Math.round(value / step) * step;
    }

    /**
     * Clamp a value between min and max
     */
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Convert pupil coordinates to filename
     * Handles negative values (e.g., -15.0 becomes "pxm15p0")
     */
    function coordinatesToFilename(px, py) {
        // Format positive/zero and negative values correctly
        const formatCoord = (val, prefix) => {
            if (val < 0) {
                // Negative: use "m" prefix, remove the minus sign
                const absVal = Math.abs(val);
                const intPart = Math.floor(absVal);
                const fracPart = absVal - intPart;
                return `${prefix}m${intPart}p${Math.round(fracPart * 10)}`;
            } else {
                // Positive or zero
                const intPart = Math.floor(val);
                const fracPart = val - intPart;
                return `${prefix}${intPart}p${Math.round(fracPart * 10)}`;
            }
        };

        return `gaze_${formatCoord(px, 'px')}_${formatCoord(py, 'py')}_256.webp`;
    }

    /**
     * Get mouse position relative to profile image center
     * This makes the face follow the cursor with the image as the center reference
     */
    function getRelativePosition(event) {
        if (!profileWrapper) return null;

        // Get mouse position relative to window
        const mouseX = event.clientX || event.touches?.[0]?.clientX || 0;
        const mouseY = event.clientY || event.touches?.[0]?.clientY || 0;
        
        // Get profile wrapper position and dimensions
        const rect = profileWrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from image center
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        
        // Use viewport dimensions for normalization to allow full range of gazes
        // This ensures the face can look in all directions even when cursor is far from image
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Normalize based on viewport size to allow reaching extreme gazes
        // Divide by half viewport dimension to get -1 to 1 range at screen edges
        const relativeX = deltaX / (viewportWidth / 2);
        const relativeY = deltaY / (viewportHeight / 2);
        
        // Clamp to -1..1 range to prevent extreme values
        const clampedX = clamp(relativeX, -1, 1);
        const clampedY = clamp(relativeY, -1, 1);
        
        return { relativeX: clampedX, relativeY: clampedY };
    }

    /**
     * Convert relative position to pupil coordinates
     */
    function relativeToPupilCoords(relativeX, relativeY) {
        // Scale from -1..1 to P_MIN..P_MAX
        // Invert Y so that positive Y (down) maps to negative py (looking down)
        // In screen coordinates: mouse down = positive relativeY
        // In image coordinates: looking down = negative py
        const px = relativeX * P_MAX;
        const py = -relativeY * P_MAX;  // Negate to invert the Y axis
        
        // Clamp and round to nearest step
        const clampedPx = clamp(px, P_MIN, P_MAX);
        const clampedPy = clamp(py, P_MIN, P_MAX);
        
        const roundedPx = roundToStep(clampedPx, STEP);
        const roundedPy = roundToStep(clampedPy, STEP);
        
        return { px: roundedPx, py: roundedPy };
    }

    /**
     * Preload an image and store it in cache
     */
    function preloadImage(px, py) {
        const filename = coordinatesToFilename(px, py);
        const imagePath = BASE_PATH + filename;
        const cacheKey = `${px},${py}`;
        
        // Skip if already cached or currently loading
        if (imageCache.has(cacheKey)) {
            return imageCache.get(cacheKey);
        }
        
        // Create new Image object and preload
        const img = new Image();
        img.src = imagePath;
        imageCache.set(cacheKey, img);
        
        return img;
    }
    
    /**
     * Preload commonly used images (center area and cardinal directions)
     */
    function preloadCommonImages() {
        const commonCoords = [
            // Center area (most common)
            [0, 0],
            [-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5],
            [-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5],
            // Cardinal directions
            [-5, 0], [5, 0], [0, -5], [0, 5],
            // Diagonals
            [-5, -5], [5, -5], [-5, 5], [5, 5],
        ];
        
        commonCoords.forEach(([px, py]) => {
            preloadImage(px, py);
        });
    }
    
    /**
     * Update the profile image based on pupil coordinates
     * Uses cached images when available
     */
    function updateImage(px, py) {
        if (!profileImage) return;
        
        // Only update if coordinates changed
        if (px === currentPx && py === currentPy) return;
        
        currentPx = px;
        currentPy = py;
        
        const cacheKey = `${px},${py}`;
        const cachedImg = imageCache.get(cacheKey);
        
        if (cachedImg && cachedImg.complete) {
            // Use cached image if available and loaded
            profileImage.src = cachedImg.src;
        } else {
            // Fallback to direct path (will be cached on load)
            const filename = coordinatesToFilename(px, py);
            const imagePath = BASE_PATH + filename;
            
            // Preload for next time
            preloadImage(px, py);
            
            // Update image src
            profileImage.src = imagePath;
        }
    }
    
    /**
     * Update image using requestAnimationFrame for smooth animation
     */
    function scheduleUpdate(px, py) {
        pendingPx = px;
        pendingPy = py;
        
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(() => {
                if (pendingPx !== null && pendingPy !== null) {
                    updateImage(pendingPx, pendingPy);
                    pendingPx = null;
                    pendingPy = null;
                }
                animationFrameId = null;
            });
        }
    }

    /**
     * Cancel the return-to-center animation (if active)
     */
    function cancelReturnAnimation() {
        if (returnAnimationId !== null) {
            cancelAnimationFrame(returnAnimationId);
            returnAnimationId = null;
        }
        returnStartTime = null;
        isReturning = false;
    }

    /**
     * Smoothly animate from current (px, py) back to (0, 0)
     */
    function startReturnAnimation() {
        // If already centered, nothing to do
        if (currentPx === 0 && currentPy === 0) return;

        // Start (or restart) the animation
        cancelReturnAnimation();
        isReturning = true;

        const startPx = currentPx;
        const startPy = currentPy;
        const targetPx = 0;
        const targetPy = 0;

        function step(timestamp) {
            if (returnStartTime === null) returnStartTime = timestamp;
            const elapsed = timestamp - returnStartTime;
            const t = Math.min(1, elapsed / RETURN_DURATION_MS);
            // Ease-out: quadratic (smooth finish)
            const ease = t * (2 - t);

            const lerpPx = startPx + (targetPx - startPx) * ease;
            const lerpPy = startPy + (targetPy - startPy) * ease;

            const roundedPx = roundToStep(clamp(lerpPx, P_MIN, P_MAX), STEP);
            const roundedPy = roundToStep(clamp(lerpPy, P_MIN, P_MAX), STEP);

            scheduleUpdate(roundedPx, roundedPy);

            if (t < 1 && isReturning) {
                returnAnimationId = requestAnimationFrame(step);
            } else {
                // Ensure we end exactly at center
                scheduleUpdate(0, 0);
                cancelReturnAnimation();
            }
        }

        returnAnimationId = requestAnimationFrame(step);
    }

    /**
     * Handle mouse/touch movement
     */
    function handleMovement(event) {
        // If returning, cancel the return animation upon movement
        cancelReturnAnimation();
        const pos = getRelativePosition(event);
        if (!pos) return;
        
        const coords = relativeToPupilCoords(pos.relativeX, pos.relativeY);
        // Preload adjacent images for smoother transitions
        preloadAdjacentImages(coords.px, coords.py);
        // Schedule update using requestAnimationFrame
        scheduleUpdate(coords.px, coords.py);
    }
    
    /**
     * Preload images adjacent to current position for smoother transitions
     */
    function preloadAdjacentImages(px, py) {
        const offsets = [-STEP, 0, STEP];
        offsets.forEach(offsetX => {
            offsets.forEach(offsetY => {
                const newPx = clamp(px + offsetX, P_MIN, P_MAX);
                const newPy = clamp(py + offsetY, P_MIN, P_MAX);
                // Round to ensure we're using valid step values
                const roundedPx = roundToStep(newPx, STEP);
                const roundedPy = roundToStep(newPy, STEP);
                preloadImage(roundedPx, roundedPy);
            });
        });
    }
    
    /**
     * Handle touch events (prevent default only for touch)
     */
    function handleTouch(event) {
        event.preventDefault();
        handleMovement(event);
    }

    /**
     * Reset to center (looking straight ahead)
     */
    function resetToCenter() {
        // Use scheduled update for consistency
        scheduleUpdate(0, 0);
    }

    /**
     * Initialize the gaze tracker
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Find the profile wrapper and image
        profileWrapper = document.querySelector('.profile-wrapper');
        profileImage = document.querySelector('.profile-wrapper .profile-image img');
        
        if (!profileWrapper || !profileImage) {
            console.warn('Gaze tracker: profile-wrapper or profile-image img not found');
            return;
        }

        // Preload common images first
        preloadCommonImages();
        
        // Set initial image (looking straight ahead)
        resetToCenter();

        // Add event listeners for mouse movement with throttling
        // Using passive: true for better scroll performance
        let lastMoveTime = 0;
        const throttleMs = 16; // ~60fps
        
        function throttledHandleMovement(event) {
            const now = performance.now();
            if (now - lastMoveTime >= throttleMs) {
                lastMoveTime = now;
                handleMovement(event);
            }
        }
        
        document.addEventListener('mousemove', throttledHandleMovement, { passive: true });
        
        // Add event listeners for touch (mobile support)
        // document.addEventListener('touchmove', handleTouch, { passive: false });
        
        if (isTouchDevice()) {
            let isTouchingFace = false;

            profileWrapper.addEventListener('touchstart', (e) => {
                isTouchingFace = true;
                handleMovement(e);                  // initial update
            }, { passive: true});                   // don't block scroll on start

            profileWrapper.addEventListener('touchmove', (e) => {
                if (!isTouchingFace) return;
                e.preventDefault();                 // stop page scroll only when dragging on the face
                handleMovement(e);                  
            }, { passive: false});                  // must be false to allow preventDefault

            profileWrapper.addEventListener('touchend', () => {
                isTouchingFace = false;
                startReturnAnimation();
            }, { passive: true});
        }

        // Smoothly return to center when mouse leaves the window
        document.addEventListener('mouseleave', startReturnAnimation);
        // Cancel return on re-entry
        document.addEventListener('mouseenter', cancelReturnAnimation);
        // Also handle when page visibility changes (e.g., tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                startReturnAnimation();
            } else {
                cancelReturnAnimation();
            }
        });
        
        // Cleanup animation frame on page unload
        window.addEventListener('beforeunload', () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        });
    }

    // Initialize when script loads
    init();
})();

