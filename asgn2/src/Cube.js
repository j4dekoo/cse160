class Cube{
    constructor(){
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render(){
        var rgba = this.color;

        // color value
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // front of cube
        drawTriangle3D( [0.0, 0.0, 0.0,    1.0, 1.0, 0.0,   1.0, 0.0, 0.0])
        drawTriangle3D( [0.0, 0.0, 0.0,    0.0, 1.0, 0.0,   1.0, 1.0, 0.0])

        // fake lighting
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        // top of cube
        drawTriangle3D( [0.0, 1.0, 0.0,    0.0, 1.0, 1.0,   1.0, 1.0, 1.0])
        drawTriangle3D( [0.0, 1.0, 0.0,    1.0, 1.0, 1.0,   1.0, 1.0, 0.0])

        // back of cube
        drawTriangle3D([1.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 0.0, 1.0]);
        drawTriangle3D([0.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0]);

        // bottom
        drawTriangle3D([0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   0.0, 0.0, 1.0]);
        drawTriangle3D([1.0, 0.0, 0.0,   1.0, 0.0, 1.0,   0.0, 0.0, 1.0]);

        // left
        drawTriangle3D([0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0]);
        drawTriangle3D([0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0]);

        // fake lighting
        gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);

        // right
        drawTriangle3D([1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0]);
        drawTriangle3D([1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0]);

        /*
        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Enable attributes
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Draw the cube in one call
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);*/
        
    }

}

/*this.vertices = new Float32Array([
            // front
            0.0, 0.0, 0.0,    1.0, 1.0, 0.0,   1.0, 0.0, 0.0,
            0.0, 0.0, 0.0,    0.0, 1.0, 0.0,   1.0, 1.0, 0.0,

            // top
            0.0, 1.0, 0.0,    0.0, 1.0, 1.0,   1.0, 1.0, 1.0,
            0.0, 1.0, 0.0,    1.0, 1.0, 1.0,   1.0, 1.0, 0.0,

            // back
            1.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0,

            // bottom
            0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   0.0, 0.0, 1.0,
            0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   0.0, 0.0, 1.0,

            // left
            0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0,
            0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0,

            // right
            1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0,
            1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0,
        ]); */
