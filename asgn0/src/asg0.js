// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('canvas');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  ctx.fillStyle = 'rgba(0, 0, 255, 1.0)'; // Set color to blue
  ctx.fillRect(120, 10, 150, 150);        // Fill a rectangle with the color

  // Black canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the background with black

  // Draw a red vector v1
  let v1 = new Vector3([2.25, 2.25, 0.0]);
  drawVector(v1, 'red');
}

function drawVector(v, color) {
  var canvas = document.getElementById('canvas'); 
  var ctx = canvas.getContext('2d');

  ctx.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(v.elements[0] * 20, -v.elements[1] * 20);
  ctx.stroke();
}

function handleDrawEvent(){
  var canvas = document.getElementById('canvas'); 
  var ctx = canvas.getContext('2d');

  // Reset transformation matrix
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const v1_x = document.getElementById("v1_x").value;
  const v1_y = document.getElementById("v1_y").value;

  let v1 = new Vector3([v1_x, v1_y, 0.0]);
  drawVector(v1, 'red');

  const v2_x = document.getElementById("v2_x").value;
  const v2_y = document.getElementById("v2_y").value;

  let v2 = new Vector3([v2_x, v2_y, 0.0]);
  drawVector(v2, 'blue');
}

function handleDrawOperationEvent(){
  var canvas = document.getElementById('canvas'); 
  var ctx = canvas.getContext('2d');

  // Reset transformation matrix
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const v1_x = document.getElementById("v1_x").value;
  const v1_y = document.getElementById("v1_y").value;

  let v1 = new Vector3([v1_x, v1_y, 0.0]);
  drawVector(v1, 'red');

  const v2_x = document.getElementById("v2_x").value;
  const v2_y = document.getElementById("v2_y").value;

  let v2 = new Vector3([v2_x, v2_y, 0.0]);
  drawVector(v2, 'blue');

  const op = document.getElementById("operation").value;
  const scalar = parseFloat(document.getElementById("scalar").value);

  let res1 = new Vector3([0, 0, 0]);
  let res2 = new Vector3([0, 0, 0]);

  switch(op){
    case "add":
      res1 = v1.add(v2);
      // console.log(res1.elements);
      drawVector(res1, 'green');
      break;
    case "subtract":
      res1 = v1.sub(v2);
      // console.log(res1.elements);
      drawVector(res1, 'green');
      break;
    case "multiply":
      res1 = v1.mul(scalar);
      res2 = v2.mul(scalar);
      // console.log(res1.elements);
      // console.log(res2.elements);
      drawVector(res1, 'green');
      drawVector(res2, 'green');
      break;
    case "divide":
      if(scalar == 0){
        alert("Cannot divide by zero.");
        return;
      }
      res1 = v1.div(scalar);
      res2 = v2.div(scalar);
      // console.log(res1.elements);
      // console.log(res2.elements);
      drawVector(res1, 'green');
      drawVector(res2, 'green');
      break;
    case "magnitude":
      res1 = v1.magnitude();
      res2 = v2.magnitude();
      console.log("v1 magnitude:", res1);
      console.log("v2 magnitude:", res2);
      break;
    case "normalize":
      res1 = v1.normalize();
      res2 = v2.normalize();
      drawVector(res1, 'green');
      drawVector(res2, 'green');
      break;
    case "angle":
      let angle = angleBetween(v1, v2);
      console.log("Angle between: ", angle);
      break;
    case "area":
      res1 = areaTriangle(v1, v2);
      console.log("Area: ", res1);
      break;
  }
}

function angleBetween(v1, v2){
  let dot = Vector3.dot(v1, v2);
  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();
  let angle = Math.acos(dot / (mag1 * mag2));

  let degrees = angle * (180 / Math.PI);
  return degrees;
}

function areaTriangle(v1, v2){
  let cross = Vector3.cross(v1, v2);
  return cross.magnitude() / 2;
}

