const THREE = require('../lib/three').THREE;
import voxel from '../lib/voxel';
import Entity from './entity';
import Transition from './transition';
import Types from '../share/gametypes';

export default class Character extends Entity{
    constructor(id, kind) {
        super(id, kind);
        // position 

        // stat

        // position moving
        this.orientation = Types.Orientations.DOWN;
        this.movement = new Transition();
        this.path = null;

        // combat 

        // build mesh
        // 캐릭터는 이미지로부터 복셀을 빌드해서 가지고 있게 된다
        

    }

    setSprite(sprite) {
        this.sprite = sprite;
        this.buildMesh();
    }

    getFramePixelData() {
        // 주어진 위치의 데이터를 복사해온다
        const canvas = document.createElement('canvas');
        canvas.width = this.sprite.width;
        canvas.height = this.sprite.height;
        
        const context = canvas.getContext('2d');
        context.translate(0, this.sprite.height);
        context.scale(1, -1);

        context.drawImage(this.sprite, 0, 0);
        // 프레임 데이터를 가져온다
        // 원래는 json 으로 가져와야 하는데.. 일단 이부분은 하드코딩해서 진행
        const frameWidth = 32;
        const frameheight = 32;
        const data = context.getImageData(0, 0, frameWidth, frameheight);

        return data;
    }

    buildMesh() {
        if (this.sprite) {
            const data = this.getFramePixelData();
            const result = voxel.build([0,0,0], [data.width,data.height,1], function(x, y, z) {
                const p = (x + y*data.width)*4;
                const r = data.data[p + 0];
                const g = data.data[p + 1];
                const b = data.data[p + 2];
                const a = data.data[p + 3];
                
                return a === 255 ? (r << 16) + (g << 8) + b : 0;
            });

            const geometry = new THREE.Geometry();
            for(let i=0; i<result.vertices.length; ++i) {
                const q = result.vertices[i];
                geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
            }
            for(let i=0; i<result.faces.length; ++i) {
                const q = result.faces[i];
                const color = new THREE.Color(q[4]);

                const f1 = new THREE.Face3(q[0], q[1], q[2]);
                f1.color = color;
                f1.vertexColors = [color, color,color];
                geometry.faces.push(f1);

                const f2 = new THREE.Face3(q[2], q[3], q[0]);
                f2.color = color;
                f2.vertexColors = [color, color,color];
                geometry.faces.push(f2);
            }

            geometry.computeFaceNormals();

            geometry.verticesNeedUpdate = true;
            geometry.elementsNeedUpdate = true;
            geometry.normalsNeedUpdate = true;
            
            geometry.computeBoundingBox();

            const material	= new THREE.MeshLambertMaterial({
                vertexColors: true
            });

            const mesh	= new THREE.Mesh( geometry, material );
            mesh.doubleSided = false;

            // 바운딩 박스의 중앙으로 좌표를 옮긴다
            const min = geometry.boundingBox.min;
            const max = geometry.boundingBox.max;

            // TODO : 오프셋도 나중에 데이터와 시켜야 한다
            this.offset = {
                x: -16,
                y: -min.y,
                z: 0,
            }
            
            this.mesh = mesh;
        }
    }

    requestPathfindingTo(x, y) {
        if(this.request_path_callback) {
            return this.request_path_callback(x, y);
        } else {
            return [];
        }
    }

    onRequestPath(callback) {
        this.request_path_callback = callback;
    }

    isMoving() {
        return !(this.path === null);
    }

    go(x, y) {
        this.destination = { gridX: x, gridY: y };
            
        if(this.isMoving()) {
            this.continueTo(x, y);
        } else {
            
            const path = this.requestPathfindingTo(x, y);
            this.followPath(path);
        }
    }

    continueTo(x, y) {
        this.newDestination = { x: x, y: y };
    }

    followPath(path) {
        if(path.length > 1) { // Length of 1 means the player has clicked on himself
            this.path = path;
            this.step = 0;
        
            if(this.followingMode) { // following a character
                path.pop();
            }
        
            if(this.start_pathing_callback) {
                this.start_pathing_callback(path);
            }
            this.nextStep();
        }
    }

    nextStep: function() {
        var stop = false,
            x, y, path;
    
        if(this.isMoving()) {
            if(this.before_step_callback) {
                this.before_step_callback();
            }
        
            this.updatePositionOnGrid();
            this.checkAggro();
        
            if(this.interrupted) { // if Character.stop() has been called
                stop = true;
                this.interrupted = false;
            }
            else {
                if(this.hasNextStep()) {
                    this.nextGridX = this.path[this.step+1][0];
                    this.nextGridY = this.path[this.step+1][1];
                }
        
                if(this.step_callback) {
                    this.step_callback();
                }
            
                if(this.hasChangedItsPath()) {
                    x = this.newDestination.x;
                    y = this.newDestination.y;
                    path = this.requestPathfindingTo(x, y);
            
                    this.newDestination = null;
                    if(path.length < 2) {
                        stop = true;
                    }
                    else {
                        this.followPath(path);
                    }
                }
                else if(this.hasNextStep()) {
                    this.step += 1;
                    this.updateMovement();
                }
                else {
                    stop = true;
                }
            }
        
            if(stop) { // Path is complete or has been interrupted
                this.path = null;
                this.idle();
            
                if(this.stop_pathing_callback) {
                    this.stop_pathing_callback(this.gridX, this.gridY);
                }
            }
        }
    }
}