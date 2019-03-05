 "use strict";

function main() {
  /*============ Creating a canvas =================*/

         var canvas = document.getElementById('gl');
         gl = canvas.getContext('webgl');

         /*========== Defining and storing the geometry =========*/

         var vertices = [
           //front
            -0.5,0.75,0.0,
            -0.5,-0.75,0.0,
            0.5,-0.75,0.0,
            0.5,0.75,0.0,
            //back
            -0.5,0.75,-0.2,
            -0.5,-0.75,-0.2,
            0.5,-0.75,-0.2,
            0.5,0.75,-0.2,
            //left
            -0.5,0.75,-0.2,
            -0.5,-0.75,0.0,
            -0.5,-0.75,-0.2,
            -0.5,0.75,0.0,
            //right
            0.5,0.75,-0.2,
            0.5,-0.75,0.0,
            0.5,-0.75,-0.2,
            0.5,0.75,0.0
         ];

         var indices = [
           //front
           3,2,1,
           3,1,0,
           //back
           7,6,5,
           7,5,4,
           //left
           11,10,9,
           11,9,8,
           //right
           15,14,13,
           15,13,12,
         ];

         // Create an empty buffer object to store vertex buffer
         var vertex_buffer = gl.createBuffer();

         // Bind appropriate array buffer to it
         gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

         // Pass the vertex data to the buffer
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

         // Unbind the buffer
         gl.bindBuffer(gl.ARRAY_BUFFER, null);

         // Create an empty buffer object to store Index buffer
         var Index_Buffer = gl.createBuffer();
         console.log(gl.getError());

         // Bind appropriate array buffer to it
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

         // Pass the vertex data to the buffer
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

         // Unbind the buffer
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

         /*====================== Shaders =======================*/

         // Vertex shader source code
         var vertCode =
            'attribute vec3 coordinates;' +
            'uniform mat4 Pmatrix;'+
            'uniform mat4 Vmatrix;'+
            'uniform mat4 Mmatrix;'+
            'void main(void) {' +
               ' gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(coordinates, 1.0);' +
            '}';

         // Create a vertex shader object
         var vertShader = gl.createShader(gl.VERTEX_SHADER);

         // Attach vertex shader source code
         gl.shaderSource(vertShader, vertCode);

         // Compile the vertex shader
         gl.compileShader(vertShader);
         console.log(gl.getError());

         // Fragment shader source code
         var fragCode =
            'void main(void) {' +
               ' gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);' +
            '}';

         // Create fragment shader object
         var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

         // Attach fragment shader source code
         gl.shaderSource(fragShader, fragCode);

         // Compile the fragment shader
         gl.compileShader(fragShader);

         // Create a shader program object to
         // store the combined shader program
         var shaderProgram = gl.createProgram();

         // Attach a vertex shader
         gl.attachShader(shaderProgram, vertShader);

         // Attach a fragment shader
         gl.attachShader(shaderProgram, fragShader);

         // Link both the programs
         gl.linkProgram(shaderProgram);

         // Use the combined shader program object
         gl.useProgram(shaderProgram);

         /* ======= Associating shaders to buffer objects =======*/

         // Bind vertex buffer object
         gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

         // Get the attribute location
         var coord = gl.getAttribLocation(shaderProgram, "coordinates");

         // Point an attribute to the currently bound VBO
         gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

         // Enable the attribute
         gl.enableVertexAttribArray(coord);

         //Getting matrices
         var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
         var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
         var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");
         console.log(gl.getError());


         /*============= Drawing the Quad ================*/

         // Clear the canvas
         gl.clearColor(1.0, 1.0, 1.0, 1.0);

         gl.enable(gl.DEPTH_TEST);
         gl.depthFunc(gl.LEQUAL);
         gl.clearColor(1, 1, 1, 1);
         gl.clearDepth(1.0);

         // Set the view port
         gl.viewport(0,0,canvas.width,canvas.height);
         gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
         var mov_matrix = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
         var view_matrix = [0.25,0,0,0, 0,0.25,0,0, 0,0,0.25,0, 0,0,0,0.25];
         // translating z
         view_matrix[14] = view_matrix[14]-6;//zoom
         function get_projection(angle, a, zMin, zMax) {
            var ang = Math.tan((angle*.5)*Math.PI/180);//angle*.5
            return [
               0.5/ang, 0 , 0, 0,
               0, 0.5*a/ang, 0, 0,
               0, 0, -(zMax+zMin)/(zMax-zMin), -1,
               0, 0, (-2*zMax*zMin)/(zMax-zMin), 0
            ];
         }

         var proj_matrix = get_projection(10, canvas.width/canvas.height, 1, 100);
         gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
         gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
         gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
         console.log(gl.getError());
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
         console.log(gl.getError());
         // Draw the triangle
         gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
         console.log(gl.getError());
}

main();
