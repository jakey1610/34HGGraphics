// TO-DO LIST
//  * Textures
//  * Animations for day/night cycle???

//************************************************************SHADERS*********************************************************************************************
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  //'attribute vec2 aTextureCoord;' + //Remove to go back
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  //'varying highp vec2 vTextureCoord;' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  if(u_isLighting)\n' +
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
        // Calculate the color due to diffuse reflection
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' + '  }\n' +
  //'     vTextureCoord = aTextureCoord;\n' + '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  //'varying highp vec2 vTextureCoord;'+ //Remove to go back
  'uniform sampler2D uSampler;' + //Remove to go back
  'void main() {\n' +
  '  gl_FragColor = v_Color;'+//*texture2D(uSampler,vTextureCoord);\n' +
  '}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 2.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var gO_xAngle = 0.0;
var gO_xMove = 0.0;
var gO_yMove = 0.0;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }


  //*********************************************CHECK THIS OUT***********************************************************************
  gl.clearColor(0.5, 0.5, 0.5, 1.0);
  gl.enable(gl.DEPTH_TEST);
  //gl.enable(gl.CULL_FACE);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');


  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting) {
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1, 1, 1);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([1.0, 1.0, 1.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(0, 10, 100, 0, 0, 0, 0, 1, 0);
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);



  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  };
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


var count = 0;
var signx = 1;
var signy = 1;
function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    case 87:
      count += 0.25;
      sine = Math.sin(count);
      gO_xAngle+=sine*2;
      break;
    case 65:
      if (Math.abs(gO_yMove)%2 <= 1 && Math.abs(gO_yMove) > 1){
        signy *= -1;
      }
      if (Math.abs(gO_xMove)%10 <= 1 && Math.abs(gO_xMove) > 1){
        signx *= -1;
      }
      gO_xMove += signx*0.2;
      gO_yMove += signy*0.2;
      break;
    case 83:
      count += 0.25;
      sine = Math.sin(count);
      gO_xAngle+=sine*2;
      if (Math.abs(gO_yMove)%2 <= 1 && Math.abs(gO_yMove) > 1){
        signy *= -1;
      }
      if (Math.abs(gO_xMove)%10 <= 1 && Math.abs(gO_xMove) > 1){
        signx *= -1;
      }
      gO_xMove += signx*0.2;
      gO_yMove += signy*0.2;
      break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}
function calcNormal(p1_x, p1_y, p1_z, p2_x, p2_y, p2_z, p3_x, p3_y, p3_z){
  var Ux = p2_x - p1_x
  var Uy = p2_y - p1_y
  var Uz = p2_z - p1_z
  var Vx = p3_x - p1_x
  var Vy = p3_y - p1_y
  var Vz = p3_z - p1_z
  var Nx = (Uy*Vz) - (Uz*Vy)
  var Ny = (Uz*Vx) - (Ux*Vz)
  var Nz = (Ux*Vy) - (Uy*Vx)
  return [Nx, Ny, Nz]
}
//************************************************************SPHERE*********************************************************************************************
function initVertexBuffersSP(gl, colour, gradBool){
  var SPHERE_DIV = 12;
     var i, ai, si, ci;
     var j, aj, sj, cj;
     var p1, p2;
     // Vertices
     var vertices = [], indices = [];
     for (j = 0; j <= SPHERE_DIV; j++) {
       aj = j * Math.PI / SPHERE_DIV;
       sj = Math.sin(aj);
       cj = Math.cos(aj);
       for (i = 0; i <= SPHERE_DIV; i++) {
         ai = i * 2 * Math.PI / SPHERE_DIV;
         si = Math.sin(ai);
         ci = Math.cos(ai);

         vertices.push(si * sj);  // X
         vertices.push(cj);       // Y
         vertices.push(ci * sj);  // Z
       }
     }
     vertices = new Float32Array(vertices);
     // Indices
     for (j = 0; j < SPHERE_DIV; j++) {
       for (i = 0; i < SPHERE_DIV; i++) {
         p1 = j * (SPHERE_DIV+1) + i;
         p2 = p1 + (SPHERE_DIV+1);

         indices.push(p1);
         indices.push(p2);
         indices.push(p1 + 1);

         indices.push(p1 + 1);
         indices.push(p2);
         indices.push(p2 + 1);
       }
     }
     indices = new Uint8Array(indices);
    //colors
    var colors = []
    for(var t = vertices.length; t > 0; t-=3){
      var c = t;
      var c1 = colour[0];
      var c2 = colour[1];
      var c3 = colour[2];
      if(gradBool == 1){
        if (c*(1/vertices.length)>1){
          var diff = (c*(1/vertices.length))-1;
          c1 = 1-diff;
        } else {
          c1 = c*(1/vertices.length);
        }
        colors.push(c1);
        colors.push(c1);
        colors.push(c1);
      } else {
        colors.push(c1);
        colors.push(c2);
        colors.push(c3);
      }
    }
    colors = new Float32Array(colors);
    var normals = [];
    var vector = [];
    for (var t = 0; t < indices.length; t+=12){
      var vector = calcNormal(indices[t],indices[t+1],indices[t+2],indices[t+3],indices[t+4],indices[t+5],indices[t+6],indices[t+7],indices[t+8]);
      normals.push(vector[0]);
      normals.push(vector[1]);
      normals.push(vector[2]);
      normals.push(vector[0]);
      normals.push(vector[1]);
      normals.push(vector[2]);
      normals.push(vector[0]);
      normals.push(vector[1]);
      normals.push(vector[2]);
      normals.push(vector[0]);
      normals.push(vector[1]);
      normals.push(vector[2]);
    }
    normals = new Float32Array(normals);
     if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
     if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
     if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

     // Write the indices to the buffer object
     var indexBuffer = gl.createBuffer();
     if (!indexBuffer) {
       console.log('Failed to create the buffer object');
       return false;
     }
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
     return indices.length;
}
//************************************************************CYLINDER**********************************************************************************************
function initVertexBuffersCyl(gl, r,g,b) {
  var verts = [];
  var normals = [];
  var colors = [];
  var indices = [];
  var nslices = 20;
  var nstacks = 20;
  var nvertices = nslices * nstacks;

  var Dangle = 2*Math.PI/(nslices-1);

  for (j =0; j<nstacks; j++)
    for (i=0; i<nslices; i++) {
      var idx = j*nslices + i; // mesh[j][i]
      var angle = Dangle * i;
      verts.push(Math.cos(angle));
      verts.push(Math.sin(angle));
      verts.push(j*3.0/(nstacks-1)-1.5);

      normals.push(Math.cos(angle));
      normals.push(Math.sin(angle));
      normals.push(0.0);

      colors.push(r);
      colors.push(g);
      colors.push(b);
    }
  // now create the index array

  nindices = (nstacks-1)*6*(nslices+1);

  for (j =0; j<nstacks; j++)
    for (i=0; i<=nslices; i++) {
      var mi = i % nslices;
      var mi2 = (i+1) % nslices;
      var idx = (j+1) * nslices + mi;
      var idx2 = j*nslices + mi; // mesh[j][mi]
      var idx3 = (j) * nslices + mi2;
      var idx4 = (j+1) * nslices + mi;
      var idx5 = (j) * nslices + mi2;
      var idx6 = (j+1) * nslices + mi2;

      indices.push(idx);
      indices.push(idx2);
      indices.push(idx3);
      indices.push(idx4);
      indices.push(idx5);
      indices.push(idx6);
    }
    if (!initArrayBuffer(gl, 'a_Position', new Float32Array(verts), 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', new Float32Array(colors), 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(normals), 3, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indices.length;

}
//******************************************************************LEAF BUNCH*******************************************************************************
function initVertexBuffersLB(gl, colorsP) {
  // Create a half-pyramid
  //  v1------v0
  //  |\      | \
  //  |v5-----|-v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     -3.9, 11, -9,  -4.1, 11, -9,  -4.1,-1, -9,   -3.9,-1, -9, // v0-v1-v2-v3 front
     -3.9, 11, -9,   -3.9,-1, -9,   -3.9,-1,-11, // v0-v3-v4 right
    -4.1, 11, -9,  -4.1,-1,-11,  -4.1,-1, -9, // v1-v5-v2 left
    -4.1,-1,-11,   -3.9,-1,-11,   -3.9,-1, -9,  -4.1,-1, -9, // v7-v4-v3-v2 down
     -3.9,-1,-11,  -4.1, 11, -9,  -3.9, 11, -9,   -4.1,-1,-11,  // v4-v1-v0-v5 back

     -0.9, 11, -13,  -1.1, 11, -13,  -1.1,-1, -13,   -0.9,-1, -13, // v0-v1-v2-v3 front
     -0.9, 11, -13,   -0.9,-1, -13,   -0.9,-1,-15, // v0-v3-v4 right
    -1.1, 11, -13,  -1.1,-1,-15,  -1.1,-1, -13, // v1-v5-v2 left
    -1.1,-1,-15,   -0.9,-1,-15,   -0.9,-1, -13,  -1.1,-1, -13, // v7-v4-v3-v2 down
     -0.9,-1,-15,  -1.1, 11, -13,  -0.9, 11, -13,   -1.1,-1,-15,  // v4-v1-v0-v5 back

     0.1, 11, -9,  -0.1, 11, -9,  -0.1,-1, -9,   0.1,-1, -9, // v0-v1-v2-v3 front
     0.1, 11, -9,   0.1,-1, -9,   0.1,-1,-11, // v0-v3-v4 right
    -0.1, 11, -9,  -0.1,-1,-11,  -0.1,-1, -9, // v1-v5-v2 left
    -0.1,-1,-11,   0.1,-1,-11,   0.1,-1, -9,  -0.1,-1, -9, // v7-v4-v3-v2 down
     0.1,-1,-11,  -0.1, 11, -9,  0.1, 11, -9,   -0.1,-1,-11,  // v4-v1-v0-v5 back

     2.1, 11, -8,  1.9, 11, -8,  1.9,-1, -8,   2.1,-1, -8, // v0-v1-v2-v3 front
     2.1, 11, -8,   2.1,-1, -8,   2.1,-1,-10, // v0-v3-v4 right
    1.9, 11, -8,  1.9,-1,-10,  1.9,-1, -8, // v1-v5-v2 left
    1.9,-1,-10,   2.1,-1,-10,   2.1,-1, -8,  1.9,-1, -8, // v7-v4-v3-v2 down
     2.1,-1,-10,  1.9, 11, -8,  2.1, 11, -8,   1.9,-1,-10,  // v4-v1-v0-v5 back

     0.1, 11, -7,  -0.1, 11, -7,  -0.1,4, -7,   0.1,4, -7, // v0-v1-v2-v3 front
     0.1, 11, -7,   0.1,4, -7,   0.1,4,-9, // v0-v3-v4 right
    -0.1, 11, -7,  -0.1,4,-9,  -0.1,4, -7, // v1-v5-v2 left
    -0.1,4,-9,   0.1,4,-9,   0.1,4, -7,  -0.1,4, -7, // v7-v4-v3-v2 down
     0.1,4,-9,  -0.1, 11, -7,  0.1, 11, -7,   -0.1,4,-9,  // v4-v1-v0-v5 back

     -1.9, 11, -7,  -2.1, 11, -7,  -2.1,-1, -7,   -1.9,-1, -7, // v0-v1-v2-v3 front
     -1.9, 11, -7,  -1.9,-1, -7,   -1.9,-1,-9, // v0-v3-v4 right
    -2.1, 6, -7,  -2.1,-1,-9,  -2.1,-1, -7, // v1-v5-v2 left
    -2.1,-1,-9,   -1.9,-1,-9,   -1.9,-1, -7,  -2.1,-1, -7, // v7-v4-v3-v2 down
     -1.9,-1,-9,  -2.1, 11, -7,  -1.9, 11, -7,   -2.1,-1,-9,  // v4-v1-v0-v5 back

     0.1, 11, -5,  -0.1, 11, -5,  -0.1,-1, -5,   0.1,-1, -5, // v0-v1-v2-v3 front
     0.1, 11, -5,   0.1,-1, -5,   0.1,-1,-7, // v0-v3-v4 right
    -0.1, 11, -5,  -0.1,-1,-7,  -0.1,-1, -5, // v1-v5-v2 left
    -0.1,-1,-7,   0.1,-1,-7,   0.1,-1, -5,  -0.1,-1, -5, // v7-v4-v3-v2 down
     0.1,-1,-7,  -0.1, 11, -5,  0.1, 11, -5,   -0.1,-1,-7,  // v4-v1-v0-v5 back
  ]);

  var colors = colorsP;


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0,  // v4-v0-v1-v5 back

    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0,   // v4-v0-v1-v5 back

    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0,   // v4-v0-v1-v5 back

    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0,   // v4-v0-v1-v5 back

    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0,   // v4-v0-v1-v5 back

    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0,   // v4-v0-v1-v5 back

    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0,   // v4-v0-v1-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    4, 5, 6,    // right
    7, 8, 9,   // left
    10,11,12,  10,12,13,    // down
    14,15,16,  14,17,15,     // back

    18, 19, 20,   18, 20, 21,    // front
    22, 23, 24,    // right
    25, 26, 27,   // left
    28,29,30,  28,30,31,    // down
    32,33,34,  32,35,33,     // back

    36, 37, 38,   36, 38, 39,    // front
    40, 41, 42,    // right
    43, 44, 45,   // left
    46,47,48,  46,48,49,    // down
    50,51,52,  50,53,51,     // back

    54, 55, 56,   54, 56, 57,    // front
    58, 59, 60,    // right
    61, 62, 63,   // left
    64,65,66,  64,66,67,    // down
    68,69,70,  68,71,69,     // back

    72, 73, 74,   72, 74, 75,    // front
    76, 77, 78,    // right
    79, 80, 81,   // left
    82,83,84,  82,84,85,    // down
    86,87,88,  86,89,87,     // back

    90, 91, 92,   90, 92, 93,    // front
    94, 95, 96,    // right
    97, 98, 99,   // left
    100,101,102,  100,102,103,    // down
    104,105,106,  104,107,105,     // back

    108, 109, 110,   108, 110, 111,    // front
    112, 113, 114,    // right
    115, 116, 117,   // left
    118,119,120,  118,120,121,    // down
    122,123,124,  122,125,123,     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
//************************************************************HALF-CUBE*********************************************************************************************
function initVertexBuffersHP(gl, colorsP) {
  // Create a half-pyramid
  //  v1------v0
  //  |\      | \
  //  |v5-----|-v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5, // v0-v3-v4 right
    -0.5, 0.5, 0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v5-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,   -0.5,-0.5,-0.5  // v4-v1-v0-v5 back
  ]);


  var colors = colorsP;


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4 right
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v5-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   0.0, 0.0,-1.0   // v4-v0-v1-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,    // right
     7, 8, 9,   // left
    10,11,12,  10,12,13,    // down
    14,15,16,  14,17,15,     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
//************************************************************CUBE*********************************************************************************************
function initVertexBuffersBox(gl, colorsP){//, texBool) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = colorsP;


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);
 // const textureCoordBuffer = gl.createBuffer();
 //  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
 //
 //  const textureCoordinates = [
 //    // Front
 //    0.0,  0.0,
 //    1.0,  0.0,
 //    1.0,  1.0,
 //    0.0,  1.0,
 //    // Back
 //    0.0,  0.0,
 //    1.0,  0.0,
 //    1.0,  1.0,
 //    0.0,  1.0,
 //    // Top
 //    0.0,  0.0,
 //    1.0,  0.0,
 //    1.0,  1.0,
 //    0.0,  1.0,
 //    // Bottom
 //    0.0,  0.0,
 //    1.0,  0.0,
 //    1.0,  1.0,
 //    0.0,  1.0,
 //    // Right
 //    0.0,  0.0,
 //    1.0,  0.0,
 //    1.0,  1.0,
 //    0.0,  1.0,
 //    // Left
 //    0.0,  0.0,
 //    1.0,  0.0,
 //    1.0,  1.0,
 //    0.0,  1.0,
 //  ];
 //
 //  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
 //                gl.STATIC_DRAW);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;


  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  //REMOVE ALL THIS TO GO BACK
  // if(texBool){
  //   // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
  //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //   // Prevents s-coordinate wrapping (repeating).
  //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  //   // Prevents t-coordinate wrapping (repeating).
  //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  //   var aVertexPosition = gl.getAttribLocation(gl.program, 'aVertexPosition'); //Remove to go back
  //   var aTextureCoord = gl.getAttribLocation(gl.program, 'aTextureCoord'); //Remove to go back
  //   var uSampler = gl.getUniformLocation(gl.program, 'uSampler'); //Remove to go back
  //   const texture = loadTexture(gl, 'me.jpg');
  //
  //   const num = 2; // every coordinate composed of 2 values //Remove to go back
  //   const type = gl.FLOAT; // the data in the buffer is 32 bit float //Remove to go back
  //   const normalize = false; // don't normalize  //Remove to go back
  //   const stride = 0; // how many bytes to get from one set to the next //Remove to go back
  //   const offset = 0; // how many bytes inside the buffer to start from //Remove to go back
  //   gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer); //Remove to go back
  //   gl.vertexAttribPointer(aTextureCoord, num, type, normalize, stride, offset); //Remove to go back
  //   gl.enableVertexAttribArray(aTextureCoord); //Remove to go back
  // }

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}
//************************************************************AXES*********************************************************************************************
function initAxesVertexBuffers(gl) {

  var verticescolors = new Float32Array([
    // Vertex coordinates and color (for axes)
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b)
     20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     0.0,  20.0,   0.0,  1.0,  1.0,  1.0,
     0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
     0.0,   0.0, -20.0,  1.0,  1.0,  1.0,
     0.0,   0.0,  20.0,  1.0,  1.0,  1.0
  ]);
  var n = 6;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticescolors, gl.STATIC_DRAW);

  var FSIZE = verticescolors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
  //************************************************************MODEL PLANT**************************************************************************************************
  function modelPlant(gl, pos_x, pos_y, pos_z, scale, colorsLeaf, colorsPot, angleBlow){
    //draw the plant pot cylinder
    var n = initVertexBuffersCyl(gl, colorsPot[0],colorsPot[1],colorsPot[2]);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the cylinder
    pushMatrix(modelMatrix);


    modelMatrix.translate(pos_x*scale,(-5+pos_y)*scale,(-10+pos_z)*scale);  // Translation
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(6*scale,7*scale,6*scale); // Scale

    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
    //draw 7 leaves(using the half cube)
    //leaf one
    var n = initVertexBuffersLB(gl, colorsLeaf);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the one leaf
    pushMatrix(modelMatrix);


    modelMatrix.translate((2+pos_x)*scale,(3+pos_y)*scale,pos_z*scale);  // Translation
    modelMatrix.rotate(0+gO_xAngle,0,0,1);
    modelMatrix.scale(scale,scale,scale); // Scale

    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();



  }
  //************************************************************MODEL BIRD*********************************************************************************************
  function modelBird(gl, pos_x, pos_y, pos_z, scale, headColour, bodyColour){
    //adding scaling parameters would not be hard; just multiply these by the scale of each object and translation.
    //need to add in the wings
    //learn how to make an object translate over time. Similar to how keydown rotate works.

    //body
    var n = initVertexBuffersSP(gl, bodyColour, 0);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    // Model the bird body
    pushMatrix(modelMatrix);
    modelMatrix.translate((0 + pos_x + gO_xMove)*scale, (7.5 + pos_y+gO_yMove)*scale, (-0.75 + pos_z)*scale);  // Translation
    modelMatrix.rotate(180,0,1,0);
    modelMatrix.scale(scale * 5.0, scale * 6.0, scale * 5.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //head
    var n = initVertexBuffersSP(gl, headColour, 0);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    // Model the bird head
    pushMatrix(modelMatrix);
    modelMatrix.translate((0 + pos_x+ gO_xMove)*scale, (14 + pos_y+gO_yMove)*scale, (-0.75 + pos_z)*scale);  // Translation
    modelMatrix.rotate(180,0,1,0);
    modelMatrix.scale(scale * 3.5, scale * 3.5, scale * 3.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //beak
     var colorsRF = new Float32Array([    // colors
       0.1, 0.1, 0.1,   0.1, 0.1, 0.1,   0.1, 0.1, 0.1,  0.1, 0.1, 0.1, // v0-v1-v2-v3 front
       0.1, 0.1, 0.1,   0.1, 0.1, 0.1,   0.1, 0.1, 0.1, // v0-v3-v4 right
       0.1, 0.1, 0.1,   0.1, 0.1, 0.1,   0.1, 0.1, 0.1, // v1-v5-v2 left
       0.1, 0.1, 0.1,   0.1, 0.1, 0.1,   0.1, 0.1, 0.1,  0.1, 0.1, 0.1, // v1-v4-v3-v2 down
       0.1, 0.1, 0.1,   0.1, 0.1, 0.1,   0.1, 0.1, 0.1,  0.1, 0.1, 0.1 // v4-v1-v0-v5 back　
    ]);
    var n = initVertexBuffersHP(gl, colorsRF);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    // Model the beak
    pushMatrix(modelMatrix);
    modelMatrix.translate((0 + pos_x+ gO_xMove)*scale, (14 + pos_y+gO_yMove)*scale, (4 + pos_z)*scale);  // Translation
    modelMatrix.rotate(180,0,1,0);
    modelMatrix.scale(scale * 1.0, scale * 1.0, scale * 1.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //left foot
     var colorsRF = new Float32Array([    // colors
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1,  0.1, 0.2, 0.1, // v0-v1-v2-v3 front
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1, // v0-v3-v4 right
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1, // v1-v5-v2 left
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1,  0.1, 0.2, 0.1, // v1-v4-v3-v2 down
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1,  0.1, 0.2, 0.1 // v4-v1-v0-v5 back　
    ]);
    var n = initVertexBuffersHP(gl, colorsRF);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    // Model the foot
    pushMatrix(modelMatrix);
    modelMatrix.translate((-1.0 + pos_x+ gO_xMove)*scale, (2 + pos_y+gO_yMove)*scale, (-2.0 + pos_z)*scale);  // Translation
    modelMatrix.rotate(180,0,1,0);
    modelMatrix.scale(scale * 1.0, scale * 2.0, scale * 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //right foot
     var colorsRF = new Float32Array([    // colors
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1,  0.1, 0.2, 0.1, // v0-v1-v2-v3 front
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1, // v0-v3-v4 right
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1, // v1-v5-v2 left
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1,  0.1, 0.2, 0.1, // v1-v4-v3-v2 down
       0.1, 0.2, 0.1,   0.1, 0.2, 0.1,   0.1, 0.2, 0.1,  0.1, 0.2, 0.1 // v4-v1-v0-v5 back　
    ]);
    var n = initVertexBuffersHP(gl, colorsRF);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    // Model the foot
    pushMatrix(modelMatrix);
    modelMatrix.translate((1.0 + pos_x+ gO_xMove)*scale, (2 + pos_y+gO_yMove)*scale, (-2.0 + pos_z)*scale);  // Translation
    modelMatrix.rotate(180,0,1,0);
    modelMatrix.scale(scale * 1.0, scale * 2.0, scale * 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //left-eye
    var n = initVertexBuffersSP(gl, [0.0,0.0,0.0], 0);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    // Model the left-eye
    pushMatrix(modelMatrix);
    modelMatrix.translate((1 + pos_x+ gO_xMove)*scale, (15 + pos_y+gO_yMove)*scale, (3 + pos_z)*scale);  // Translation
    modelMatrix.rotate(180,0,1,0);
    modelMatrix.scale(scale * 0.4, scale * 0.25, scale * 0.25); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //right-eye
    var n = initVertexBuffersSP(gl, [0.0,0.0,0.0], 0);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    // Model the right-eye
    pushMatrix(modelMatrix);
    modelMatrix.translate((-1 + pos_x+ gO_xMove)*scale, (15 + pos_y+gO_yMove)*scale, (3 + pos_z)*scale);  // Translation
    modelMatrix.rotate(180,0,1,0);
    modelMatrix.scale(scale * 0.4, scale * 0.25, scale * 0.25); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //left-wing
    var colorsRF = new Float32Array([    // colors
      bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],  bodyColour[0], bodyColour[1], bodyColour[2], // v0-v1-v2-v3 front
      bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2], // v0-v3-v4 right
      bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2], // v1-v5-v2 left
      bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],  bodyColour[0], bodyColour[1], bodyColour[2], // v1-v4-v3-v2 down
      bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],  bodyColour[0], bodyColour[1], bodyColour[2] // v4-v1-v0-v5 back　
   ]);
   var n = initVertexBuffersHP(gl, colorsRF);
   if (n < 0) {
     console.log('Failed to set the vertex information');
     return;
   }
   // Model the wing
   pushMatrix(modelMatrix);
   modelMatrix.translate((4.75 + pos_x+ gO_xMove)*scale, (6 + pos_y+gO_yMove)*scale, (-1 + pos_z)*scale);  // Translation
   modelMatrix.rotate(180,0,1,0);
   modelMatrix.scale(scale * 0.5, scale * -10, scale * 6.0); // Scale
   drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
   modelMatrix = popMatrix();

   //right-wing
   var colorsRF = new Float32Array([    // colors
     bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],  bodyColour[0], bodyColour[1], bodyColour[2], // v0-v1-v2-v3 front
     bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2], // v0-v3-v4 right
     bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2], // v1-v5-v2 left
     bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],  bodyColour[0], bodyColour[1], bodyColour[2], // v1-v4-v3-v2 down
     bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],   bodyColour[0], bodyColour[1], bodyColour[2],  bodyColour[0], bodyColour[1], bodyColour[2] // v4-v1-v0-v5 back　　
    ]);
  var n = initVertexBuffersHP(gl, colorsRF);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  // Model the wing
  pushMatrix(modelMatrix);
  modelMatrix.translate((-4.75+pos_x+ gO_xMove)*scale, (6 + pos_y+gO_yMove)*scale, (-1 + pos_z)*scale);  // Translation
  modelMatrix.rotate(180,0,1,0);
  modelMatrix.scale(scale * 0.5, scale * -10, scale * 6.0); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}
//*************************************************************************MODEL DOOR******************************************************************************************
  function modelDoor(gl,pos_x, pos_y, pos_z, scale, flip){
    // Set the vertex coordinates and color (for the outer frame)
    var colorsFrame = new Float32Array([    // colors
      0.9, 0.9, 0.7,   0.9, 0.9, 0.7,   0.9, 0.9, 0.7,  0.9, 0.9, 0.7, // v0-v1-v2-v3 front
      0.9, 0.9, 0.7,   0.9, 0.9, 0.7,   0.9, 0.9, 0.7,  0.9, 0.9, 0.7, // v0-v3-v4-v5 right
      0.9, 0.9, 0.7,   0.9, 0.9, 0.7,   0.9, 0.9, 0.7,  0.9, 0.9, 0.7, // v0-v5-v6-v1 up
      0.9, 0.9, 0.7,   0.9, 0.9, 0.7,   0.9, 0.9, 0.7,  0.9, 0.9, 0.7, // v1-v6-v7-v2 left
      0.9, 0.9, 0.7,   0.9, 0.9, 0.7,   0.9, 0.9, 0.7,  0.9, 0.9, 0.7, // v7-v4-v3-v2 down
      0.9, 0.9, 0.7,   0.9, 0.9, 0.7,   0.9, 0.9, 0.7,  0.9, 0.9, 0.7 // v4-v7-v6-v5 back　
   ]);
    var n = initVertexBuffersBox(gl, colorsFrame);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the outer frame
    pushMatrix(modelMatrix);
    modelMatrix.translate(pos_x*scale, (0.7+pos_y)*scale, (0.001 + pos_z)*scale);  // Translation
    modelMatrix.scale(4.5*scale, 9.5*scale, 0.25*scale); // Scale

    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    var colorsFrame = new Float32Array([    // colors
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // v0-v1-v2-v3 front
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // v0-v3-v4-v5 right
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // v0-v5-v6-v1 up
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // v1-v6-v7-v2 left
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // v7-v4-v3-v2 down
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  1.0, 1.0, 1.0 // v4-v7-v6-v5 back　
   ]);
    var n = initVertexBuffersBox(gl, colorsFrame);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the door window
    pushMatrix(modelMatrix);
    //NEED TO CONSIDER BIDMAS HERE
    modelMatrix.translate(pos_x*scale, (4.75+pos_y)*scale, (0.1 + pos_z)*scale);  // Translation
    modelMatrix.scale(4.25*scale, 1.0*scale, 0.1*scale); // Scale
    if(flip == 1){modelMatrix.translate(0,0,-2.5);}
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

     // Set the vertex coordinates and color (for the inner frame)
     var colorsIFrame = new Float32Array([    // colors
       0, 0, 0.8,   0, 0, 0.8,   0, 0, 0.8,  0, 0, 0.8, // v0-v1-v2-v3 front
       0, 0, 0.8,   0, 0, 0.8,   0, 0, 0.8,  0, 0, 0.8, // v0-v3-v4-v5 right
       0, 0, 0.8,   0, 0, 0.8,   0, 0, 0.8,  0, 0, 0.8, // v0-v5-v6-v1 up
       0, 0, 0.8,   0, 0, 0.8,   0, 0, 0.8,  0, 0, 0.8, // v1-v6-v7-v2 left
       0, 0, 0.8,   0, 0, 0.8,   0, 0, 0.8,  0, 0, 0.8, // v7-v4-v3-v2 down
       0, 0, 0.8,   0, 0, 0.8,   0, 0, 0.8,  0, 0, 0.8 // v4-v7-v6-v5 back　
    ]);
     var n = initVertexBuffersBox(gl, colorsIFrame);
     if (n < 0) {
       console.log('Failed to set the vertex information');
       return;
     }

     // Model the inner frame
     pushMatrix(modelMatrix);
     modelMatrix.translate(pos_x*scale, pos_y*scale, (0.01+pos_z)*scale);  // Translation
     modelMatrix.scale(4.0*scale, 8.0*scale, 0.25*scale); // Scale
     if(flip == 1){modelMatrix.translate(0,0,-0.5);}
     drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
     modelMatrix = popMatrix();

     // Set the vertex coordinates and color (for the door handle)
     var n = initVertexBuffersSP(gl, [0.8,0.001,0.001], 1);
     if (n < 0) {
       console.log('Failed to set the vertex information');
       return;
     }
     // Model the door handle
     pushMatrix(modelMatrix);
     modelMatrix.translate((1.5+pos_x)*scale, pos_y*scale, (0.25+pos_z)*scale);  // Translation
     modelMatrix.scale(0.25*scale, 0.25*scale, 0.25*scale); // Scale
     if(flip == 1){modelMatrix.translate(-12.5,0,-1.75);}
     drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
     modelMatrix = popMatrix();

     // Set the vertex coordinates and color (for the letter box)
     var colorsIFrame = new Float32Array([    // colors
       0, 0, 0,   0, 0, 0,   0, 0, 0,  0, 0, 0, // v0-v1-v2-v3 front
       0, 0, 0,   0, 0, 0,   0, 0, 0,  0, 0, 0, // v0-v3-v4-v5 right
       0, 0, 0,   0, 0, 0,   0, 0, 0,  0, 0, 0, // v0-v5-v6-v1 up
       0, 0, 0,   0, 0, 0,   0, 0, 0,  0, 0, 0, // v1-v6-v7-v2 left
       0, 0, 0,   0, 0, 0,   0, 0, 0,  0, 0, 0, // v7-v4-v3-v2 down
       0, 0, 0,   0, 0, 0,   0, 0, 0,  0, 0, 0 // v4-v7-v6-v5 back　
    ]);
     var n = initVertexBuffersBox(gl, colorsIFrame);
     if (n < 0) {
       console.log('Failed to set the vertex information');
       return;
     }

     // Model the letterbox
     pushMatrix(modelMatrix);
     modelMatrix.translate(pos_x*scale, pos_y*scale, (0.1+pos_z)*scale);  // Translation
     modelMatrix.scale(1.0*scale, 0.3*scale, 0.25*scale); // Scale
     if(flip == 1){modelMatrix.translate(0,0,-1);}
     drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
     modelMatrix = popMatrix();


     //Add more texture to door later
  }

  //*************************************************************************MODEL NORMAL WINDOW******************************************************************************************
    function modelNormalWindow(gl,pos_x, pos_y, pos_z, scale, flip){
      //Normal Size Window.
      //Make the frame outline and fill in the glass with white to apply texture to.

      //Background white
      var colorsIFrame = new Float32Array([    // colors
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v0-v1-v2-v3 front
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v0-v3-v4-v5 right
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v0-v5-v6-v1 up
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v1-v6-v7-v2 left
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v7-v4-v3-v2 down
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the background
      pushMatrix(modelMatrix);
      modelMatrix.translate(pos_x*scale, pos_y*scale, (-0.1+pos_z)*scale);  // Translation
      modelMatrix.scale(5.0*scale, 7.0*scale, 0.25*scale); // Scale

      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //right frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the right frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((-2.4+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.25*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.translate(0,0,-2.5)}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //left frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the left frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((2.4+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.25*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.translate(0,0,-2.5)}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //top frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the top frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((pos_x)*scale, (3.4+pos_y)*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(5.0*scale, 0.25*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.translate(0,0,-2.5)}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();


      //bottom frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
      ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the bottom frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((pos_x)*scale, (-3.4+pos_y)*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(5.0*scale, 0.25*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.translate(0,0,-2.5)}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //middle frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
      ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the middle frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((pos_x)*scale, (0.2+pos_y)*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(5.0*scale, 0.25*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.translate(0,0,-2.5)}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //line-left frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the line-left frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((1+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.1*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.translate(0,0,-2.5)}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //line-right frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the line-right frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((-1+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.1*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.translate(0,0,-2.5)}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
    }

  //*************************************************************************MODEL WIDE WINDOW******************************************************************************************
    function modelWideWindow(gl,pos_x, pos_y, pos_z, scale, flip){
      //Wide Size Window.
      //Make the frame outline and fill in the glass with white to apply texture to.

      //Background white
      var colorsIFrame = new Float32Array([    // colors
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v0-v1-v2-v3 front
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v0-v3-v4-v5 right
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v0-v5-v6-v1 up
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v1-v6-v7-v2 left
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0, // v7-v4-v3-v2 down
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the background
      pushMatrix(modelMatrix);
      modelMatrix.translate(pos_x*scale, pos_y*scale, (0+pos_z)*scale);  // Translation
      modelMatrix.scale(7.0*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //right frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the right frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((-3.4+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.25*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //left frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the left frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((3.4+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.25*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //top frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the top frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((pos_x)*scale, (3.4+pos_y)*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(7.0*scale, 0.25*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();


      //bottom frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
      ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the bottom frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((pos_x)*scale, (-3.4+pos_y)*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(7.0*scale, 0.25*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //middle frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
      ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the middle frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((pos_x)*scale, (0.2+pos_y)*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(7.0*scale, 0.25*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //line-left frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the line-left frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((1+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.1*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //line-right frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the line-right frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((-1+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.1*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //thick-line-left frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the thick-line-left frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((2.2+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.3*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //thick-line-right frame
      var colorsIFrame = new Float32Array([    // colors
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
        1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the thick-line-right frame
      pushMatrix(modelMatrix);
      modelMatrix.translate((-2.2+pos_x)*scale, pos_y*scale, (0.2+pos_z)*scale);  // Translation
      modelMatrix.scale(0.3*scale, 7.0*scale, 0.25*scale); // Scale
      if(flip == 1){modelMatrix.rotate(90,0,1,0);}
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
    }

  //*************************************************************************MODEL ROOF*******************************************************************************************
    function modelRoof(gl,pos_x, pos_y, pos_z, scale, flip){
      //Model the roof
      //Flat colour for now, apply texture of tiled roof later

      // Set the vertex coordinates and color (for the roof-half)
      var colorsRF = new Float32Array([    // colors
        0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8, // v0-v1-v2-v3 front
        0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8, // v0-v3-v4 right
        0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8, // v1-v5-v2 left
        0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8, // v1-v4-v3-v2 down
        0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8 // v4-v1-v0-v5 back　
     ]);
      var n = initVertexBuffersHP(gl, colorsRF);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }
      // Model the roof-half body
      pushMatrix(modelMatrix);
      modelMatrix.translate(pos_x*scale, pos_y*scale, pos_z*scale);  // Translation
      modelMatrix.scale(22*scale, 10*scale, -11*scale); // Scale
      if (flip == 1){
        modelMatrix.rotate(180, 0,1,0);
      }
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
      if(flip == 0){
        //chimney
        var colorsIFrame = new Float32Array([    // colors
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v1-v2-v3 front
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v3-v4-v5 right
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v0-v5-v6-v1 up
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v1-v6-v7-v2 left
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1, // v7-v4-v3-v2 down
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1 // v4-v7-v6-v5 back　
       ]);
        var n = initVertexBuffersBox(gl, colorsIFrame);
        if (n < 0) {
          console.log('Failed to set the vertex information');
          return;
        }

        // Model the chimney
        pushMatrix(modelMatrix);
        modelMatrix.translate((-8+pos_x)*scale, (1+pos_y)*scale, (-3+pos_z)*scale);  // Translation
        modelMatrix.scale(3*scale, 10*scale, 5*scale); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
        modelMatrix = popMatrix();
      }
    }

//*************************************************************************MODEL PATIO******************************************************************************************
  function modelPatio(gl,pos_x, pos_y, pos_z, scale, flip){
    //back
    var colorsIFrame = new Float32Array([    // colors
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v1-v2-v3 front
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v3-v4-v5 right
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v5-v6-v1 up
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v1-v6-v7-v2 left
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v7-v4-v3-v2 down
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5 // v4-v7-v6-v5 back　
   ]);
    var n = initVertexBuffersBox(gl, colorsIFrame);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    pushMatrix(modelMatrix);
    modelMatrix.translate((pos_x)*scale, (-17+pos_y)*scale, (-13+pos_z)*scale);  // Translation
    modelMatrix.scale(22*scale, 2*scale, 30*scale); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //front- top step
    var colorsIFrame = new Float32Array([    // colors
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v1-v2-v3 front
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v3-v4-v5 right
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v5-v6-v1 up
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v1-v6-v7-v2 left
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v7-v4-v3-v2 down
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5 // v4-v7-v6-v5 back　
   ]);
    var n = initVertexBuffersBox(gl, colorsIFrame);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    pushMatrix(modelMatrix);
    modelMatrix.translate((-3+pos_x)*scale, (-17+pos_y)*scale, (pos_z)*scale);  // Translation
    modelMatrix.scale(16*scale, 2*scale, 30*scale); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //front - bottom step
    var colorsIFrame = new Float32Array([    // colors
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v1-v2-v3 front
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v3-v4-v5 right
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v5-v6-v1 up
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v1-v6-v7-v2 left
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v7-v4-v3-v2 down
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5 // v4-v7-v6-v5 back　
   ]);
    var n = initVertexBuffersBox(gl, colorsIFrame);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    pushMatrix(modelMatrix);
    modelMatrix.translate((8+pos_x)*scale, (-18+pos_y)*scale, (10+pos_z)*scale);  // Translation
    modelMatrix.scale(6*scale, 0.25*scale, 10*scale); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //front- top step under house
    var colorsIFrame = new Float32Array([    // colors
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v1-v2-v3 front
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v3-v4-v5 right
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v5-v6-v1 up
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v1-v6-v7-v2 left
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v7-v4-v3-v2 down
      0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5 // v4-v7-v6-v5 back　
   ]);
    var n = initVertexBuffersBox(gl, colorsIFrame);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    pushMatrix(modelMatrix);
    modelMatrix.translate((pos_x)*scale, (-17+pos_y)*scale, (-5+pos_z)*scale);  // Translation
    modelMatrix.scale(22*scale, 2*scale, 20*scale); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }

  //*************************************************************************MODEL PATIO******************************************************************************************
    function modelRailing(gl,pos_x, pos_y, pos_z, scale, flip){
      //lower wall
      var colorsIFrame = new Float32Array([    // colors
        0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v1-v2-v3 front
        0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v3-v4-v5 right
        0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v0-v5-v6-v1 up
        0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v1-v6-v7-v2 left
        0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5, // v7-v4-v3-v2 down
        0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5, 0.5,  0.5, 0.5, 0.5 // v4-v7-v6-v5 back　
     ]);
      var n = initVertexBuffersBox(gl, colorsIFrame);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
      modelMatrix.translate((-3+pos_x)*scale, (-16.25+pos_y)*scale, (14.5+pos_z)*scale);  // Translation
      modelMatrix.scale(16*scale, 3.5*scale, 3*scale); // Scale
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //railing horizontal
      var n = initVertexBuffersCyl(gl, 0.2,0.2,0.2);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the cylinder
      pushMatrix(modelMatrix);


      modelMatrix.translate((4+pos_x)*scale,(-10+pos_y)*scale,(15+pos_z)*scale);  // Translation
      modelMatrix.rotate(90,0,1,0);
      modelMatrix.scale(0.5*scale,0.5*scale,10*scale); // Scale

      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //railing vertical
      var n = initVertexBuffersCyl(gl, 0.2,0.2,0.2);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Model the cylinder
      pushMatrix(modelMatrix);


      modelMatrix.translate((4+pos_x)*scale,(-14.5+pos_y)*scale,(15+pos_z)*scale);  // Translation
      modelMatrix.rotate(90,1,0,0);
      modelMatrix.scale(0.5*scale,0.5*scale,3*scale); // Scale

      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //sphere joint
      var n = initVertexBuffersSP(gl, [0.8,0.001,0.001], 1);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }
      // Model the door handle
      pushMatrix(modelMatrix);
      modelMatrix.translate((4+pos_x)*scale, (-10+pos_y)*scale, (15+pos_z)*scale);  // Translation
      modelMatrix.scale(0.7*scale, 0.7*scale, 0.7*scale); // Scale
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

    }
//*************************************************************************MODEL HOUSE******************************************************************************************
  function modelHouse(gl){
     // Set the vertex coordinates and color (for the house)
     var colorsHouse = new Float32Array([    // colors
       0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,  0.54, 0.3098, 0.2235, // v0-v1-v2-v3 front
       0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,  0.54, 0.3098, 0.2235, // v0-v3-v4-v5 right
       0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,  0.54, 0.3098, 0.2235, // v0-v5-v6-v1 up
       0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,  0.54, 0.3098, 0.2235, // v1-v6-v7-v2 left
       0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,  0.54, 0.3098, 0.2235, // v7-v4-v3-v2 down
       0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,   0.54, 0.3098, 0.2235,  0.54, 0.3098, 0.2235 // v4-v7-v6-v5 back　
    ]);
     var n = initVertexBuffersBox(gl, colorsHouse, true);
     if (n < 0) {
       console.log('Failed to set the vertex information');
       return;
     }
     // Model the house body
     pushMatrix(modelMatrix);
     modelMatrix.translate(0, 0, -5.25);  // Translation
     modelMatrix.scale(22.0, 32.0, 20.0); // Scale
     drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
     modelMatrix = popMatrix();

     //front door
     modelDoor(gl, -7, -12, 4.75, 1,0);
     //back door
     modelDoor(gl, 0, -12, -15.25, 1,1);
     //front windows
     modelNormalWindow(gl,7,10,4.75,1,0);
     modelNormalWindow(gl,0,10,4.75,1,0);
     modelNormalWindow(gl,-7,10,4.75,1,0);
     modelNormalWindow(gl,-7,0,4.75,1,0);
     modelWideWindow(gl,3.5,0,4.75,1,0);
     modelWideWindow(gl,3.5,-10,4.75,1,0);
     //back windows
     modelNormalWindow(gl,-7,10,-15.25,1,1);
     modelNormalWindow(gl,1,10,-15.25,1,1);
     modelNormalWindow(gl,7,10,-15.25,1,1);
     modelNormalWindow(gl,-7,0,-15.25,1,1);
     modelNormalWindow(gl,7,0,-15.25,1,1);
     modelNormalWindow(gl,-7,-10,-15.25,1,1);
     modelNormalWindow(gl,7,-10,-15.25,1,1);
     //roofs
     modelRoof(gl, 0, 21, -10.625, 1,1);
     modelRoof(gl, 0, 21, 0.375, 1,0);
     //flooring
     modelPatio(gl,0,0,0,1,0);
     modelRailing(gl,0,0,0,1,0)
  }

  //***************************************************************PROPER DRAW FUNCTION***********************************************************************

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  //gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isLighting, true); // Will apply lighting

  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
 //
//leaf colours
  var colorsLeaf = new Float32Array([    // colors
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v0-v1-v2-v3 front
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v0-v3-v4 right
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v1-v5-v2 left
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v1-v4-v3-v2 down
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v4-v1-v0-v5 back　

     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v0-v1-v2-v3 front
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v0-v3-v4 right
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v1-v5-v2 left
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v1-v4-v3-v2 down
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v4-v1-v0-v5 back　

     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v0-v1-v2-v3 front
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v0-v3-v4 right
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v1-v5-v2 left
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v1-v4-v3-v2 down
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v4-v1-v0-v5 back　

     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v0-v1-v2-v3 front
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v0-v3-v4 right
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v1-v5-v2 left
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v1-v4-v3-v2 down
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v4-v1-v0-v5 back　

     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v0-v1-v2-v3 front
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v0-v3-v4 right
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v1-v5-v2 left
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v1-v4-v3-v2 down
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v4-v1-v0-v5 back　

     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v0-v1-v2-v3 front
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v0-v3-v4 right
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v1-v5-v2 left
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v1-v4-v3-v2 down
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v4-v1-v0-v5 back　

     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v0-v1-v2-v3 front
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v0-v3-v4 right
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176, // v1-v5-v2 left
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176, // v1-v4-v3-v2 down
     0.322,0.42,0.176,   0.322,0.42,0.176,   0.322,0.42,0.176,  0.322,0.42,0.176 // v4-v1-v0-v5 back　
  ]);

  //To-do list
  // * Learn to apply textures to these objects
  // * Learn about changing the scene background
  // * Learn how to add a light source

 modelHouse(gl);
 modelPlant(gl, 35,-67,40,0.25, colorsLeaf, [0.6,0.3,0],0);
 modelBird(gl,17,-97,150,0.1, [0.6,0.6,0.6], [0.4,0.4,0.4]);

 //Implement these functions
 //modelLamp(gl,pos_x,pos_y,pos_z,scale,flip);

}
function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);


  // Draw the cube
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}


// var sine = 1;
// var then = 0;
// var count = 0;
// function render(now) {
//   var delta = now - then;
//   then = now;
//   count +=0.2
//   modelPlant(gl, 0,0,-30,0.25, colorsLeaf, [0.6,0.3,0],0);
//   sine = Math.sin(count);
//   gO_xAngle+=sine*0.1;
//   requestAnimationFrame(render);
// }
// requestAnimationFrame(render);

// function render(now){
//
//    modelBird(gl,2,-5,-12,0.5, [0.5,0.7,0.5], [0.8,0.6,0.8]);
//    if (Math.abs(gO_xMove)%10 <= 1 && Math.abs(gO_xMove) > 1){
//      sign *= -1;
//    }
//    gO_xMove += sign*0.1;
//    requestAnimationFrame(render);
// }
// requestAnimationFrame(render);
