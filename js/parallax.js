(function () {
var canvas = document.getElementById('canvas');
if (!canvas) return;

var context = canvas.getContext('2d');
var loading_screen = document.getElementById('loading');

var loaded = false;
var load_counter = 0;
var DRAW_PAD = 80;

var background = new Image();
var mountains = new Image();
var floaters_back = new Image();
var shadows = new Image();
var frank = new Image();
var mask = new Image();
var floaters_front = new Image();

var base_url = window.location.origin;

var layer_list = [
    {
        'image': background,
        'src': base_url + '/drawings/parallax/layer_1.png',
        'z_index': -2.25,
        'position': {x: 0, y: 0},
        'blend': null,
        'opacity': 1
    },
    {
        'image': mountains,
        'src': base_url + '/drawings/parallax/layer_2.png',
        'z_index': -2,
        'position': {x: 0, y: 0},
        'blend': null,
        'opacity': 1
    },
    {
        'image': floaters_back,
        'src': base_url + '/drawings/parallax/layer_3.png',
        'z_index': -1.5,
        'position': {x: 0, y: 0},
        'blend': null,
        'opacity': 1
    },
    {
        'image': shadows,
        'src': base_url + '/drawings/parallax/layer_4.png',
        'z_index': -1,
        'position': {x: 0, y: 0},
        'blend': 'multiply',
        'opacity': 1
    },
    {
        'image': frank,
        'src': base_url + '/drawings/parallax/layer_5.png',
        'z_index': -0.5,
        'position': {x: 0, y: 0},
        'blend': null,
        'opacity': 1
    },
    {
        'image': mask,
        'src': base_url + '/drawings/parallax/layer_6.png',
        'z_index': 0,
        'position': {x: 0, y: 0},
        'blend': null,
        'opacity': 1
    },
    {
        'image': floaters_front,
        'src': base_url + '/drawings/parallax/layer_7.png',
        'z_index': 2,
        'position': {x: 0, y: 0},
        'blend': null,
        'opacity': 0.9
    }
];

layer_list.forEach(function(layer, index) {
    layer.image.onload = function() {
        load_counter += 1;
        if (load_counter >= layer_list.length) {
            var first = layer_list[0].image;
            if (first.naturalWidth && first.naturalHeight) {
                canvas.width = first.naturalWidth + DRAW_PAD * 2;
                canvas.height = first.naturalHeight + DRAW_PAD * 2;
            }
            sizeCanvasDisplay();
            requestAnimationFrame(drawCanvas);
        }
    }
    layer.image.src = layer.src;
});

function sizeCanvasDisplay() {
    var artW = canvas.width - DRAW_PAD * 2;
    var artH = canvas.height - DRAW_PAD * 2;
    var box = canvas.parentElement.getBoundingClientRect();
    if (!artW || !artH || !box.width || !box.height) return;
    var scale = Math.min(box.width / artW, box.height / artH);
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}

window.addEventListener('resize', sizeCanvasDisplay);

function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    TWEEN.update();

    var rotate_x = (pointer.y * -0.15) + (motion.y * -1.2);
    var rotate_y = (pointer.x * 0.15) + (motion.x * 1.2);

    var transform_string = "rotateX(" + rotate_x + "deg) rotateY(" + rotate_y + "deg)";

    canvas.style.transform = transform_string

    layer_list.forEach(function(layer, index) {

        layer.position = getOffset(layer);

        if (layer.blend) {
            context.globalCompositeOperation = layer.blend;
        } else {
            context.globalCompositeOperation = 'source-over';
        }
        context.globalAlpha = layer.opacity;
        context.drawImage(layer.image, DRAW_PAD + layer.position.x, DRAW_PAD + layer.position.y);
    });

    requestAnimationFrame(drawCanvas);
}

function getOffset(layer) {
    var touch_multiplier = 0.3;
    var touch_offset_x = pointer.x * layer.z_index * touch_multiplier;
    var touch_offset_y = pointer.y * layer.z_index * touch_multiplier;

    var motion_multiplier = 2.5;
    var motion_offset_x = motion.x * layer.z_index * motion_multiplier;
    var motion_offset_y = motion.y * layer.z_index * motion_multiplier;

    var offset = {
        x: touch_offset_x + motion_offset_x,
        y: touch_offset_y + motion_offset_y
    };

    return offset;
}

var moving = false;

var pointer_initial = {
    x: 0,
    y: 0
};

var pointer = {
    x: 0,
    y: 0
};

canvas.addEventListener('touchstart', pointerStart, {passive:false});
canvas.addEventListener('mousedown', pointerStart, {passive:false});

function pointerStart(event) {
    moving = true;
    canvas.classList.add('is-dragging');
    if (event.type === 'touchstart') {
        pointer_initial.x = event.touches[0].clientX;
        pointer_initial.y = event.touches[0].clientY;
    } else if (event.type === 'mousedown') {
        pointer_initial.x = event.clientX;
        pointer_initial.y = event.clientY;
    }
}

canvas.addEventListener('touchmove', pointerMove, {passive:false});
window.addEventListener('mousemove', pointerMove, {passive:false});

function pointerMove(event) {
    event.preventDefault();
    if (moving === true) {
        var current_x = 0;
        var current_y = 0;
        if (event.type === 'touchmove') {
            current_x = event.touches[0].clientX;
            current_y = event.touches[0].clientY;
        } else if (event.type === 'mousemove') {
            current_x = event.clientX;
            current_y = event.clientY;
        }
        var constraint = 70;
        if (Math.abs(current_x - pointer_initial.x) > constraint) {
            current_x = constraint;
        } else {
            pointer.x  = current_x - pointer_initial.x;
        }
        if (Math.abs(current_y - pointer_initial.y) > constraint) {
            current_y = constraint;
        } else {
            pointer.y = current_y - pointer_initial.y;
        }
    }
}

canvas.addEventListener('touchmove', function(event) {
    event.preventDefault();
});

canvas.addEventListener('mousemove', function(event) {
    event.preventDefault();
});

window.addEventListener('touchend', function(event) {
    endGesture();
});

window.addEventListener('mouseup', function(event) {
    endGesture();
});

function endGesture() {
    moving = false;
    canvas.classList.remove('is-dragging');

    TWEEN.removeAll();
    var pointer_tween = new TWEEN.Tween(pointer).to({x: 0, y: 0}, 300).easing(TWEEN.Easing.Back.Out).start();
}

var motion_initial = {
    x: null,
    y: null
};

var motion = {
    x: 0,
    y: 0
};

window.addEventListener('deviceorientation', function(event) {
    if (!motion_initial.x && !motion_initial.y) {
        motion_initial.x = event.beta;
        motion_initial.y = event.gamma;
    }

    if (window.orientation === 0) {
        motion.x = event.gamma - motion_initial.y;
        motion.y = event.beta - motion_initial.x;
    } else if (window.orientation === 90) {
        motion.x = event.beta - motion_initial.x;
        motion.y = -event.gamma + motion_initial.y;
    } else if (window.orientation === -90) {
        motion.x = -event.beta + motion_initial.x;
        motion.y = event.gamma  - motion_initial.y;
    } else {
        motion.x = -event.gamma + motion_initial.y;
        motion.y = -event.beta + motion_initial.x;
    }
});

window.addEventListener('orientationchange', function(event) {
    motion_initial.x = 0;
    motion_initial.y = 0;
});

})();
