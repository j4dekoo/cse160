class Cone {
    constructor(segments = 20) {
        this.type = 'cone';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = segments;  // how smooth the cone will look
        this.height = 1.0;          // height of the cone
        this.radius = 0.5;          // radius of the base
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        const angleStep = 360 / this.segments;
        const baseCenter = [0, 0, 0];
        const tip = [0, this.height, 0];

        for (let i = 0; i < 360; i += angleStep) {
            const angle1 = (i * Math.PI) / 180;
            const angle2 = ((i + angleStep) * Math.PI) / 180;

            const x1 = this.radius * Math.cos(angle1);
            const z1 = this.radius * Math.sin(angle1);
            const x2 = this.radius * Math.cos(angle2);
            const z2 = this.radius * Math.sin(angle2);

            // Base triangle (bottom circle)
            drawTriangle3D([
                baseCenter[0], baseCenter[1], baseCenter[2],
                x1, baseCenter[1], z1,
                x2, baseCenter[1], z2
            ]);

            // Side triangle (cone surface)
            drawTriangle3D([
                tip[0], tip[1], tip[2],
                x1, baseCenter[1], z1,
                x2, baseCenter[1], z2
            ]);
        }
    }
}
