class Camera{
    constructor(){
        this.fov = 70;
        
        this.eye = new Vector3([0, 0, 3]);
        this.at = new Vector3([0, 0, 0]);
        this.up = new Vector3([0, 1, 0]);

        this.yaw = 0; // left right rotate
        this.pitch = 0; // up down

        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();

        this.updateViewMatrix();
    }

    updateViewMatrix(){
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                                  this.at.elements[0], this.at.elements[1], this.at.elements[2],
                                  this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    }

    updateProjectionMatrix(aspect){
        this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 1000);
    }

}