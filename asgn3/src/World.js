// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec2 a_UV;
  varying vec2 v_UV; 
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ViewMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;

  uniform int u_TexNum;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;

  void main() {
    if (u_TexNum == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_TexNum == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_TexNum == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_TexNum == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_TexNum == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }
`;

// Global variables
let canvas, gl, a_Position, u_FragColor, a_UV, u_ModelMatrix, u_GlobalRotateMatrix, u_ProjectionMatrix, u_ViewMatrix;
let u_Sampler0, u_Sampler1, u_Sampler2, u_TexNum;
let g_currMouse = [0, 0];
//let g_camX = 0, g_camY = 0, g_camZ = 3;
let g_lastUpdate = 0;
let g_paused = false;

// camera angle
let g_globalAngle = 0;
let g_bodyX = 0;

const cam = {
  pos: [0, 0, 3],
  yaw: 0, // left right rotate
  pitch: 0 // up down
}

let g_GlobalRotateMatrix = new Matrix4();
let g_ProjectionMatrix = new Matrix4();
let g_ViewMatrix = new Matrix4();

let g_direction = [0, 0, -1];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 50;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const aspect = canvas.width / canvas.height;
  g_ProjectionMatrix.setPerspective(60, aspect, 0.1, 1000);
}

function rebuildViewMat() {
  let angleX = cam.yaw * Math.PI / 180;
  let angleY = cam.pitch * Math.PI / 180;

  const eyeX = Math.cos(angleY) * Math.sin(angleX);
  const eyeY = Math.sin(angleY);
  const eyeZ = -Math.cos(angleY) * Math.cos(angleX);

  g_direction = [eyeX, eyeY, eyeZ];

  const [ex, ey, ez] = cam.pos;
  g_ViewMatrix.setLookAt(ex, ey, ez, // Eye position
    ex + eyeX, ey + eyeY, ez + eyeZ,  // Look at center
    0, 1, 0); // Up vector
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_TexNum = gl.getUniformLocation(gl.program, 'u_TexNum');

  if (!u_FragColor || !u_ModelMatrix || !u_GlobalRotateMatrix || !u_ProjectionMatrix || !u_ViewMatrix || !u_TexNum) {
    console.log('Failed to get the storage location');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler0 || !u_Sampler1 || !u_Sampler2) {
    console.log('Failed to get storage location to sampler');
  }
}

function addActionsHTML() {
  document.getElementById("resetCamButton").addEventListener("click", resetCam);
  document.getElementById("pause").addEventListener("change", function (ev) { g_paused = ev.target.checked; });

}

function initTextures() {
  var image0 = new Image();  // Create the image object
  if (!image0) {
    console.log('Failed to create the image object');
    return false;
  }
  image0.onload = function(){ sendTextureToGLSL(image0, gl.TEXTURE0, 0, u_Sampler0); };
  image0.src = '../resources/wood.png';

  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image1 object');
    return false;
  }
  image1.onload = function(){ sendTextureToGLSL(image1, gl.TEXTURE1, 1, u_Sampler1); };
  image1.src = '../resources/sky.png';

  var image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image1 object');
    return false;
  }
  image2.onload = function(){ sendTextureToGLSL(image2, gl.TEXTURE2, 2, u_Sampler2); };
  image2.src = '../resources/dirt.jpg';

  return true;
}

function sendTextureToGLSL(image, n, texNum, u_Sampler) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
  gl.activeTexture(n);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, texNum);

}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActionsHTML();

  initTextures();

  resizeCanvas();
  rebuildViewMat();

  window.addEventListener("resize", resizeCanvas, false);

  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener("mousemove", function (ev) {
    if (document.pointerLockElement !== canvas) return;

    cam.yaw += ev.movementX * 0.1;
    cam.pitch -= ev.movementY * 0.1;
    // clamp pitch to avoid flipping at top / bottom
    cam.pitch = Math.max(-88, Math.min(88, cam.pitch));

    rebuildViewMat();
    renderAllShapes();
  });

  document.addEventListener("keydown", handleKeyDown);

  gl.clearColor(0.0, 0.0, 0.0, 1.0); // black

  //renderAllShapes();

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();
  renderAllShapes();

  requestAnimationFrame(tick);
}

function translate(vector, scalar) {
  cam.pos[0] += vector[0] * scalar;
  cam.pos[1] += vector[1] * scalar;
  cam.pos[2] += vector[2] * scalar;
}

function handleKeyDown(ev) {
  const fwd   = [g_direction[0], 0, g_direction[2]]; // don't go into floor

  const lenF  = Math.hypot(fwd[0], fwd[2]);
  fwd[0] /= lenF;  fwd[2] /= lenF;
  const right = [  fwd[2], 0, -fwd[0] ];

  if (ev.key === "w") {
    translate(fwd, 0.15);
  } else if (ev.key === "s") {
    translate(fwd, -0.15);
  } else if (ev.key === "a") {
    translate(right, 0.15);
  } else if (ev.key === "d") {
    translate(right, -0.15);
  } else if (ev.key === "q") {
    cam.yaw -= 4;
  } else if (ev.key === "e") {
    cam.yaw +=  4;
  } else if (ev.key === " ") {
    cam.pos[1] += 0.2;
  }
  
  rebuildViewMat();
  renderAllShapes();
}

function convertCoordinates(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  new_x = (x - g_currMouse[0]) / canvas.width;
  new_y = (y - g_currMouse[1]) / canvas.height;

  g_currMouse = [x, y];
  return [new_x, new_y];
}

function resetCam() {
  cam.pos[0] = 0;
  cam.pos[1] = 0;
  cam.pos[2] = 3;
  resizeCanvas();
}

function updateAnimationAngles() {
  if (!g_paused) {
    g_bodyX = 5 * Math.sin(g_seconds);
  }
}
g_map = [
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0, 1],


]
function drawMap() {
  for (var i = 0; i < g_map.length; i++) {
    for (var j = 0; j < g_map[i].length; j++) {
      if (g_map[i][j] == 1) {

        //const scatterX = Math.random() * 0.5 - 0.25;
        //const scatterZ = Math.random() * 0.5 - 0.25;

        var cube = new Cube();
        cube.color = [1.0, 1.0, 1.0, 1.0];
        cube.texNum = 0;
        cube.matrix.translate(i - 2 + scatterX, -0.8 + j * 0.25, j * 0.5 + scatterZ);
        cube.matrix.scale(0.5, 0.5, 0.5);
        cube.render();
      }
    }
  }
}

function buildForest(rows, cols, density = 0.3) {
  const forest = [];                 // array of {x,z,height,jx,jz}
  for (let r = 0; r < rows; ++r) {
    for (let c = 0; c < cols; ++c) {
      if (Math.random() >= density) continue;   // empty cell

      forest.push({
        x: r - 5,
        z: c * 0.8,
        height: 1 + Math.floor(Math.random() * 3),          // 1‑3 cubes tall
        jx: (Math.random() - 0.5) * 0.2,                    // ±0.1 jitter
        jz: (Math.random() - 0.5) * 0.2
      });
    }
  }
  return forest;
}

const g_forest = buildForest(9, 12, 0.3);
function drawForest() {
  const size = 0.5;
  for (const tree of g_forest) {
    for (let h = 0; h < tree.height; ++h) {
      const cube = new Cube();
      cube.color  = [1, 1, 1, 1];
      cube.texNum = 0;

      cube.matrix.translate(
        tree.x + tree.jx,
        -0.8 + h * size,
        tree.z + tree.jz
      );
      cube.matrix.translate(0, 0.3, -5);
      cube.matrix.scale(size, size, size);
      cube.render();
    }
  }
}

function renderAllShapes() {
  var startTime = performance.now();

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_GlobalRotateMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_ProjectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_ViewMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // FLOOR
  var floor = new Cube();
  floor.color = [0.5, 0.5, 0.5, 1.0];
  floor.texNum = 2;
  floor.matrix.translate(0, -0.8, 0.0);
  floor.matrix.scale(10, 0, 10);
  floor.matrix.translate(-0.5, 1, -0.5);
  floor.render();

  // SKY
  var sky = new Cube();
  sky.color = [0.5, 0.6, 1.0, 1.0];
  sky.texNum = 1;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  //drawMap();
  drawForest();

  /* BODY
  var body = new Cube();
  body.color = [1.0, 1.0, 0.92, 1.0];
  body.texNum = -2;
  body.matrix.translate(0, -0.8, 0.0);
  body.matrix.rotate(35, 0, 1, 0);
  var upperBodyCoord = new Matrix4(body.matrix);
  body.matrix.rotate(-2, 1, 0, 0);
  body.matrix.scale(0.8, 0.1, 0.4);
  body.render();

  var upperBody = new Cube();
  upperBody.color = [1.0, 1.0, 0.5, 1.0];
  upperBody.matrix = upperBodyCoord;
  upperBody.matrix.translate(-0.05, 0.1, 0);
  upperBody.matrix.scale(0.9, 0.5, 0.4);
  upperBody.render();*/


  var duration = performance.now() - startTime;
  if (performance.now() - g_lastUpdate > 1000) {
    sendTextToHTML(" fps: " + Math.floor(1000 / duration), "numdot");
    g_lastUpdate = performance.now();
  }
}

function sendTextToHTML(text, htmlID) {
  var htmlElement = document.getElementById(htmlID);
  if (!htmlElement) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElement.innerHTML = text;
}
