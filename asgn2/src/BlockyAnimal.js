// ColoredPoint.js (c) 2012 matsuda
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
  document.getElementById('onYellow').addEventListener('click', function(){ g_yellowAnim = true; });
  document.getElementById('offYellow').addEventListener('click', function(){ g_yellowAnim = false; });
  document.getElementById('onMagenta').addEventListener('click', function(){ g_magentaAnim = true; });
  document.getElementById('offMagenta').addEventListener('click', function(){ g_magentaAnim = false; });

  document.getElementById('yellowSlider').addEventListener('mousemove', function(){ g_yellowAngle = this.value; renderAllShapes(); });
  document.getElementById('magentaSlider').addEventListener('mousemove', function(){ g_magentaAngle = this.value; renderAllShapes(); });
  document.getElementById('angleSlider').addEventListener('mousemove', function(){ g_globalAngle = this.value; renderAllShapes(); });
}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActionsHTML();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev){ if(ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();
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


var g_shapesList = [];
/*var g_points = []; 
var g_colors = []; 
var g_sizes = [];*/
function click(ev) {

  let [x, y] = convertCoordinates(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) {
    point = new Circle();
  } else {
    point = new Brush();
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  renderAllShapes();
}

function convertCoordinates(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return [x, y];
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

  var globalRotateMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // var len = g_shapesList.length;
  // for(var i = 0; i < len; i++) {
  //   g_shapesList[i].render(); 
  // }

  //draw a cube
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.translate(-0.25, -0.75, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(0.5, 0.3, 0.5);
  body.render();

  var leftArm = new Cube();
  leftArm.color = [1.0, 1.0, 0.0, 1.0];
  leftArm.matrix.translate(0.0, -0.5, 0.0);
  leftArm.matrix.rotate(-5, 1, 0, 0);
  leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  var yellowCoordinates = new Matrix4(leftArm.matrix);

  leftArm.matrix.scale(0.25, 0.7, 0.5);
  leftArm.matrix.translate(-0.5, 0.0, 0.0);
  leftArm.render();

  var box = new Cube();
  box.color = [1.0, 0.0, 1.0, 1.0];
  box.matrix = yellowCoordinates;
  box.matrix.translate(0, 0.65, 0)
  box.matrix.rotate(-g_magentaAngle, 0, 0, 1);
  box.matrix.scale(0.3, 0.3, 0.3);
  box.matrix.translate(-0.5, 0.0, -0.001)
  box.render();

  var k = 5;
  for(var i = 0; i < k; i++){
    var c = new Cube();
    c.matrix.translate(-0.8, 1.9 * i / k - 1, 0.0);
    c.matrix.rotate(g_seconds * 100, 1, 1, 1);
    c.matrix.scale(0.1, 0.5 / k, 1.0 / k);
    c.render();
  }

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



