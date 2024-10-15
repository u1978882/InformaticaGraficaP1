var gl, program;
var grid, nextGrid;
var w = 5;
var cols, rows;
var hueValue = 200;
var mouseDown = false;
const colorPicker = document.getElementById('colorPicker');
const rainbowInput = document.getElementById('rainbow');
const removeInput = document.getElementById('remove');
const colorValue = document.getElementById('colorValue');

var currentColor = 1
var rainbow = true
var remove = false
colorPicker.addEventListener('input', (event) => {
    colorValue.textContent = event.target.value;
    currentColor = hexToHue(colorPicker.value)
});

rainbowInput.addEventListener('change', (event) => {
    rainbow = rainbowInput.checked;
});

removeInput.addEventListener('change', (event) => {
    remove = removeInput.checked;
});

function hexToHue(hex) {
    // Remove the hash (#) if present
    hex = hex.replace(/^#/, '');

    // Parse the hex color to get the RGB values
    let r = parseInt(hex.slice(0, 2), 16) / 255;
    let g = parseInt(hex.slice(2, 4), 16) / 255;
    let b = parseInt(hex.slice(4, 6), 16) / 255;

    // Calculate the maximum and minimum values
    let Cmax = Math.max(r, g, b);
    let Cmin = Math.min(r, g, b);
    let delta = Cmax - Cmin;
    let hue = 0;

    // Calculate the hue based on which RGB component is the maximum
    if (delta !== 0) {
        if (Cmax === r) {
            hue = (60 * ((g - b) / delta) + 360) % 360; // Adjust for negative values
        } else if (Cmax === g) {
            hue = (60 * ((b - r) / delta) + 120) % 360;
        } else if (Cmax === b) {
            hue = (60 * ((r - g) / delta) + 240) % 360;
        }
    }

    return Math.round(hue); // Return the hue rounded to the nearest integer
}

// Initialize a 2D array
function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows).fill(0); // Fill with 0s
    }
    return arr;
}

// Check bounds
function withinCols(i) {
    return i >= 0 && i <= cols - 1;
  }
  
  // Check if a column is within the bounds
function withinRows(j) {
    return j >= 0 && j <= rows - 1;
}

function withinBounds(i, j) {
    return i >= 0 && i < cols && j >= 0 && j < rows;
  }

// Get WebGL context
function getWebGLContext() {
    var canvas = document.getElementById("myCanvas");
    return canvas.getContext("webgl2");
}

// Initialize WebGL and shaders
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

    // Track mouse events
    let canvas = document.getElementById("myCanvas");
    canvas.addEventListener('mousedown', () => mouseDown = true);
    canvas.addEventListener('mouseup', () => mouseDown = false);
    canvas.addEventListener('mousemove', onMouseMove);

    requestAnimationFrame(drawScene);
}

// Handle mouse drag
function onMouseMove(event) {
    if (!mouseDown) return;

    let rect = event.target.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    let mouseCol = Math.floor(mouseX / w);
    let mouseRow = Math.floor(mouseY / w);

    let matrix = 5;
    let extent = Math.floor(matrix / 2);

    for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
            let col = mouseCol + i;
            let row = mouseRow + j;
            if (withinBounds(col, row)) {
                if (remove)
                    grid[col][row] = 0;
                else
                    grid[col][row] = rainbow ? hueValue : currentColor;
            }
        }
    }

    hueValue = (hueValue + 1) % 360;
}

// Initialize shaders
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

// Initialize rendering
function initRendering() {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
}

// Draw each grid cell
function drawGrid() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] > 0) {
                drawCell(i, j, grid[i][j]);
            }
        }
    }

}

function hueToRgb(hue) {
    const h = hue % 360; // Keep hue within 0-359
    const c = 1; // Chroma
    const x = c * (1 - Math.abs((h / 60) % 2 - 1)); // Secondary component
    const m = 0; // Match

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

    // Normalize RGB values to [0, 1] range
    return [r, g, b];
}

// Draw individual cell as a quad
function drawCell(i, j, hue) {
    let x = i * w / 300 - 1; // Scale coordinates to -1 to 1
    let y = 1 - j * w / 300;
    const [r, g, b] = hueToRgb(hue);

    // GPTTodo: How does this work
    let vertices = new Float32Array([
        x, y, 0.0, r, g, b, 0, 
        x + w / 300, y, 0.0, r, g, b, 0, 
        x + w / 300, y - w / 300, 0.0, r, g, b, 0, 
        x, y - w / 300, 0.0, r, g, b, 0, 
    ]);
  
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

// Update grid state
function updateGrid() {
    // Loop over each cell, starting from the bottom row to simulate gravity
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows ; j++) {
            let state = grid[i][j]; // Get current cell state

            // If this cell contains sand
            if (state > 0) {
                // What is below?
                let below = grid[i][j + 1];

                // Randomly fall left or right
                let dir = Math.random() < 0.5 ? -1 : 1; // Random direction (-1 or 1)
                
                // Check below left or right
                let belowA = -1;
                let belowB = -1;
                if (withinCols(i + dir)) {
                    belowA = grid[i + dir][j + 1];
                }
                if (withinCols(i - dir)) {
                    belowB = grid[i - dir][j + 1];
                }
                // Can it fall below, left, or right?
                if (below === 0) {
                    nextGrid[i][j + 1] = state;
                  } else if (belowA === 0) {
                    nextGrid[i + dir][j + 1] = state;
                  } else if (belowB === 0) {
                    nextGrid[i - dir][j + 1] = state;
                  // Stay put!
                  } else {
                    nextGrid[i][j] = state;
                  }
            }
        }
    }

    // Swap the grids
    grid = nextGrid;
    nextGrid = make2DArray(cols, rows);
}



// Render the scene
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);  // Clear the canvas for each frame
    drawGrid();                     // Draw the updated grid
    updateGrid();                   // Update the grid for the next frame
    requestAnimationFrame(drawScene);  // Loop the drawing
}






initWebGL();
