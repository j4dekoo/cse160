class Cube{
    constructor(){
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.buffer = null;
    }

    render(){
        var rgba = this.color;

        // color value
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // pass model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Create a buffer object
        if (this.buffer === null) {
            this.buffer = gl.createBuffer();
            if (!this.buffer) {
            console.log('Failed to create the buffer');
            return -1;
            }
        }

        // top (brightest)
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3D( [0,1,0, 1,1,1, 1,1,0] , this.buffer);
        drawTriangle3D( [0,1,0, 1,1,1, 0,1,1] , this.buffer);

        // front (bright)
        gl.uniform4f(u_FragColor, rgba[0]*0.95, rgba[1]*0.95, rgba[2]*0.95, rgba[3]);
        drawTriangle3D( [0,0,0, 1,1,0, 1,0,0] , this.buffer);
        drawTriangle3D( [0,0,0, 1,1,0, 0,1,0] , this.buffer);
        
        // left
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
        drawTriangle3D( [0,0,0, 0,1,1, 0,0,1] , this.buffer);
        drawTriangle3D( [0,0,0, 0,1,1, 0,1,0] , this.buffer);
        
        // right
        gl.uniform4f(u_FragColor, rgba[0]*0.85, rgba[1]*0.85, rgba[2]*0.85, rgba[3]);
        drawTriangle3D( [1,0,0, 1,1,1, 1,0,1] , this.buffer);
        drawTriangle3D( [1,0,0, 1,1,1, 1,1,0] , this.buffer);

        // back (dark)
        gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
        drawTriangle3D( [0,0,1, 1,1,1, 1,0,1] , this.buffer);
        drawTriangle3D( [0,0,1, 1,1,1, 0,1,1] , this.buffer);

        // botton (darkest)
        gl.uniform4f(u_FragColor, rgba[0]*0.75, rgba[1]*0.75, rgba[2]*0.75, rgba[3]);
        drawTriangle3D( [0,0,0, 1,0,1, 1,0,0] , this.buffer);
        drawTriangle3D( [0,0,0, 1,0,1, 0,0,1] , this.buffer);

    }

}
