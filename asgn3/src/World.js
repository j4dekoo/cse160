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
  uniform sampler2D u_Sampler0;
  uniform int u_TexNum;
  void main() {
    if (u_TexNum == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_TexNum == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_TexNum == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }
`;

// Global variables
let canvas, gl, a_Position, u_FragColor, a_UV, u_ModelMatrix, u_GlobalRotateMatrix, u_ProjectionMatrix, u_ViewMatrix;
let u_Sampler0, u_TexNum;
let g_currMouse = [0, 0];
//let g_camX = 0, g_camY = 0, g_camZ = 3;
let g_lastUpdate = 0;
let g_paused = false;

// camera angle
let g_globalAngle = 0;
let g_bodyX = 0;

const cam = {
  pos: [0, 0, 3],
  yaw: 0,
  pitch: 0
}

let g_GlobalRotateMatrix = new Matrix4();
let g_ProjectionMatrix = new Matrix4();
let g_ViewMatrix = new Matrix4();


function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 50;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const aspect = canvas.width / canvas.height;
  g_ProjectionMatrix.setPerspective(60, aspect, 0.1, 100);
}

function rebuildViewMat() {
  let angleX = cam.yaw * Math.PI / 180;
  let angleY = cam.pitch * Math.PI / 180;

  const eyeX = Math.cos(angleY) * Math.sin(angleX);
  const eyeY = Math.sin(angleY);
  const eyeZ = -Math.cos(angleY) * Math.cos(angleX);

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
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_TexNum = gl.getUniformLocation(gl.program, 'u_TexNum');

  if (!u_FragColor || !u_ModelMatrix || !u_GlobalRotateMatrix || !u_ProjectionMatrix || !u_ViewMatrix || !u_Sampler0 || !u_TexNum) {
    console.log('Failed to get the storage location');
    return;
  }
}

function addActionsHTML() {
  document.getElementById("resetCamButton").addEventListener("click", resetCam);
  document.getElementById("pause").addEventListener("change", function (ev) { g_paused = ev.target.checked; });

}

function initTextures() {

  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ sendTextureToGLSL(image); };
  // Tell the browser to load an image
  image.src = '../resources/sky.jpg';

  return true;
}

function sendTextureToGLSL(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);
  
  //gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActionsHTML();

  initTextures();

  // FIX CAMERA ANGLE SLIDER AND CLICK SCROLL CRASHING
  resizeCanvas();
  rebuildViewMat();

  window.addEventListener("resize", resizeCanvas, false);
  canvas.addEventListener("wheel", function (ev) {
    if (ev.deltaY < 0) {  
      cam.pos[2] -= 0.4;
    } else {
      cam.pos[2] += 0.4;
    }
    cam.pos[2] = Math.max(1, Math.min(15, cam.pos[2]));
    rebuildViewMat();
    renderAllShapes();
  })

  document.addEventListener("keydown", handleKeyDown);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function (ev) { handleMouseDown(ev); };
  //canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
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


function click(ev) {

  let xy = convertCoordinates(ev);

  cam.pos[0] += xy[0] * 180;
  cam.pos[1] += xy[1] * 180;

  cam.pos[1] = Math.max(-2, Math.min(85, cam.pos[1]));

  rebuildViewMat();
  renderAllShapes();
}

function handleMouseDown(ev) {
  g_currMouse = [ev.clientX, ev.clientY]

}

function handleKeyDown(ev) {
  if (ev.key === "w") {
    cam.pos[2] -= 0.2;
  } else if (ev.key === "s") {
    cam.pos[2] += 0.2;
  } else if (ev.key === "a") {
    cam.pos[0] -= 0.2;
  } else if (ev.key === "d") {
    cam.pos[0] += 0.2;
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
g_map = []
function drawMap() {

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
  floor.texNum = 0;
  floor.matrix.translate(0, -0.8, 0.0);
  floor.matrix.scale(10, 0, 10);
  floor.matrix.translate(-0.5, 1, -0.5);
  floor.render();

  // SKY
  var sky = new Cube();
  sky.color = [0.5, 0.5, 0.5, 1.0];
  sky.texNum = -1;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  // BODY
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
  upperBody.render();



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
