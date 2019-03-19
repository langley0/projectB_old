import voxel from '../lib/voxel';
import Entity from './entity';
import Transition from './transition';
import Types from '../share/gametypes';
import Animation from './animation';

const getOrientationAsString = function(orientation) {
    switch(orientation) {
        case Types.Orientations.LEFT: return "left"; break;
        case Types.Orientations.RIGHT: return "right"; break;
        case Types.Orientations.UP: return "up"; break;
        case Types.Orientations.DOWN: return "down"; break;
    }
};

export default class Character extends Entity{
    constructor(id, kind) {
        super(id, kind);
        // position 

        // stat
        
        // position moving
        this.nextGridX = -1;
    	this.nextGridY = -1;
        this.orientation = Types.Orientations.DOWN;

        this.movement = new Transition();
        this.path = null;
        this.newDestination = null;
    	this.adjacentTiles = {};

        // animation speed
        this.animations = {};
        this.currentAnimation = null;
        this.flipSpriteX = false;
        this.flipSpriteY = false;

        this.moveSpeed = 120;
        this.walkSpeed = 100;
        this.idleSpeed = 450;

      
        // combat 

        // build mesh
        // 캐릭터는 이미지로부터 복셀을 빌드해서 가지고 있게 된다
        

    }

    setSprite(sprite) {
        this.sprite = sprite;

        for(const name in sprite.data.animations) {
            const a = sprite.data.animations[name];
            this.animations[name] = new Animation(name, a.length, a.row, sprite.data.width, sprite.data.height);
        }
    }

    getAnimationByName(name) {
        if(name in this.animations) {
            return this.animations[name];
        }
    }

    setAnimation(name, speed, count, onEndCount) {
        if(this.currentAnimation && this.currentAnimation.name === name) {
            return;
        }
    
        const a = this.getAnimationByName(name);

        if(a) {
            this.currentAnimation = a;
            if(name.substr(0, 3) === "atk") {
                this.currentAnimation.reset();
            }
            this.currentAnimation.setSpeed(speed);
            this.currentAnimation.setCount(count ? count : 0, onEndCount || function() {
                this.idle();
            });
        }
    }

    animate(animation, speed, count, onEndCount) {
        const oriented = ['atk', 'walk', 'idle'];
        const o = this.orientation;
        
        if(!(this.currentAnimation && this.currentAnimation.name === "death")) { // don't change animation if the character is dying
            this.flipSpriteX = false;
            this.flipSpriteY = false;
    
            if(_.indexOf(oriented, animation) >= 0) {
                animation += "_" + (o === Types.Orientations.LEFT ? "right" : getOrientationAsString(o));
                this.flipSpriteX = (this.orientation === Types.Orientations.LEFT) ? true : false;
            }

            this.setAnimation(animation, speed, count, onEndCount);
        }
    }

    /*getFramePixelData() {
        // 주어진 위치의 데이터를 복사해온다
        const canvas = document.createElement('canvas');
        canvas.width = this.sprite.width;
        canvas.height = this.sprite.height;
        
        const context = canvas.getContext('2d');
        context.translate(0, this.sprite.height);
        context.scale(1, -1);

        context.drawImage(this.sprite.image, 0, 0);
        // 프레임 데이터를 가져온다
        // 원래는 json 으로 가져와야 하는데.. 일단 이부분은 하드코딩해서 진행
        const frameWidth = 32;
        const frameheight = 32;
        const data = context.getImageData(0, 0, frameWidth, frameheight);

        return data;
    }*/

    buildMesh() {
        if (this.sprite) {
            /*const data = this.getFramePixelData();
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
            mesh.castShadow = true;

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

            // 쉐터링 객체를 만든다
            const cubeData = voxel.buildCube([0,0,0], [data.width,data.height,1], function(x, y, z) {
                const p = (x + y*data.width)*4;
                const r = data.data[p + 0];
                const g = data.data[p + 1];
                const b = data.data[p + 2];
                const a = data.data[p + 3];
                
                return a === 255 ? (r << 16) + (g << 8) + b : 0;
            });

            const shatters = [];
            const _material = material.clone();
            for (let j = 0; j < (cubeData.vertices.length/24); ++j) {
                
                const result = cubeData;
                const voffset = j*24;
                const geometry = new THREE.Geometry(); 
                for(let i=0; i<24; ++i) {
                   
                    const q = result.vertices[i + voffset];
                    geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
                }
                for(let i=0; i< 6; ++i) {
                    const offset = j*6;
                    const q = result.faces[i + offset];
                    const color = new THREE.Color(q[4]);
    
                    const f1 = new THREE.Face3(q[0]-voffset, q[1]-voffset, q[2]-voffset);
                    f1.color = color;
                    f1.vertexColors = [color, color,color];
                    geometry.faces.push(f1);
    
                    const f2 = new THREE.Face3(q[2]-voffset, q[3]-voffset, q[0]-voffset);
                    f2.color = color;
                    f2.vertexColors = [color, color,color];
                    geometry.faces.push(f2);

                    
                }
                geometry.computeFaceNormals();
                geometry.computeBoundingBox();
                
                const mesh	= new THREE.Mesh( geometry, _material );
                mesh.castShadow = true;
                shatters.push(mesh);

                // 포지션을 반경 5 에 적절히 흩어놓자
                const v = Math.random() * Math.PI * 2;
                const r = Math.random() * 12;
                mesh.position.set(r * Math.cos(v), -geometry.boundingBox.min.y,  r * Math.sin(v));
                this.shatters = shatters;
            }*/

            const geometry = new THREE.PlaneGeometry( 32, 32 );
            geometry.computeFaceNormals();
            geometry.computeBoundingBox();
                    
            const tex = new THREE.Texture();
            tex.image = this.sprite.image;
            tex.format = THREE.RGBAFormat;
            tex.needsUpdate  = true;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

            const column = this.sprite.width / this.sprite.data.width;
            const row = this.sprite.height / this.sprite.data.height;
            tex.repeat.set(1/column, -1/row);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;

            const material = new THREE.MeshStandardMaterial({ map: tex, transparent: true });
            const mesh = new THREE.Mesh( geometry, material );

            // 그림자용 메쉬
            const geometryShadow = new THREE.SphereGeometry( this.sprite.data.width / 5, 32, 32 );
            const materialShadow = new THREE.MeshBasicMaterial({transparent: true, opacity: 0});
            const shadow = new THREE.Mesh( geometryShadow, materialShadow );
            shadow.scale.set(1, 2, 1);
            shadow.castShadow = true;
            mesh.add(shadow);

            this.mesh = mesh;
            this.offset = {
                x: 0,
                y: -this.sprite.data.offset_y || 0,
                z: 0,
            }
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

    onStartPathing(callback) {
        this.start_pathing_callback = callback;
    }

    onStopPathing(callback) {
        this.stop_pathing_callback = callback;
    }

    onBeforeStep(callback) {
        this.before_step_callback = callback;
    }

    onStep(callback) {
        this.step_callback = callback;
    }

    isMoving() {
        return !(this.path === null);
    }

    hasMoved() {
        if(this.hasmoved_callback) {
            this.hasmoved_callback(this);
        }
    }

    hasNextStep() {
        return (this.path.length - 1 > this.step);
    }

    hasChangedItsPath() {
        return !(this.newDestination === null);
    }

    setOrientation(orientation) {
        if(orientation) {
            this.orientation = orientation;
        }
    }

    idle(orientation) {
        this.setOrientation(orientation);
        this.animate("idle", this.idleSpeed);
    }

    walk(orientation) {
        this.setOrientation(orientation);
        this.animate("walk", this.walkSpeed);
    }

    go(x, y) {
        if(this.followingMode) {
            this.followingMode = false;
            this.target = null;
        }
        this.moveTo(x, y);
    }

    follow(entity) {
        if(entity) {
            this.followingMode = true;
            this.moveTo(entity.gridX, entity.gridY);
        }
    }

    moveTo(x, y) {
        this.destination = { gridX: x, gridY: y };

        if(this.isMoving()) {
            this.continueTo(x, y);
        } else {
            const path = this.requestPathfindingTo(x, y);
            this.followPath(path);
        }
    }

    stop() {
        if(this.isMoving()) {
            this.interrupted = true;
        }
    }

    continueTo(x, y) {
        this.newDestination = { x: x, y: y };
    }

    updateMovement() {
        const p = this.path;
        const i = this.step;
    
        if(p[i][0] < p[i-1][0]) {
            this.walk(Types.Orientations.LEFT);
        }
        if(p[i][0] > p[i-1][0]) {
            this.walk(Types.Orientations.RIGHT);
        }
        if(p[i][1] < p[i-1][1]) {
            this.walk(Types.Orientations.UP);
        }
        if(p[i][1] > p[i-1][1]) {
            this.walk(Types.Orientations.DOWN);
        }
    }

    followPath(path) {
        if(path.length > 1) { // Length of 1 means the player has clicked on himself
            this.path = path;
            this.step = 0;

            if(this.followingMode) {
                // 오브젝트를 향해 갈때는 제일 마지막 위치가 해당 오브젝트가 있는 위치이기 직전에서 멈추도록 한다
                path.pop();
            }
        
            if(this.start_pathing_callback) {
                this.start_pathing_callback(path);
            }
            this.nextStep();
        }
    }

    nextStep() {
        let stop = false;
        
        if(this.isMoving()) {
            if(this.before_step_callback) {
                this.before_step_callback();
            }
        
            this.updatePositionOnGrid();
           
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
                    const x = this.newDestination.x;
                    const y = this.newDestination.y;
                    const path = this.requestPathfindingTo(x, y);
            
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

    updatePositionOnGrid() {
        this.setGridPosition(this.path[this.step][0], this.path[this.step][1]);
    }

    setTarget(target) {
        if(this.target !== target) { // If it's not already set as the target
            this.target = target;
        }
    }
}