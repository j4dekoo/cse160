// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let g_camX = 0, g_camY = 0, g_camZ = 4;
let g_lastUpdate = 0;
let g_paused = false;

// camera angle
let g_globalAngle = 0;
let g_bodyX = 0;

// joint angles for sliders
let g_neckAngle = 0;
let g_headAngle = 0;

let g_ProjectionMatrix = new Matrix4();
let coatColor = [1.0, 1.0, 0.92, 1.0];
let g_swans = [
  { x: -1.5, y: 0, z: 0, angle: 0, direction: 0, speed: 0.01, turnSpeed: 1 },
  { x: 1, y: 0, z: 0, angle: 0, direction: 0, speed: 0.01, turnSpeed: 1 }
]

let g_matingAnim = false;
let g_matingAnimTime = 0;


function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 50;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const aspect = canvas.width / canvas.height;
  g_ProjectionMatrix.setPerspective(60, aspect, 0.1, 100);
  let angleX = g_camX * Math.PI / 180;
  let angleY = g_camY * Math.PI / 180;

  let eyeX = g_camZ * Math.sin(angleX) * Math.cos(angleY);
  let eyeY = g_camZ * Math.sin(angleY);
  let eyeZ = g_camZ * Math.cos(angleX) * Math.cos(angleY);

  g_ProjectionMatrix.lookAt(eyeX, eyeY, eyeZ,  // Eye position
    0, 0, 0,  // Look at center
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

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');

  if (!u_FragColor || !u_ModelMatrix || !u_GlobalRotateMatrix || !u_ProjectionMatrix) {
    console.log('Failed to get the storage location');
    return;
  }
}

function addActionsHTML() {
  document.getElementById("resetCamButton").addEventListener("click", resetCam);
  document.getElementById('angleSlider').addEventListener('input', function () {
    g_camX = parseInt(this.value);
    resizeCanvas();
    renderAllShapes();
  });
  document.getElementById('neckSlider').addEventListener('input', function () { g_neckAngle = this.value; renderAllShapes(); });
  document.getElementById('headSlider').addEventListener('input', function () { g_headAngle = this.value; renderAllShapes(); });

  document.getElementById("pause").addEventListener("change", function (ev) { g_paused = ev.target.checked; });

}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActionsHTML();

  // FIX CAMERA ANGLE SLIDER AND CLICK SCROLL CRASHING
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, false);
  canvas.addEventListener("wheel", function (ev) {
    if (ev.deltaY < 0) {
      g_camZ -= 0.4;
    } else {
      g_camZ += 0.4;
    }
    g_camZ = Math.max(1, Math.min(15, g_camZ));
    resizeCanvas();
  })

  // Move swan
  document.addEventListener("keydown", handleKeyPress);
  /*
  document.addEventListener("keyup", function (ev) {
    if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
      g_swans[0].speed = 0;

    }

    if (ev.key === "w" || ev.key === "s")
      g_swans[1].speed = 0;
  });*/

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function (ev) { handleMouseDown(ev); };
  canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.5, 0.2, 0.2, 0.35);

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  if (!g_paused) {

    if (g_matingAnim) {
      resetCam();
      moveSwansToCenter();

      g_matingAnimTime += 0.02;
      if (g_matingAnimTime > 3) {
        g_matingAnim = false;
        g_matingAnimTime = 0;
      }
    }

    moveSwan();
    updateAnimationAngles();
  }

  renderAllShapes();
  requestAnimationFrame(tick);
}

function moveSwan() {
  const pondRadius = 5.0;
  const minDistance = 1.8;

  for (let i = 0; i < g_swans.length; i++) {
    let swan = g_swans[i];
    let angle = swan.angle * Math.PI / 180;
    let moveX = 0, moveZ = 0;

    if (i % 2 == 0) {
      moveX = Math.cos(angle) * swan.speed;
      moveZ = -Math.sin(angle) * swan.speed;
    } else {
      moveX = -Math.cos(angle) * swan.speed;
      moveZ = Math.sin(angle) * swan.speed;
    }

    let nextX = swan.x + moveX;
    let nextZ = swan.z + moveZ;

    // check if next position is within pond bounds
    let dist = Math.sqrt(nextX * nextX + nextZ * nextZ);
    if (dist < pondRadius) {
      swan.x = nextX;
      swan.z = nextZ;
    } else {
      let diff = 0 - swan.angle; // 0, 0 is center of pond
      swan.angle += diff * 0.05
    }

    //check if swan is near other swan
    for (let j = 0; j < g_swans.length; j++) {
      if (i !== j) {
        let otherSwan = g_swans[j];
        let distance = Math.sqrt(
          Math.pow((swan.x - 5) - (otherSwan.x - 5), 2) +
          Math.pow(swan.z - otherSwan.z, 2)
        );

        if (distance < minDistance) {
          // calculate swan angle
          let away = Math.atan2(swan.z - otherSwan.z, swan.x - otherSwan.x);
          swan.x += Math.cos(away) * 0.04;
          swan.z += Math.sin(away) * 0.02;

          // adjust goal direction
          swan.direction = (swan.direction + 20) % 360;
        }
      }
    }



    //swan.angle += (Math.random() - 0.5) * swan.turnSpeed;

    let diff = (swan.direction - swan.angle + 540) % 360 - 90;
    swan.angle += diff * 0.1;

  }
}

function moveSwansToCenter() {
  g_swans[0].x = -1.4;
  g_swans[0].z = 0.4;
  g_swans[0].angle = 0;

  g_swans[1].x = 1;
  g_swans[1].z = 0;
  g_swans[1].angle = 0;
}

function handleKeyPress(ev) {
  const speed = 0.02;
  const acc = 0.004;
  const turnSpeed = 15;

  // swan 1
  if (ev.key === "ArrowUp") {
    g_swans[0].speed = Math.min(g_swans[0].speed + acc, speed);
  } else if (ev.key === "ArrowDown") {
    g_swans[0].direction = (g_swans[0].direction + 90) % 360;
  } else if (ev.key === "ArrowLeft") {
    g_swans[0].direction = (g_swans[0].direction + turnSpeed) % 360;
  } else if (ev.key === "ArrowRight") {
    g_swans[0].direction = (g_swans[0].direction - turnSpeed) % 360;
    //g_swans[0].angle -= turnSpeed;
  }

  //swan 2
  if (ev.key === "w") {
    g_swans[1].speed = Math.min(g_swans[1].speed + acc, speed);
  } else if (ev.key === "s") {
    g_swans[1].direction = (g_swans[1].direction + 90) % 360;
  } else if (ev.key === "a") {
    //g_swans[1].angle += turnSpeed;
    g_swans[1].direction = (g_swans[1].direction + turnSpeed) % 360;
  } else if (ev.key === "d") {
    //g_swans[1].angle -= turnSpeed;
    g_swans[1].direction = (g_swans[1].direction - turnSpeed) % 360;
  }

  renderAllShapes();
}

function handleMouseDown(ev) {
  g_currMouse = [ev.clientX, ev.clientY]

  if (ev.shiftKey) {
    g_matingAnimTime = 0;
    g_matingAnim = true;
  }
}

function click(ev) {

  let xy = convertCoordinates(ev);

  g_camX += xy[0] * 180;
  g_camY += xy[1] * 180;

  g_camY = Math.max(-2, Math.min(85, g_camY));

  document.getElementById("angleSlider").value = g_camX;

  resizeCanvas();
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
  g_camX = 0;
  g_camY = 0;
  g_camZ = 4;
  document.getElementById("angleSlider").value = g_camX;
}

function updateAnimationAngles() {
  if (!g_paused) {
    g_bodyX = 5 * Math.sin(g_seconds);
  }
}

function renderAllShapes() {
  var startTime = performance.now();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, new Matrix4().elements);

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_ProjectionMatrix.elements);

  let pauseFactor = g_paused ? 0 : 1;
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var pond = new Cone();
  pond.color = [0.4, 0.7, 1.0, 1.0]; // light blue
  pond.segments = 30;
  pond.matrix.translate(0, -0.75, 0);
  pond.matrix.rotate(180, 1, 0, 0);
  pond.matrix.scale(12, 0.01, 12);
  pond.render();

  var globalRotateMat = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMat.elements);


  for (let i = 0; i < g_swans.length; i++) {
    let swan = g_swans[i];
    // BODY
    var body = new Cube();
    body.color = coatColor;
    //body.matrix.translate(-0.5 - i * 2, -0.8, 0.0 + i * 2);
    body.matrix.translate(0, -0.8, 0.0);

    body.matrix.translate(swan.x, 0.0, swan.z);
    body.matrix.rotate(swan.angle, 0, 1, 0);

    //body.matrix.rotate(g_bodyX, pauseFactor * Math.sin(g_seconds * 0.8) * 2, 0, 1);

    //reflect if odd
    if (i % 2 == 1) body.matrix.scale(-1, 1, 1);

    var upperBodyCoord = new Matrix4(body.matrix);
    body.matrix.rotate(-2, 1, 0, 0);
    body.matrix.scale(0.8, 0.1, 0.4);
    body.render();

    var ripple = new Cone();
    ripple.color = [0.3, 0.5, 1.0, 0.9];
    ripple.segments = 15;
    ripple.matrix = new Matrix4(upperBodyCoord);
    ripple.matrix.translate(0.4 + 0.07 * pauseFactor * Math.sin(g_seconds * 2.0), 0.06, 0.18);
    ripple.matrix.rotate(180, 1, 0, 0);
    ripple.matrix.scale(1.3, 0.01, 0.9);
    ripple.render();

    var upperBody = new Cube();
    upperBody.color = coatColor;
    upperBody.matrix = upperBodyCoord;
    upperBody.matrix.translate(-0.05, 0.1, 0);
    var bodyCoord = new Matrix4(upperBody.matrix);
    upperBody.matrix.scale(0.9, 0.2, 0.4);
    upperBody.render();

    // TAIL
    var tail = new Cube();
    tail.color = coatColor;
    tail.matrix = new Matrix4(bodyCoord);
    tail.matrix.translate(0.05, 0.21, 0.025);

    // tail flap animation
    let flapInterval = 6 + i * 2;
    let flapCycle = g_seconds % flapInterval;
    let flapAngle = 0;
    if (flapCycle < 0.6 && !g_paused) { // flap lasts one second
      flapAngle = Math.sin(flapCycle * 20 * Math.PI) * 30
    }

    tail.matrix.rotate(flapAngle, 0, 0, 1);
    tail.matrix.rotate(-200, 0, 0, 1);
    tail.matrix.scale(0.2, 0.1, 0.35)
    tail.render();

    // MATING ANIM 
    let neckAngle = 0;
    if (g_matingAnim) {
      if (g_matingAnimTime < 1) {
        neckAngle = 70 * g_matingAnimTime;
      } else {
        neckAngle = 70 * (2 - g_matingAnimTime);
      }
    }

    var heart = new Cube();
    heart.color = [1.0, 0.2, 0.2, 1.0];
    heart.matrix.translate(-0.3 + (i + 0.05), 0.8, 0);
    heart.matrix.rotate(45, 1, 1, 0);
    heart.matrix.scale(0.1, 0.1, 0.1);
    g_matingAnim && !g_paused ? heart.render() : null;

    // NECK
    var baseNeck = new Cone();
    baseNeck.color = coatColor;
    baseNeck.matrix = new Matrix4(bodyCoord);
    baseNeck.matrix.translate(0.8, 0.09 + (neckAngle * 0.001), 0.18);
    baseNeck.matrix.rotate(neckAngle, 0, 1, 0); // z coord
    var neck2Coord = new Matrix4(baseNeck.matrix);
    baseNeck.matrix.rotate(-110, 0, 0, 1);
    baseNeck.matrix.scale(0.25, 0.32, 0.35);
    baseNeck.render();


    var neck2 = new Cube();
    neck2.color = coatColor;
    neck2.matrix = neck2Coord;
    neck2.matrix.translate(0.15, -0.09, -0.1);
    neck2.matrix.rotate(-g_neckAngle, 0, 0, 1);
    var neck3Coord = new Matrix4(neck2.matrix);
    neck2.matrix.rotate(-15, 0, 0, 1);
    neck2.matrix.scale(0.15, 0.3, 0.18);
    neck2.render();

    var neck3 = new Cube();
    neck3.color = coatColor;
    neck3.matrix = neck3Coord;
    neck3.matrix.translate(0.09, 0.18, 0.03);
    neck3.matrix.rotate(-g_neckAngle * 0.2, 0, 0, 1);
    var neck4Coord = new Matrix4(neck3.matrix);
    neck3.matrix.rotate(27, 0, 0, 1);
    neck3.matrix.scale(0.15, 0.25, 0.13);
    neck3.render();

    var neck4 = new Cube();
    neck4.color = coatColor;
    neck4.matrix = neck4Coord;
    neck4.matrix.translate(-0.1, 0.2, 0.001);
    neck4.matrix.rotate(-g_neckAngle * 0.2, 0, 0, 1);
    var neck5Coord = new Matrix4(neck4.matrix);
    neck4.matrix.rotate(29.5, 0, 0, 1);
    neck4.matrix.scale(0.15, 0.25, 0.13);
    neck4.render();

    var neck5 = new Cube();
    neck5.color = coatColor;
    neck5.matrix = neck5Coord;
    neck5.matrix.translate(-0.125, 0.215, 0.001);
    neck5.matrix.rotate(-g_neckAngle * 0.95, 0, 0, 1);
    var neck6Coord = new Matrix4(neck5.matrix);
    neck5.matrix.rotate(5, 0, 0, 1);
    neck5.matrix.scale(0.15, 0.27, 0.13);
    neck5.render();

    var neck6 = new Cube();
    neck6.color = coatColor;
    neck6.matrix = neck6Coord;
    neck6.matrix.translate(-0.025, 0.265, 0.001);
    var neck7Coord = new Matrix4(neck6.matrix);
    neck6.matrix.rotate(-24, 0, 0, 1);
    neck6.matrix.scale(0.15, 0.24, 0.13);
    neck6.render();

    var neck7 = new Cube();
    neck7.color = coatColor;
    neck7.matrix = neck7Coord;
    neck7.matrix.translate(0.09, 0.22, 0.001);
    var faceCoord = new Matrix4(neck7.matrix);
    neck7.matrix.rotate(-100, 0, 0, 1);
    neck7.matrix.scale(0.15, 0.2, 0.13);
    neck7.render();

    // HEAD + BEAK
    var face = new Cube();
    face.color = coatColor;
    face.matrix = faceCoord;
    face.matrix.translate(0.18, -0.025, 0.001);
    face.matrix.rotate(g_headAngle, 0, 0, 1);
    var beakCoord = new Matrix4(face.matrix);
    face.matrix.rotate(-120, 0, 0, 1);
    face.matrix.scale(0.15, 0.18, 0.13);
    face.render();

    let eye = new Cone();
    eye.color = [0.0, 0.0, 0.0, 1.0];
    eye.matrix = new Matrix4(beakCoord);
    eye.matrix.translate(0.16, -0.125, 0.1);
    eye.matrix.rotate(40, 0, 0, 1);
    eye.matrix.rotate(26, 1, 0, 0);
    eye.matrix.scale(0.08, 0.1, 0.1);
    eye.render();

    let eye2 = new Cone();
    eye2.color = [0.0, 0.0, 0.0, 1.0];
    eye2.matrix = new Matrix4(beakCoord);
    eye2.matrix.translate(0.16, -0.125, 0.03);
    eye2.matrix.rotate(40, 0, 0, 1);
    eye2.matrix.rotate(-25, 1, 0, 0);
    eye2.matrix.scale(0.08, 0.1, 0.1);
    eye2.render();

    let eye3 = new Cube();
    eye3.color = [0.0, 0.0, 0.0, 1.0];
    eye3.matrix = new Matrix4(beakCoord);
    eye3.matrix.translate(0.15, -0.15, 0.0001);
    eye3.matrix.rotate(40, 0, 0, 1);
    eye3.matrix.scale(0.05, 0.05, 0.13);
    eye3.render();

    let beak = new Cone(24);
    beak.color = [0.8, 0.4, 0.1, 0.9];
    beak.matrix = beakCoord;
    beak.matrix.translate(0.1, -0.145, 0.065);
    var beak2Coord = new Matrix4(beak.matrix);
    beak.matrix.rotate(-120, 0, 0, 1);
    beak.matrix.scale(0.15, 0.17, 0.13);
    beak.render();

    var beak2 = new Cone();
    beak2.color = [0.0, 0.0, 0.0, 1.0];
    beak2.matrix = beak2Coord;
    beak2.matrix.translate(0.15, -0.085, -0.001);
    beak2.matrix.rotate(-120, 0, 0, 1);
    beak2.matrix.rotate(180, 0, 0, 1);
    beak2.matrix.scale(0.025, 0.08, 0.03);
    beak2.render();

    // WINGS
    var rightWing = new Cube();
    rightWing.color = coatColor;
    rightWing.matrix = new Matrix4(bodyCoord);
    rightWing.matrix.translate(0.89, 0.1, 0.37);

    let rWingFlap = Math.sin(g_seconds * 2) * 3;
    rightWing.matrix.rotate(rWingFlap, 0, 0, 1);

    var rw1Coord = new Matrix4(rightWing.matrix);
    rightWing.matrix.rotate(115, 0, 0, 1);
    rightWing.matrix.scale(0.4, 0.15, 0.05)
    rightWing.render();

    var rw1 = new Cube();
    rw1.color = coatColor;
    rw1.matrix = rw1Coord;
    rw1.matrix.translate(-0.165, 0.355, 0.001);
    var rw2Coord = new Matrix4(rw1.matrix);
    rw1.matrix.rotate(140, 0, 0, 1);
    rw1.matrix.scale(0.4, 0.15, 0.05)
    rw1.render();

    var rw2 = new Cube();
    rw2.color = coatColor;
    rw2.matrix = rw2Coord;
    rw2.matrix.translate(-0.8, 0.19, 0.001);
    var rWingBaseCoord = new Matrix4(rw2.matrix);
    rw2.matrix.rotate(-10, 0, 0, 1);
    rw2.matrix.scale(0.5, 0.14, 0.05)
    rw2.render();

    let numFeathers = 6;
    for (let i = 0; i < numFeathers; i++) {
      let feather = new Cube();
      feather.color = coatColor;
      feather.matrix = new Matrix4(rWingBaseCoord);

      feather.matrix.translate(
        -0.09 * i + 0.3,
        i * 0.13 - 0.6,
        -0.001 * i + 0.01// slight offset to avoid z-fighting
      );
      feather.matrix.rotate(-6 * i * 0.8, 0, 0, 1);
      feather.matrix.scale(
        0.5 + i * 0.08,
        0.15,
        0.04
      );
      feather.render();
    }

    for (let i = 0; i < numFeathers - 1; i++) {
      let feather = new Cube();
      feather.color = coatColor;
      feather.matrix = new Matrix4(rWingBaseCoord);

      feather.matrix.translate(
        -0.15 * i + 0.6,
        i * 0.13 - 0.58,
        -0.001 * i + 0.04// slight offset to avoid z-fighting
      );

      let flutter = Math.sin(g_seconds * 23 + i) * 0.1;
      feather.matrix.rotate(-8 * i * 0.8, 0.6, 0, 1);
      feather.matrix.scale(
        0.2 + i * 0.08,
        0.15,
        0.04
      );
      feather.render();
    }


    var leftWing = new Cube();
    leftWing.color = coatColor;
    leftWing.matrix = new Matrix4(bodyCoord);
    leftWing.matrix.translate(0.89, 0.1, -0.02);

    let lWingFlap = Math.sin(g_seconds * 2) * 3;
    leftWing.matrix.rotate(lWingFlap, 0, 0, 1);

    var lw1Coord = new Matrix4(leftWing.matrix);
    leftWing.matrix.rotate(115, 0, 0, 1);
    leftWing.matrix.scale(0.4, 0.15, 0.05)
    leftWing.render();

    var lw1 = new Cube();
    lw1.color = coatColor;
    lw1.matrix = lw1Coord;
    lw1.matrix.translate(-0.165, 0.355, 0.001);
    var rw2Coord = new Matrix4(lw1.matrix);
    lw1.matrix.rotate(140, 0, 0, 1);
    lw1.matrix.scale(0.4, 0.15, 0.05)
    lw1.render();

    var lw2 = new Cube();
    lw2.color = coatColor;
    lw2.matrix = rw2Coord;
    lw2.matrix.translate(-0.6, 0.16, 0.001);
    var lWingBaseCoord = new Matrix4(lw2.matrix);
    lw2.matrix.rotate(-10, 0, 0, 1);
    lw2.matrix.scale(0.3, 0.14, 0.05)
    lw2.render();

    for (let i = 0; i < numFeathers; i++) {
      let feather = new Cube();
      feather.color = coatColor;
      feather.matrix = new Matrix4(lWingBaseCoord);

      feather.matrix.translate(
        -0.09 * i + 0.1,
        i * 0.13 - 0.52,
        -0.001 * i + 0.01// slight offset to avoid z-fighting
      );
      feather.matrix.rotate(-6 * i * 0.8, 0, 0, 1);
      feather.matrix.scale(
        0.5 + i * 0.08,
        0.15,
        0.04
      );
      feather.render();
    }

    for (let i = 0; i < numFeathers - 1; i++) {
      let feather = new Cube();
      feather.color = coatColor;
      feather.matrix = new Matrix4(lWingBaseCoord);

      feather.matrix.translate(
        -0.15 * i + 0.41,
        i * 0.13 - 0.54,
        -0.001 * i - 0.03// slight offset to avoid z-fighting
      );

      let flutter = Math.sin(g_seconds * 23 + i) * 0.1;
      feather.matrix.rotate(-8 * i * 0.8, -0.6, 0, 1);
      feather.matrix.scale(
        0.2 + i * 0.08,
        0.15,
        0.04
      );
      feather.render();
    }
  }

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
