class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();

        this.buffer = null;
        this.texNum = -2;

        this.vertexBuffer = gl.createBuffer();
        this.uvBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        this.vertices = [
            //front
            0, 0, 0, 1, 1, 0, 1, 0, 0,
            0, 0, 0, 1, 1, 0, 0, 1, 0,

            //back
            0, 0, 1, 1, 1, 1, 1, 0, 1,
            0, 0, 1, 1, 1, 1, 0, 1, 1,

            //top
            0, 1, 0, 1, 1, 1, 1, 1, 0,
            0, 1, 0, 1, 1, 1, 0, 1, 1,

            //bottom
            0, 0, 0, 1, 0, 1, 1, 0, 0,
            0, 0, 0, 1, 0, 1, 1, 0, 0,

            //left
            0, 0, 0, 0, 1, 1, 0, 0, 1,
            0, 0, 0, 0, 1, 1, 0, 1, 0,

            //right
            1, 0, 0, 1, 1, 1, 1, 0, 1,
            1, 0, 0, 1, 1, 1, 1, 1, 0,
        ];

        this.uvs = [
            0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
            0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0,
            0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1,
            0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1,
            0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1,
            0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1,
        ];

        this.normals = [
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        ];

        this.vertexCount = this.vertices.length / 3;
        this.initBuffers();
    }

    initBuffers() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

    }

    render() {
        var rgba = this.color;

        gl.uniform1i(u_TexNum, this.texNum);

        // color value
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);


        // positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // uvs
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
 
        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

        /* front (bright)
        gl.uniform4f(u_FragColor, rgba[0] * 0.95, rgba[1] * 0.95, rgba[2] * 0.95, rgba[3]);
        drawTriangle3DUVNormal([0, 0, 0, 1, 1, 0, 1, 0, 0], [0, 0, 1, 1, 1, 0], [0, 0, -1, 0, 0, -1, 0, 0, -1]);
        drawTriangle3DUVNormal([0, 0, 0, 1, 1, 0, 0, 1, 0], [0, 0, 0, 1, 1, 1], [0, 0, -1, 0, 0, -1, 0, 0, -1]);

        // back (dark)
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3DUVNormal([0, 0, 1, 1, 1, 1, 1, 0, 1], [0, 0, 1, 0, 1, 1], [0, 0, 1, 0, 0, 1, 0, 0, 1]);
        drawTriangle3DUVNormal([0, 0, 1, 1, 1, 1, 0, 1, 1], [0, 0, 0, 1, 1, 0], [0, 0, 1, 0, 0, 1, 0, 0, 1]);

        // top (brightest)
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3DUVNormal([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0], [0, 1, 0, 0, 1, 0, 0, 1, 0]);
        drawTriangle3DUVNormal([0, 1, 0, 1, 1, 1, 0, 1, 1], [0, 0, 1, 1, 0, 1], [0, 1, 0, 0, 1, 0, 0, 1, 0]);

        // botton (darkest)
        gl.uniform4f(u_FragColor, rgba[0] * 0.75, rgba[1] * 0.75, rgba[2] * 0.75, rgba[3]);
        drawTriangle3DUVNormal([0, 0, 0, 1, 0, 1, 1, 0, 0], [0, 0, 1, 1, 1, 0], [0, -1, 0, 0, -1, 0, 0, -1, 0]);
        drawTriangle3DUVNormal([0, 0, 0, 1, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 1], [0, -1, 0, 0, -1, 0, 0, -1, 0]);

        // left
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        drawTriangle3DUVNormal([0, 0, 0, 0, 1, 1, 0, 0, 1], [0, 0, 1, 1, 1, 0], [-1, 0, 0, -1, 0, 0, -1, 0, 0]);
        drawTriangle3DUVNormal([0, 0, 0, 0, 1, 1, 0, 1, 0], [0, 0, 1, 1, 0, 1], [-1, 0, 0, -1, 0, 0, -1, 0, 0]);

        // right
        gl.uniform4f(u_FragColor, rgba[0] * 0.85, rgba[1] * 0.85, rgba[2] * 0.85, rgba[3]);
        drawTriangle3DUVNormal([1, 0, 0, 1, 1, 1, 1, 0, 1], [0, 0, 1, 1, 1, 0], [1, 0, 0, 1, 0, 0, 1, 0, 0]);
        drawTriangle3DUVNormal([1, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 0, 1], [1, 0, 0, 1, 0, 0, 1, 0, 0]);*/
    }

}
