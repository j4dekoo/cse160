// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
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
let canvas, gl, a_Position, u_FragColor, u_Size;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;

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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsHTML(){
  // Buttons
  document.getElementById('green').onclick = function(){ g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick = function(){ g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function(){ g_shapesList = []; renderAllShapes(); };

  document.getElementById('jadeDrawing').onclick = myDrawing;

  document.getElementById('pointButton').onclick = function(){ g_selectedType = POINT; };
  document.getElementById('triButton').onclick = function(){ g_selectedType = TRIANGLE; };
  document.getElementById('circleButton').onclick = function(){ g_selectedType = CIRCLE; };
  document.getElementById('paintBrush').onclick = function(){ g_selectedType = BRUSH; };

  //Sliders
  document.getElementById('redSlider').addEventListener('mouseup', function(){ g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlider').addEventListener('mouseup', function(){ g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlider').addEventListener('mouseup', function(){ g_selectedColor[2] = this.value/100; });

  document.getElementById('sizeSlider').addEventListener('mouseup', function(){ g_selectedSize = this.value; });
}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActionsHTML();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev){ if(ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
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

function renderAllShapes(){
  var startTime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
}

function sendTextToHTML(text, htmlID){
  var htmlElement = document.getElementById(htmlID);
  if (!htmlElement){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElement.innerHTML = text;
}


function myDrawing(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  const drawingTriangles = [
    { points: [[-0.5, 0.5], [-0.3, 0.2], [-0.7, 0.1]], color: [1.0, 0.0, 0.0, 1.0] },
    { points: [[-0.5, 0.5], [-0.5, 0.6], [-0.5, 0.5]], color: [1.0, 0.0, 0.0, 1.0] },
    // Add at least 20 triangles like this...
  ];

  for (const tri of drawingTriangles) {
    const t = new Triangle();
    t.position = tri.points.flat();  // [x1, y1, x2, y2, x3, y3]
    t.color = tri.color;
    t.size = 20;
    g_shapesList.push(t);
  }

  renderAllShapes();
}