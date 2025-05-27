// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec2 a_UV;
  varying vec2 v_UV;

  attribute vec3 a_Normal;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;

  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    v_VertPos = u_ModelMatrix * a_Position;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  varying vec3 v_Normal;

  uniform int u_TexNum;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;

  uniform vec3 u_lightPos;
  varying vec4 v_VertPos;
  uniform vec3 u_cameraPos;
  uniform float u_specStrength;
  uniform bool u_lightOn;

  // spotlight
  uniform vec3 u_spotDir;
  uniform vec3 u_spotPos;
  uniform float u_spotCut;
  uniform bool u_spotOn;
  uniform vec3 u_spotColor;

  void main() {
    if (u_TexNum == -3) {
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    }else if (u_TexNum == -2) {
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

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r = length(lightVector);
    // if (r < 1.0){
    //   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // } else if (r < 2.0){
    //   gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    // }

    //gl_FragColor = vec4(vec3(gl_FragColor)/(r*r), 1);

    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);

    // reflection
    vec3 R = reflect(-L, N);

    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    float S = pow(max(dot(E, R), 0.0), 20.0);
    float specular = u_specStrength * S;

    vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.3;
    vec3 color = ambient;
    
    if(u_lightOn) color += diffuse + specular;

    // spotlight calc
    if (u_spotOn) {
      vec3 spotVec = normalize(u_spotPos - vec3(v_VertPos));
      float spotCos = dot(spotVec, normalize(-u_spotDir));
      if (spotCos > u_spotCut) {
        vec3 spotEffect = pow(spotCos, 30.0) * u_spotColor;
        color += spotEffect;
      }
    }

    gl_FragColor = vec4(color, 1.0);
    
  }
`;

// Global variables
let canvas, gl, a_Position, u_FragColor, a_UV, u_ModelMatrix, u_GlobalRotateMatrix, u_ProjectionMatrix, u_ViewMatrix, u_NormalMatrix;
let u_TexNum, u_Sampler0, u_Sampler1, u_Sampler2;
let a_Normal, u_lightPos, u_cameraPos, u_specStrength, u_lightOn;
let u_spotDir, u_spotPos, u_spotCut, u_spotOn, u_spotColor;
let g_currMouse = [0, 0];
let g_camX = 0, g_camY = 0, g_camZ = 4;
let g_eyeX = 0, g_eyeY = 0, g_eyeZ = 4;
let g_lastUpdate = 0;
let g_paused = false;

let g_normalOn = false;
let g_lightPos = [0, 1.5, -2];
let g_lightOn = 1;
let g_spotOn = 1;
var g_spotlightPos = [3.0, 3.0, -1.0];

// camera angle
let g_globalAngle = 0;
let g_bodyX = 0;

// joint angles for sliders
let g_neckAngle = 0;
let g_headAngle = 0;

let g_ProjectionMatrix = new Matrix4();
let coatColor = [1.0, 1.0, 0.92, 1.0];
let g_swans = [
  { x: -1.5, y: 0, z: -2, angle: 0, direction: 0, speed: 0.01, turnSpeed: 0.2 },
  { x: 1, y: 0, z: 0, angle: 0, direction: 0, speed: 0.01, turnSpeed: 0.2 }
]

let g_matingAnim = false;
let g_matingAnimTime = 0;
let g_grace = 2;

let bunny;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 50;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const aspect = canvas.width / canvas.height;
  g_ProjectionMatrix.setPerspective(60, aspect, 0.1, 100);
  let angleX = g_camX * Math.PI / 180;
  let angleY = g_camY * Math.PI / 180;

  g_eyeX = g_camZ * Math.sin(angleX) * Math.cos(angleY);
  g_eyeY = g_camZ * Math.sin(angleY);
  g_eyeZ = g_camZ * Math.cos(angleX) * Math.cos(angleY);

  g_ProjectionMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ,  // Eye position
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

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  u_specStrength = gl.getUniformLocation(gl.program, 'u_specStrength');
  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightPos || !u_cameraPos || !u_specStrength || !u_lightOn) {
    console.log('Failed to get the storage location');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_TexNum = gl.getUniformLocation(gl.program, 'u_TexNum');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');


  if (!u_FragColor || !u_ModelMatrix || !u_GlobalRotateMatrix || !u_ProjectionMatrix || !u_TexNum || !u_NormalMatrix) {
    console.log('Failed to get the storage location');
    return;
  }

  u_spotDir = gl.getUniformLocation(gl.program, 'u_spotDir');
  u_spotPos = gl.getUniformLocation(gl.program, 'u_spotPos');
  u_spotCut = gl.getUniformLocation(gl.program, 'u_spotCut');
  u_spotOn = gl.getUniformLocation(gl.program, 'u_spotOn');
  u_spotColor = gl.getUniformLocation(gl.program, 'u_spotColor');
}

function addActionsHTML() {
  document.getElementById("normalOn").onclick = function() { g_normalOn = true };
  document.getElementById("normalOff").onclick = function() { g_normalOn = false };

  document.getElementById("lightOn").onclick = function() { g_lightOn = true; renderAllShapes(); };
  document.getElementById("lightOff").onclick = function() { g_lightOn = false; renderAllShapes(); };

  document.getElementById("spotOn").onclick = function() { g_spotOn = true; renderAllShapes(); };
  document.getElementById("spotOff").onclick = function() { g_spotOn = false; renderAllShapes(); };

  document.getElementById("lightX").addEventListener("input", function () { g_lightPos[0] = parseFloat(this.value)/100; renderAllShapes(); });
  document.getElementById("lightY").addEventListener("input", function () { g_lightPos[1] = parseFloat(this.value)/100; renderAllShapes(); });
  document.getElementById("lightZ").addEventListener("input", function () { g_lightPos[2] = parseFloat(this.value)/100; renderAllShapes(); });


  document.getElementById("resetCamButton").addEventListener("click", resetCam);
  document.getElementById('angleSlider').addEventListener('input', function () {
    g_camX = parseInt(this.value);
    resizeCanvas();
    renderAllShapes();
  });
  document.getElementById('neckSlider').addEventListener('input', function () { !g_paused ? g_neckAngle = this.value : null; renderAllShapes(); });
  document.getElementById('headSlider').addEventListener('input', function () { !g_paused ? g_headAngle = this.value : null; renderAllShapes(); });

  document.getElementById("pause").addEventListener("change", function (ev) { g_paused = ev.target.checked; });

}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  program = 

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

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function (ev) { handleMouseDown(ev); };
  canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.5, 0.2, 0.2, 0.35);

  bunny = new Model(gl, "../bunny.obj");

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  if (!g_paused) {
    if(g_grace > 0) g_grace -= 0.02;

    if (g_matingAnim) {
      resetCam();
      moveSwansToCenter();

      g_matingAnimTime += 0.02;
      if (g_matingAnimTime > 5) {
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
      swan.angle += -swan.angle * 0.01;
      //swan.direction = Math.atan(swan.z, swan.x) * 180 / Math.PI;
    }

    //check if swan is near other swan
    for (let j = 0; j < g_swans.length; j++) {
      if (i !== j) {
        let otherSwan = g_swans[j];
        let distance = Math.sqrt(
          Math.pow((swan.x - 5) - (otherSwan.x - 5), 2) +
          Math.pow(swan.z - otherSwan.z, 2)
        );

        if (distance < minDistance && g_grace <= 0) {
          // calculate swan angle
          let away = Math.atan2(swan.z - otherSwan.z, swan.x - otherSwan.x);
          swan.x += Math.cos(away) * 0.04;
          swan.z += Math.sin(away) * 0.02;

          // adjust goal direction
          swan.direction = (swan.direction + 5) % 360;
          
        }
      }

      let diff = (swan.direction - swan.angle) % 360;
      swan.angle += diff * 0.1;
    }


  }
}

function moveSwansToCenter() {
  g_headAngle = 0;
  g_neckAngle = 0;
  g_grace = 0;

  g_swans[0].x = -1.3;
  g_swans[0].z = 0;
  g_swans[0].angle = -20;
  g_swans[0].direction = 0;

  g_swans[1].x = 1;
  g_swans[1].z = 0.2;
  g_swans[1].angle = 20;
  g_swans[1].direction = 0;
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
  resizeCanvas();
}

function updateAnimationAngles() {
  if (!g_paused) {
    g_bodyX = 5 * Math.sin(g_seconds);
  }
  g_lightPos[0] = Math.cos(g_seconds);
}

function renderAllShapes() {
  var startTime = performance.now();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, new Matrix4().elements);

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_ProjectionMatrix.elements);

  let pauseFactor = g_paused ? 0 : 1;
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1f(u_specStrength, 0.0);
  var sky = new Cube();
  sky.color = [0.5, 0.2, 0.2, 0.35];
  if (g_normalOn) sky.texNum = -3;
  sky.matrix.scale(-30, -30, -30);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();


  gl.uniform1f(u_specStrength, 1.0);
  var pond = new Cone();
  pond.color = [0.4, 0.7, 1.0, 1.0]; // light blue
  if (g_normalOn) pond.texNum = -3;
  pond.segments = 30;
  pond.matrix.translate(0, -0.75, 0);
  pond.matrix.rotate(180, 1, 0, 0);
  pond.matrix.scale(12, 0.01, 12);
  pond.render();

  bunny.color = [1.0, 0.0, 1.0, 1.0];
  bunny.matrix.setScale(0.5, 0.5, 0.5);
  bunny.matrix.translate(3.0, -2.0, -4.0);
  bunny.matrix.rotate(90, 0, 1, 0);
  bunny.render(gl);

  var globalRotateMat = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMat.elements);

  // render light source
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  gl.uniform3f(u_cameraPos, g_eyeX, g_eyeY, g_eyeZ);

  gl.uniform1i(u_lightOn, g_lightOn);

  gl.uniform3fv(u_spotDir, new Float32Array([0, -1, 0]));
  gl.uniform3fv(u_spotPos, new Float32Array(g_spotlightPos));
  gl.uniform1f(u_spotCut, Math.cos(70 * Math.PI / 180));
  gl.uniform3fv(u_spotColor, new Float32Array([0.8, 0.3, 0.2]));
  gl.uniform1i(u_spotOn, g_spotOn);

  var light = new Cube();
  light.color = [2.0, 2.0, 0.2, 1.0];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.render();

  // spotlight
  var spotlight = new Cube();
  spotlight.color = [1.0, 1.0, 0.8, 1.0];
  spotlight.matrix.translate(g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  spotlight.matrix.scale(-0.1, -0.1, -0.1);
  spotlight.render();

  var sphere = new Sphere(20);
  if (g_normalOn) sphere.texNum = -3;
  sphere.matrix.scale(1, 1, 1);
  sphere.matrix.translate(0, 0.1, -2.5);
  sphere.render();

  for (let i = 0; i < g_swans.length; i++) {
    let swan = g_swans[i];
    // BODY
    var body = new Cube();
    if(g_normalOn) body.texNum = -3;
    body.color = coatColor;
    //body.matrix.translate(-0.5 - i * 2, -0.8, 0.0 + i * 2);
    body.matrix.translate(0, -0.8, 0.0);

    body.matrix.translate(swan.x, 0.0, swan.z);
    body.matrix.rotate(swan.angle, 0, 1, 0);

    //reflect if odd
    if (i % 2 == 1) body.matrix.scale(-1, 1, 1);

    var upperBodyCoord = new Matrix4(body.matrix);
    body.matrix.rotate(-2, 1, 0, 0);
    body.matrix.scale(0.8, 0.1, 0.4);
    body.normalMatrix.setInverseOf(body.matrix).transpose();
    body.render();

    var ripple = new Cone();
    if(g_normalOn) ripple.texNum = -3;
    ripple.color = [0.3, 0.5, 1.0, 0.9];
    ripple.segments = 15;
    ripple.matrix = new Matrix4(upperBodyCoord);
    ripple.matrix.translate(0.4 + 0.07 * pauseFactor * Math.sin(g_seconds * 2.0), 0.06, 0.18);
    ripple.matrix.rotate(180, 1, 0, 0);
    ripple.matrix.scale(1.3, 0.01, 0.9);
    ripple.render();

    var upperBody = new Cube();
    if(g_normalOn) upperBody.texNum = -3;
    upperBody.color = coatColor;
    upperBody.matrix = upperBodyCoord;
    upperBody.matrix.translate(-0.05, 0.1, 0);
    var bodyCoord = new Matrix4(upperBody.matrix);
    upperBody.matrix.scale(0.9, 0.2, 0.4);
    upperBody.normalMatrix.setInverseOf(upperBody.matrix).transpose();
    upperBody.render();

    // TAIL
    var tail = new Cube();
    if(g_normalOn) tail.texNum = -3;
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
    tail.normalMatrix.setInverseOf(tail.matrix).transpose();
    tail.render();

    // MATING ANIM 
    let neckAngle = 0;
    if (g_matingAnim) {
      if (g_matingAnimTime < 2.8) {
        neckAngle = 30 * g_matingAnimTime;
      } else if (g_matingAnimTime < 2.9) {
        neckAngle = 30 * 2.8;
      } else{
        let t = g_matingAnimTime - 2.9;
        neckAngle = 60 * Math.max(-3, 1 - t);
      }
    }

    var heart = new Cube();
    if(g_normalOn) heart.texNum = -3;
    heart.color = [1.0, 0.2, 0.2, 1.0];
    heart.matrix.translate(-0.3, 0.6 + 0.1 * Math.sin((g_seconds % 20) * 0.8 * Math.PI), 0);
    i % 2 == 0 ? heart.matrix.rotate(40, 0, 0, 1) : heart.matrix.rotate(-40, 0, 0, 1);
    i % 2 == 0 ? heart.matrix.scale(0.1, 0.12, 0.1) : heart.matrix.scale(0.1, 0.2, 0.1);
    g_matingAnim && !g_paused ? heart.render() : null;

    // NECK
    var baseNeck = new Cone();
    if(g_normalOn) baseNeck.texNum = -3;
    baseNeck.color = coatColor;
    baseNeck.matrix = new Matrix4(bodyCoord);
    baseNeck.matrix.translate(0.8, 0.09 + (neckAngle * 0.001), 0.18);
    baseNeck.matrix.rotate(neckAngle, 0, 1, 0); // z coord
    var neck2Coord = new Matrix4(baseNeck.matrix);
    baseNeck.matrix.rotate(-110, 0, 0, 1);
    baseNeck.matrix.scale(0.25, 0.32, 0.35);
    baseNeck.render();


    var neck2 = new Cube();
    if(g_normalOn) neck2.texNum = -3;
    neck2.color = coatColor;
    neck2.matrix = neck2Coord;
    neck2.matrix.translate(0.15, -0.09, -0.1);
    neck2.matrix.rotate(-g_neckAngle, 0, 0, 1);
    var neck3Coord = new Matrix4(neck2.matrix);
    neck2.matrix.rotate(-15, 0, 0, 1);
    neck2.matrix.scale(0.15, 0.3, 0.18);
    neck2.normalMatrix.setInverseOf(neck2.matrix).transpose();
    neck2.render();

    var neck3 = new Cube();
    if(g_normalOn) neck3.texNum = -3;
    neck3.color = coatColor;
    neck3.matrix = neck3Coord;
    neck3.matrix.translate(0.09, 0.18, 0.03);
    neck3.matrix.rotate(-g_neckAngle * 0.2, 0, 0, 1);
    var neck4Coord = new Matrix4(neck3.matrix);
    neck3.matrix.rotate(27, 0, 0, 1);
    neck3.matrix.scale(0.15, 0.25, 0.13);
    neck3.normalMatrix.setInverseOf(neck3.matrix).transpose();
    neck3.render();

    var neck4 = new Cube();
    if(g_normalOn) neck4.texNum = -3;
    neck4.color = coatColor;
    neck4.matrix = neck4Coord;
    neck4.matrix.translate(-0.1, 0.2, 0.001);
    neck4.matrix.rotate(-g_neckAngle * 0.2, 0, 0, 1);
    var neck5Coord = new Matrix4(neck4.matrix);
    neck4.matrix.rotate(29.5, 0, 0, 1);
    neck4.matrix.scale(0.15, 0.25, 0.13);
    neck4.normalMatrix.setInverseOf(neck4.matrix).transpose();
    neck4.render();

    var neck5 = new Cube();
    if(g_normalOn) neck5.texNum = -3;
    neck5.color = coatColor;
    neck5.matrix = neck5Coord;
    neck5.matrix.translate(-0.125, 0.215, 0.001);
    neck5.matrix.rotate(-g_neckAngle * 0.95, 0, 0, 1);
    var neck6Coord = new Matrix4(neck5.matrix);
    neck5.matrix.rotate(5, 0, 0, 1);
    neck5.matrix.scale(0.15, 0.27, 0.13);
    neck5.normalMatrix.setInverseOf(neck5.matrix).transpose();
    neck5.render();

    var neck6 = new Cube();
    if(g_normalOn) neck6.texNum = -3;
    neck6.color = coatColor;
    neck6.matrix = neck6Coord;
    neck6.matrix.translate(-0.025, 0.265, 0.001);
    var neck7Coord = new Matrix4(neck6.matrix);
    neck6.matrix.rotate(-24, 0, 0, 1);
    neck6.matrix.scale(0.15, 0.24, 0.13);
    neck6.normalMatrix.setInverseOf(neck6.matrix).transpose();
    neck6.render();

    var neck7 = new Cube();
    if(g_normalOn) neck7.texNum = -3;
    neck7.color = coatColor;
    neck7.matrix = neck7Coord;
    neck7.matrix.translate(0.09, 0.22, 0.001);
    var faceCoord = new Matrix4(neck7.matrix);
    neck7.matrix.rotate(-100, 0, 0, 1);
    neck7.matrix.scale(0.15, 0.2, 0.13);
    neck7.normalMatrix.setInverseOf(neck7.matrix).transpose();
    neck7.render();

    // HEAD + BEAK
    var face = new Cube();
    if(g_normalOn) face.texNum = -3;
    face.color = coatColor;
    face.matrix = faceCoord;
    face.matrix.translate(0.18, -0.025, 0.001);
    face.matrix.rotate(g_headAngle, 0, 0, 1);
    var beakCoord = new Matrix4(face.matrix);
    face.matrix.rotate(-120, 0, 0, 1);
    face.matrix.scale(0.15, 0.18, 0.13);
    face.normalMatrix.setInverseOf(face.matrix).transpose();
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
    if(g_normalOn) eye3.texNum = -3;
    eye3.color = [0.0, 0.0, 0.0, 1.0];
    eye3.matrix = new Matrix4(beakCoord);
    eye3.matrix.translate(0.15, -0.15, 0.0001);
    eye3.matrix.rotate(40, 0, 0, 1);
    eye3.matrix.scale(0.05, 0.05, 0.13);
    eye3.normalMatrix.setInverseOf(eye3.matrix).transpose();
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
    if(g_normalOn) rightWing.texNum = -3;
    rightWing.color = coatColor;
    rightWing.matrix = new Matrix4(bodyCoord);
    rightWing.matrix.translate(0.89, 0.1, 0.37);

    let rWingFlap = Math.sin(g_seconds * 2) * 3;
    !g_paused ? rightWing.matrix.rotate(rWingFlap, 0, 0, 1) : null;

    var rw1Coord = new Matrix4(rightWing.matrix);
    rightWing.matrix.rotate(115, 0, 0, 1);
    rightWing.matrix.scale(0.4, 0.15, 0.05);
    rightWing.normalMatrix.setInverseOf(rightWing.matrix).transpose();
    rightWing.render();

    var rw1 = new Cube();
    if(g_normalOn) rw1.texNum = -3;
    rw1.color = coatColor;
    rw1.matrix = rw1Coord;
    rw1.matrix.translate(-0.165, 0.355, 0.001);
    var rw2Coord = new Matrix4(rw1.matrix);
    rw1.matrix.rotate(140, 0, 0, 1);
    rw1.matrix.scale(0.4, 0.15, 0.05);
    rw1.normalMatrix.setInverseOf(rw1.matrix).transpose();
    rw1.render();

    var rw2 = new Cube();
    if(g_normalOn) rw2.texNum = -3;
    rw2.color = coatColor;
    rw2.matrix = rw2Coord;
    rw2.matrix.translate(-0.8, 0.19, 0.001);
    var rWingBaseCoord = new Matrix4(rw2.matrix);
    rw2.matrix.rotate(-10, 0, 0, 1);
    rw2.matrix.scale(0.5, 0.14, 0.05);
    rw2.normalMatrix.setInverseOf(rw2.matrix).transpose();
    rw2.render();

    let numFeathers = 6;
    for (let i = 0; i < numFeathers; i++) {
      let feather = new Cube();
      if(g_normalOn) feather.texNum = -3;
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

      feather.normalMatrix.setInverseOf(feather.matrix).transpose();
      feather.render();
    }

    for (let i = 0; i < numFeathers - 1; i++) {
      let feather = new Cube();
      if(g_normalOn) feather.texNum = -3;
      feather.color = coatColor;
      feather.matrix = new Matrix4(rWingBaseCoord);

      feather.matrix.translate(
        -0.15 * i + 0.6,
        i * 0.13 - 0.58,
        -0.001 * i + 0.04// slight offset to avoid z-fighting
      );

      feather.matrix.rotate(-8 * i * 0.8, 0.6, 0, 1);
      feather.matrix.scale(
        0.2 + i * 0.08,
        0.15,
        0.04
      );
      feather.normalMatrix.setInverseOf(feather.matrix).transpose();
      feather.render();
    }


    var leftWing = new Cube();
    if(g_normalOn) leftWing.texNum = -3;
    leftWing.color = coatColor;
    leftWing.matrix = new Matrix4(bodyCoord);
    leftWing.matrix.translate(0.89, 0.1, -0.02);

    let lWingFlap = Math.sin(g_seconds * 2) * 3;
    !g_paused ? leftWing.matrix.rotate(lWingFlap, 0, 0, 1) : null;

    var lw1Coord = new Matrix4(leftWing.matrix);
    leftWing.matrix.rotate(115, 0, 0, 1);
    leftWing.matrix.scale(0.4, 0.15, 0.05);
    leftWing.normalMatrix.setInverseOf(leftWing.matrix).transpose();
    leftWing.render();

    var lw1 = new Cube();
    if(g_normalOn) lw1.texNum = -3;
    lw1.color = coatColor;
    lw1.matrix = lw1Coord;
    lw1.matrix.translate(-0.165, 0.355, 0.001);
    var rw2Coord = new Matrix4(lw1.matrix);
    lw1.matrix.rotate(140, 0, 0, 1);
    lw1.matrix.scale(0.4, 0.15, 0.05);
    lw1.normalMatrix.setInverseOf(lw1.matrix).transpose();
    lw1.render();

    var lw2 = new Cube();
    if(g_normalOn) lw2.texNum = -3;
    lw2.color = coatColor;
    lw2.matrix = rw2Coord;
    lw2.matrix.translate(-0.6, 0.16, 0.001);
    var lWingBaseCoord = new Matrix4(lw2.matrix);
    lw2.matrix.rotate(-10, 0, 0, 1);
    lw2.matrix.scale(0.3, 0.14, 0.05);
    lw2.normalMatrix.setInverseOf(lw2.matrix).transpose();
    lw2.render();

    for (let i = 0; i < numFeathers; i++) {
      let feather = new Cube();
      if(g_normalOn) feather.texNum = -3;
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
      feather.normalMatrix.setInverseOf(feather.matrix).transpose();
      feather.render();
    }

    for (let i = 0; i < numFeathers - 1; i++) {
      let feather = new Cube();
      if(g_normalOn) feather.texNum = -3;
      feather.color = coatColor;
      feather.matrix = new Matrix4(lWingBaseCoord);

      feather.matrix.translate(
        -0.15 * i + 0.41,
        i * 0.13 - 0.54,
        -0.001 * i - 0.03// slight offset to avoid z-fighting
      );

      feather.matrix.rotate(-8 * i * 0.8, -0.6, 0, 1);
      feather.matrix.scale(
        0.2 + i * 0.08,
        0.15,
        0.04
      );
      feather.normalMatrix.setInverseOf(feather.matrix).transpose();
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
