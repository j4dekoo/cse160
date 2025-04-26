// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;
  
// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;
// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const BRUSH = 3;

// Global variables
let canvas, gl, a_Position, u_FragColor;
let g_currMouse = [0, 0];
let g_camX = 0, g_camY = 0, g_camZ = 0;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnim = false;
let g_magentaAnim = false;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
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

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
}

function addActionsHTML(){
  document.getElementById("resetCamButton").addEventListener("click", resetCam);
  document.getElementById('angleSlider').addEventListener('mousemove', function(){ g_camX = this.value; renderAllShapes(); });
}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActionsHTML();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ g_currMouse = [ev.clientX, ev.clientY]; };
  canvas.onmousemove = function(ev){ if(ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;
function tick(){
  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();
  renderAllShapes();

  requestAnimationFrame(tick);
}

function click(ev) {

  let xy = convertCoordinates(ev);

  g_camX += xy[0] * 360
  g_camY += xy[1] * 360

  document.getElementById("angleSlider").value = g_camX;

  renderAllShapes();
}

function convertCoordinates(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  new_x = (x - g_currMouse[0]) / canvas.width;
  new_y = (y - g_currMouse[1]) / canvas.width;

  g_currMouse = [x, y];
  return [new_x, new_y];
}

function resetCam(){
  g_camX = 0;
  g_camY = 0;
  g_camZ = 0;
  document.getElementById("angleSlider").value = g_camX;
}

function updateAnimationAngles(){
  if (g_yellowAnim) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magentaAnim) {
    g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  }
}

function renderAllShapes(){
  var startTime = performance.now();

  var globalRotateMat = new Matrix4();
  globalRotateMat.rotate(g_camX, 0, 1, 0);
  globalRotateMat.rotate(g_camY, 1, 0, 0);
  globalRotateMat.rotate(g_camZ, 0, 0, 1);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // BODY
  var body = new Cube();
  body.color = [1.0, 1.0, 0.92, 1.0];
  body.matrix.translate(-0.6, -0.75, 0.0);
  var upperBodyCoord = new Matrix4(body.matrix);
  body.matrix.rotate(-2, 1, 0, 0);
  body.matrix.scale(0.7, 0.1, 0.4);
  body.render();

  var upperBody = new Cube();
  upperBody.color = [1.0, 1.0, 0.92, 1.0];
  upperBody.matrix = upperBodyCoord;
  upperBody.matrix.translate(-0.05, 0.1, 0);
  var bodyCoord = new Matrix4(upperBody.matrix);
  upperBody.matrix.scale(0.8, 0.2, 0.4);
  upperBody.render();

  var tail = new Cube();
  tail.color = [1.0, 1.0, 0.92, 1.0];
  tail.matrix = bodyCoord;
  tail.matrix.translate(-0.18, 0.23, 0.03);
  tail.matrix.rotate(-35, 0, 0, 1);
  tail.matrix.scale(0.2, 0.1, 0.35)
  tail.render();

  // NECK !!!!! FIX JOIN CONNECT !!!!
  var baseNeck = new Cube();
  baseNeck.color = [1.0, 1.0, 0.92, 1.0];
  baseNeck.matrix.translate(0.05, -0.5, 0.05);
  var neck2Coord = new Matrix4(baseNeck.matrix);
  baseNeck.matrix.rotate(-30, 0, 0, 1);
  baseNeck.matrix.scale(0.2, 0.1, 0.35);
  baseNeck.render();

  var neck2 = new Cube();
  neck2.color = [1.0, 1.0, 0.92, 1.0];
  neck2.matrix = neck2Coord;
  neck2.matrix.translate(0.15, -0.09, 0.07);
  var neck3Coord = new Matrix4(neck2.matrix);
  neck2.matrix.rotate(-15, 0, 0, 1);
  neck2.matrix.scale(0.15, 0.3, 0.18);
  neck2.render();

  var neck3 = new Cube();
  neck3.color = [1.0, 1.0, 0.92, 1.0];
  neck3.matrix = neck3Coord;
  neck3.matrix.translate(0.09, 0.18, 0.03);
  var neck4Coord = new Matrix4(neck3.matrix);
  neck3.matrix.rotate(25, 0, 0, 1);
  neck3.matrix.scale(0.15, 0.25, 0.13);
  neck3.render();

  var neck4 = new Cube();
  neck4.color = [1.0, 1.0, 0.92, 1.0];
  neck4.matrix = neck4Coord;
  neck4.matrix.translate(-0.1, 0.2, 0.001);
  var neck5Coord = new Matrix4(neck4.matrix);
  neck4.matrix.rotate(30, 0, 0, 1);
  neck4.matrix.scale(0.15, 0.25, 0.13);
  neck4.render();

  var neck5 = new Cube();
  neck5.color = [1.0, 1.0, 0.92, 1.0];
  neck5.matrix = neck5Coord;
  neck5.matrix.translate(-0.13, 0.2, 0.001);
  var neck6Coord = new Matrix4(neck5.matrix);
  neck5.matrix.rotate(5, 0, 0, 1);
  neck5.matrix.scale(0.15, 0.28, 0.13);
  neck5.render();

  var neck6 = new Cube();
  neck6.color = [1.0, 1.0, 0.92, 1.0];
  neck6.matrix = neck6Coord;
  neck6.matrix.translate(-0.02, 0.28, 0.001);
  var neck7Coord = new Matrix4(neck6.matrix);
  neck6.matrix.rotate(-20, 0, 0, 1);
  neck6.matrix.scale(0.15, 0.23, 0.13);
  neck6.render();

  var neck7 = new Cube();
  neck7.color = [1.0, 1.0, 0.92, 1.0];
  neck7.matrix = neck7Coord;
  neck7.matrix.translate(0.09, 0.22, 0.001);
  var faceCoord = new Matrix4(neck7.matrix);
  neck7.matrix.rotate(-100, 0, 0, 1);
  neck7.matrix.scale(0.15, 0.2, 0.13);
  neck7.render();

  // HEAD + BEAK
  var face = new Cube();
  face.color = [1.0, 1.0, 0.92, 1.0];
  face.matrix = faceCoord;
  face.matrix.translate(0.18, -0.03, 0.001);
  face.matrix.rotate(-120, 0, 0, 1);
  face.matrix.scale(0.15, 0.2, 0.13);
  face.render();

  // add cone here

  // WINGS
  var rightWing = new Cube();
  rightWing.color = [1.0, 1.0, 0.92, 1.0];
  rightWing.matrix = bodyCoord;
  rightWing.matrix.translate(4, 3.9, -0.5);
  var rw1Coord = new Matrix4(rightWing.matrix);
  rightWing.matrix.rotate(90, 0, 0, 1);
  rightWing.matrix.scale(1.5, 1, 0.5)
  rightWing.render();

  var rw1 = new Cube();
  rw1.color = [1.0, 0.0, 0.92, 1.0];
  rw1.matrix = rw1Coord;
  rw1.matrix.translate(-1.1, -0.1, 0.001);
  var rw2Coord = new Matrix4(rw1.matrix);
  rw1.matrix.rotate(80, 0, 0, 1);
  rw1.matrix.scale(1.5, 1, 0.5)
  rw1.render();



  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
}

function sendTextToHTML(text, htmlID){
  var htmlElement = document.getElementById(htmlID);
  if (!htmlElement){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElement.innerHTML = text;
}
