var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function resize() {
    let width = document.documentElement.clientWidth;
    let height = document.documentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;
    drawStars(width, height, 40);
}

function init() {
    resize();
    window.onresize = resize;
}

function fillRect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
}

function fillCirc(x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
}

function drawStars(w, h, r) {
    let sampler = poissonDiscSampler(w, h, r);
    let sample;
    let radius
    let alpha
    while ((sample = sampler())) {
        radius = Math.random() * 1.5;
        alpha = Math.random();
        fillCirc(sample[0], sample[1], radius, `rgba(255,255,255,${alpha})`);
    }
}

// taken from https://github.com/beaugunderson/poisson-disc-sampler
function poissonDiscSampler(width, height, radius, rng) {
    var k = 30; // maximum number of samples before rejection
    var radius2 = radius * radius;
    var R = 3 * radius2;
    var cellSize = radius * Math.SQRT1_2;
    var gridWidth = Math.ceil(width / cellSize);
    var gridHeight = Math.ceil(height / cellSize);
    var grid = new Array(gridWidth * gridHeight);
    var queue = [];
    var queueSize = 0;
    var sampleSize = 0;

    rng = rng || Math.random;

    function far(x, y) {
        var i = (x / cellSize) | 0;
        var j = (y / cellSize) | 0;
        var i0 = Math.max(i - 2, 0);
        var j0 = Math.max(j - 2, 0);
        var i1 = Math.min(i + 3, gridWidth);
        var j1 = Math.min(j + 3, gridHeight);

        for (j = j0; j < j1; ++j) {
            var o = j * gridWidth;

            for (i = i0; i < i1; ++i) {
                var s;

                if ((s = grid[o + i])) {
                    var dx = s[0] - x,
                        dy = s[1] - y;

                    if (dx * dx + dy * dy < radius2) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function sample(x, y) {
        var s = [x, y];
        queue.push(s);
        grid[gridWidth * ((y / cellSize) | 0) + ((x / cellSize) | 0)] = s;
        sampleSize++;
        queueSize++;
        return s;
    }

    return function() {
        if (!sampleSize) {
            return sample(rng() * width, rng() * height);
        }
        // Pick a random existing sample and remove it from the queue.
        while (queueSize) {
            var i = (rng() * queueSize) | 0;
            var s = queue[i];
            // Make a new candidate between [radius, 2 * radius] from the existing
            // sample.
            for (var j = 0; j < k; ++j) {
                var a = 2 * Math.PI * rng();
                var r = Math.sqrt(rng() * R + radius2);
                var x = s[0] + r * Math.cos(a);
                var y = s[1] + r * Math.sin(a);
                // Reject candidates that are outside the allowed extent,
                // or closer than 2 * radius to any existing sample.
                if (x >= 0 && x < width && y >= 0 && y < height && far(x, y)) {
                    return sample(x, y);
                }
            }
            queue[i] = queue[--queueSize];
            queue.length = queueSize;
        }
    };
}

init();