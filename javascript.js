var gl, program;
var grid, nextGrid;
var w = 5;
var dotSize = 5;
var cols, rows;
var hueValue = 100;
var mouseDown = false;
var solid = false;
const colorPicker = document.getElementById('colorPicker');
const rainbowInput = document.getElementById('rainbow');
const removeInput = document.getElementById('remove');
const colorValue = document.getElementById('colorValue');
const fallingInput = document.getElementById('falling');
const dotSizeImput = document.getElementById('dotSize');
const solidInput = document.getElementById('solid');

var currentColor = hexToHue(colorPicker.value)
var rainbow = false
var remove = false
var falling = true
colorPicker.addEventListener('input', (event) => {
    colorValue.textContent = event.target.value;
    currentColor = hexToHue(colorPicker.value)
});

fallingInput.addEventListener('change', (event) => {
    falling = fallingInput.checked;
});

solidInput.addEventListener('change', (event) => {
    solid = solidInput.checked;
    if (solid) {
        removeInput.checked = false
        remove = false
    }
});

dotSizeImput.addEventListener('change', (event) => {
    dotSize = dotSizeImput.value;
});

rainbowInput.addEventListener('change', (event) => {
    rainbow = rainbowInput.checked;
    if (rainbow) {
        removeInput.checked = false
        remove = false
        colorPicker.disabled = true
        colorPicker.title = "Disabled while rainbow is on"
        colorValue.textContent = "Rainbow";
    } else {
        colorPicker.disabled = false
        colorPicker.title = "Chose the color to be the new sand"
        colorValue.textContent = colorPicker.value;
    }
});

removeInput.addEventListener('change', (event) => {
    remove = removeInput.checked;
    if (remove) {
        colorValue.textContent = "Remove";
        rainbowInput.checked = false
        rainbow = false
        colorPicker.disabled = true
        solidInput.checked = false
        solid = false
    } else {
        colorPicker.true = true
        colorValue.textContent = colorPicker.value;
    }
});

function hexToHue(hex) {
    hex = hex.replace(/^#/, '');

    let r = parseInt(hex.slice(0, 2), 16) / 255;
    let g = parseInt(hex.slice(2, 4), 16) / 255;
    let b = parseInt(hex.slice(4, 6), 16) / 255;

    let Cmax = Math.max(r, g, b);
    let Cmin = Math.min(r, g, b);
    let delta = Cmax - Cmin;
    let hue = 0;

    if (delta !== 0) {
        if (Cmax === r) {
            hue = (60 * ((g - b) / delta) + 360) % 360;
        } else if (Cmax === g) {
            hue = (60 * ((b - r) / delta) + 120) % 360;
        } else if (Cmax === b) {
            hue = (60 * ((r - g) / delta) + 240) % 360;
        }
    }

    return Math.round(hue);
}

function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows).fill(0);
    }
    return arr;
}

function withinCols(i) {
    return i >= 0 && i <= cols - 1;
  }
  
function withinRows(j) {
    return j >= 0 && j <= rows - 1;
}

function withinBounds(i, j) {
    return i >= 0 && i < cols && j >= 0 && j < rows;
  }

function getWebGLContext() {
    var canvas = document.getElementById("myCanvas");
    return canvas.getContext("webgl2");
}


function initWebGL() {
    gl = getWebGLContext();
    if (!gl) {
        alert("WebGL 2.0 not available");
        return;
    }

    initShaders();
    initRendering();


    
    cols = Math.floor(600 / w);
    rows = Math.floor(600 / w);
    grid = make2DArray(cols, rows);
    nextGrid = make2DArray(cols, rows);

    let canvas = document.getElementById("myCanvas");
    canvas.addEventListener('mousedown', () => mouseDown = true);
    canvas.addEventListener('mouseup', () => mouseDown = false);
    canvas.addEventListener('mousemove', onMouseMove);
    requestAnimationFrame(drawScene);
}



function onMouseMove(event) {
    if (!mouseDown) return;

    let rect = event.target.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    let mouseCol = Math.floor(mouseX / w);
    let mouseRow = Math.floor(mouseY / w);

    let matrix = dotSize;
    let extent = Math.floor(matrix / 2);

    for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
            let col = mouseCol + i;
            let row = mouseRow + j;
            if (withinBounds(col, row)) {
                if (solid) {
                    grid[col][row] = -1;
                } else {
                    if (remove)
                        grid[col][row] = 0;
                    else
                        grid[col][row] = rainbow ? hueValue : currentColor;
                }
            }
        }
    }

    hueValue = (hueValue + 1) % 360;
}

function initShaders() {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, document.getElementById("myVertexShader").text);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertexShader));
        return null;
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, document.getElementById("myFragmentShader").text);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(fragmentShader));
        return null;
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
}

function initRendering() {
    gl.clearColor(0.1, 0.1, 0.1, 0.1);
}

function drawGrid() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] > 0 || grid[i][j] < 0) {
                drawCell(i, j, grid[i][j]);
            }
        }
    }

}

function hueToRgb(hue) {
    const h = hue % 360;
    const c = 1;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = 0;

    let r, g, b;

    if (h < 60) {
        r = c; g = x; b = m;
    } else if (h < 120) {
        r = x; g = c; b = m;
    } else if (h < 180) {
        r = m; g = c; b = x;
    } else if (h < 240) {
        r = m; g = x; b = c;
    } else if (h < 300) {
        r = x; g = m; b = c;
    } else {
        r = c; g = m; b = x;
    }

    return [r, g, b];
}

function drawCell(i, j, hue) {
    let x = i * w / 300 - 1;
    let y = 1 - j * w / 300;
    let vertices

    if (hue == -1) {
        vertices = new Float32Array([
            x, y, 0.0, 255, 255, 255, 0, 
            x + w / 300, y, 0.0, 255, 255, 255, 0,
            x + w / 300, y - w / 300, 0.0, 255, 255, 255, 0,
            x, y - w / 300, 0.0, 255, 255, 255, 0,
        ]);
    } else {
        const [r, g, b] = hueToRgb(hue);

        vertices = new Float32Array([
            x, y, 0.0, r, g, b, 0, 
            x + w / 300, y, 0.0, r, g, b, 0, 
            x + w / 300, y - w / 300, 0.0, r, g, b, 0, 
            x, y - w / 300, 0.0, r, g, b, 0, 
        ]);
    }

  
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
    var position = gl.getAttribLocation(program, "VertexPosition");
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 7 * 4, 0);
    gl.enableVertexAttribArray(position);
  
    var color = gl.getAttribLocation(program, "VertexColor");
    gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
    gl.enableVertexAttribArray(color);
  
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }

function updateGrid() {
    if (!falling) {
        return
    }
    for (let i = cols - 1; i > 0; i--) {
        for (let j = rows - 1; j > 0 ; j--) {
            let state = grid[i][j];

            if (state > 0) {
                let below = grid[i][j + 1];

                let dir = Math.random() < 0.5 ? -1 : 1;
                
                
                let belowA = -1;
                let belowB = -1;
                if (withinCols(i + dir)) {
                    belowA = grid[i + dir][j + 1];
                }
                if (withinCols(i - dir)) {
                    belowB = grid[i - dir][j + 1];
                }
                
                if (below == 0) {
                    nextGrid[i][j + 1] = state;
                } else if (belowA == 0) {
                    nextGrid[i + dir][j + 1] = state;
                } else if (belowB == 0) {
                    nextGrid[i - dir][j + 1] = state;
                } else {
                    nextGrid[i][j] = state;
                }
            } else if (state == -1) {
                nextGrid[i][j] = state;
            }
        }
    }

    grid = nextGrid;
    nextGrid = make2DArray(cols, rows);
}




function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawGrid();
    updateGrid();
    requestAnimationFrame(drawScene);
}

initWebGL();
