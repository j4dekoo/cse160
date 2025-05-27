class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();

        this.buffer = null;
        this.texNum = -2;

        this.vertexBuffer = gl.createBuffer();
        this.uvBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        this.vertices = [];
        this.uvs = [];
        this.normals = [];

        this.createSphere();
        this.vertexCount = this.vertices.length / 3;
        this.initBuffers();
    }

    createSphere(){
        const d = Math.PI / 10;
        const dd = Math.PI / 10;

        for (let t = 0; t < Math.PI; t += d) {
            for (let r = 0; r < 2 * Math.PI; r += d) {
                let p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
				let p2 = [Math.sin(t + dd) * Math.cos(r), Math.sin(t + dd) * Math.sin(r), Math.cos(t + dd)];
				let p3 = [Math.sin(t) * Math.cos(r + dd), Math.sin(t) * Math.sin(r + dd), Math.cos(t)];
				let p4 = [Math.sin(t + dd) * Math.cos(r + dd), Math.sin(t + dd) * Math.sin(r + dd), Math.cos(t + dd)];

				let uv1 = [t / Math.PI, r / (2 * Math.PI)];
				let uv2 = [(t + dd) / Math.PI, r / (2 * Math.PI)];
				let uv3 = [t / Math.PI, (r + dd) / (2 * Math.PI)];
				let uv4 = [(t + dd) / Math.PI, (r + dd) / (2 * Math.PI)];

                this.vertices.push(...p1, ...p2, ...p4);
                this.uvs.push(...uv1, ...uv2, ...uv4);
                this.normals.push(...p1, ...p2, ...p4);

                this.vertices.push(...p1, ...p4, ...p3);
                this.uvs.push(...uv1, ...uv4, ...uv3);
                this.normals.push(...p1, ...p4, ...p3);

            }
        }

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

    }

}
