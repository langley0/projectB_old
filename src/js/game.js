import Player from './player';
import Updater from './updater';
import Map from './map';
import Pathfinder from './pathfinder';
import Entity from './entity';
import EntityFactory from './entityfactory';
import GLTFLoader from './gltfloader';

import OrbitControls  from 'three-orbitcontrols';
import Chest from './chest';
import Cutscene from './cutscene';

import ThreeUI from '../lib/three-ui/ThreeUI';
import GameWorld from './gameworld';

import SpriteData from './sprites';
//import * as THREE_ADDONS from 'three-addons';
import '../lib/bokehshader2';


export default class Game {
    init(canvas) {

        const width = canvas.width;
        const height = canvas.height;
        this.canvas = canvas;

        const renderer = new THREE.WebGLRenderer({canvas: canvas});
        renderer.shadowMap.enabled = true;
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( width, height);
        renderer.autoClear = false;

        const camera = new THREE.PerspectiveCamera( 20, canvas.width / canvas.height, 1, 3000 );
        /*const aspect = canvas.width / canvas.height;
        const frustumSize = 250;
        const camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
        camera.position.set( frustumSize, frustumSize, frustumSize );*/


        const ui = new ThreeUI(canvas, height);

        this.renderer = renderer;
        this.camera = camera;
        this.ui = ui;

        //===========================
        const scene = new THREE.Scene();
        this.scene = scene;
        
        // TODO : 카메라 시선을 플레이어에 맞추어야 한다
        //new OrbitControls(camera, renderer.domElement)

        // 게임 정보
        this.entities = {};
        this.entityGrid = null;
        this.phase = null;
        this.nextPhase = null;

        this.initPostprocessing(width, height);
    }

    initPostprocessing(width, height) {
        const postprocessing = { enabled: true };

        const depthShader = THREE.BokehDepthShader;
        const materialDepth = new THREE.ShaderMaterial( {
            uniforms: depthShader.uniforms,
            vertexShader: depthShader.vertexShader,
            fragmentShader: depthShader.fragmentShader
        } );

        materialDepth.uniforms[ 'mNear' ].value = this.camera.near;
		materialDepth.uniforms[ 'mFar' ].value = this.camera.far;
        postprocessing.materialDepth = materialDepth;

        const shaderSettings = {
            rings: 3,
            samples: 4
        };
        
        postprocessing.scene = new THREE.Scene();
        postprocessing.camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, - 10000, 10000 );
        postprocessing.camera.position.z = 100;
        postprocessing.scene.add( postprocessing.camera );
        const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
        postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( width, height, pars );
        postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( width, height, pars );

        const bokeh_shader = THREE.BokehShader;
        
        postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );
        postprocessing.bokeh_uniforms[ 'tColor' ].value = postprocessing.rtTextureColor.texture;
        postprocessing.bokeh_uniforms[ 'tDepth' ].value = postprocessing.rtTextureDepth.texture;
        postprocessing.bokeh_uniforms[ 'textureWidth' ].value = width;
        postprocessing.bokeh_uniforms[ 'textureHeight' ].value = height;
        postprocessing.bokeh_uniforms[ 'znear' ].value = this.camera.near;
        postprocessing.bokeh_uniforms[ 'zfar' ].value = this.camera.far;
        postprocessing.bokeh_uniforms[ 'shaderFocus' ].value = false;
        postprocessing.bokeh_uniforms[ 'focusCoords' ].value.set( 0.5, 0.5 );
                    
        postprocessing.materialBokeh = new THREE.ShaderMaterial( {
            uniforms: postprocessing.bokeh_uniforms,
            vertexShader: bokeh_shader.vertexShader,
            fragmentShader: bokeh_shader.fragmentShader,
            defines: {
                RINGS: shaderSettings.rings,
                SAMPLES: shaderSettings.samples
            }
        } );
        postprocessing.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( width, height ), postprocessing.materialBokeh );
        postprocessing.quad.position.z = - 500;
        postprocessing.scene.add( postprocessing.quad );

        this.postprocessing = postprocessing;
    }

    updateCamera() {
        if (this.camera && this.player) {
            // 카메라가 플레이어를 따라다니도록 한다
            const reltiveOffset = this.battlemode ? new THREE.Vector3(200, 100, 400)  : new THREE.Vector3(0, 150, 500);
            const cpos = reltiveOffset.applyMatrix4(this.player.mesh.matrixWorld);
            const lookTarget = this.player.mesh.position.clone();
            lookTarget.y += 16;
            
            // 카메라가 물체를 쫓아가야 한다.
            const diff = cpos.sub(this.camera.position);
            const speed = 10;

            const scalar = Math.min(diff.length(), speed);
            const offset = diff.normalize().multiplyScalar(scalar); 
         
            this.camera.position.copy(this.camera.position.add(offset));
            this.camera.lookAt(lookTarget);

            this.player.spriteMesh.lookAt(this.camera.position);
        }
    }

    tick() {
        this.currentTime = new Date().getTime();

        // 로직 -> 렌더링 순서로 업데이트를 한다
        this.updater.update();
        this.ui.render();
        this.updateCamera();

        if (this.postprocessing.enabled) {
            const renderer = this.renderer;
            const postprocessing = this.postprocessing;
            

            // 플레이어 카메라간의 거리를 구한다
            const targetDistance = this.player.mesh.position.distanceTo(this.camera.position);
            const zfar = this.camera.far;
            const znear = this.camera.near;
            
            const v = Math.max( 0, Math.min( 1,( ( targetDistance - znear ) / ( zfar - znear ) )));
            const sdepth =  v * v * (3 - 2 *v);
            const ldepth =  - zfar * znear / ( (1 - sdepth) * ( zfar - znear ) - zfar );

            //console.log(zfar, znear, targetDistance, v, sdepth, ldepth);
            
            postprocessing.bokeh_uniforms[ 'focalDepth' ].value = ldepth;



            
            renderer.clear();
            // render scene into texture
            renderer.setRenderTarget( postprocessing.rtTextureColor );
            renderer.clear();
            renderer.render( this.scene, this.camera );
            // render depth into texture
            this.scene.overrideMaterial = postprocessing.materialDepth;
            renderer.setRenderTarget( postprocessing.rtTextureDepth );
            renderer.clear();
            renderer.render( this.scene, this.camera );
            this.scene.overrideMaterial = null;
            // render bokeh composite
            renderer.setRenderTarget( null );
            renderer.render( postprocessing.scene, postprocessing.camera );
        } else {
            // 기본 모드 처리
            this.scene.overrideMaterial = null;
            this.renderer.setRenderTarget(null);
            this.renderer.clear();
            this.renderer.render( this.scene, this.camera );
        }
        
        
        if (!this.isStopped) {
            requestAnimationFrame(this.tick.bind(this));
        }
    }

    start() {
        this.tick();
    }

    stop() {
        this.isStopped = true;
    }

    run(username) {
        // 리소스를 로딩하고 끝날때까지 기다린다.
        this.loadSprites();
        this.loadMap();
        this.loadModel();
        this.updater = new Updater(this);

        const wait = setInterval(() => {
            if (this.map.isLoaded && this.isSpritesLoaded() && this.model) {
                clearInterval(wait);

                // 리소스 로딩이 끝나면 서버에 접속한다
                // 접속이 완료되면 핸들러들을 연결하고 게임을 시작한다
                // TODO : 서버 접속을 만들어야 한다

                // 월드를 생성한다
                // TODO : terrain 생성코드를 나중에 여기로 옮겨와야 한다
                while (this.scene.children.length > 0) {
                    this.scene.remove(this.scene.children[0]);
                }

                const world = new GameWorld(this, this.map);
                this.world = world;
                
                    
                // 맵을 초기화한다
                // TODO: 맵을 여기서 초기화하도록 코드를 옮겨야 한다
                this.scene.add(world.terrain);
                this.scene.add(world.model);
                this.initEntityGrid();
                Entity.setGridSize(this.map.tilesize);

                // 월드 라이트를 추가
                // TODO : map에 따라서 라이트를 바꾸어야 한다
                // 헤미스피어를 붙인다
                /*const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
                hemiLight.color.setHSL( 0.6, 1, 0.6 );
                hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
                hemiLight.position.set( 0, 50, 0 );
                this.scene.add( hemiLight );*/
                const ambient = new THREE.AmbientLight(0xffffff, 1.5);
                this.scene.add( ambient );
                
                // 프랍을 배치한다
                let id = 2;
                for(const propData of this.map.props) {
                    const propEntity = EntityFactory.createEntity(propData.kind, id++, "");
                    // 배치할 좌표를 계산한다
                    propEntity.setGridPosition(propData.x, propData.y);
                    
                    if (propEntity instanceof Chest) {
                        propEntity.model =this.model; 
                        propEntity.mesh = propEntity.model.scene.clone();
                        propEntity.mesh.scale.set(5, 5, 5);
                        propEntity.mesh.rotation.y = Math.PI;
                    }
                    
                    this.addEntity(propEntity);
                    this.scene.add(propEntity.mesh);
                }

                // 몬스터를 배치한다.
                


                this.pathfinder = new Pathfinder(this.map.width, this.map.height)


                // 플레이어를 선언한다
                const player = new Player(1, username, "");
                player.setSprite(this.sprites["test2"]);
                player.buildMesh();
                player.onRequestPath((x, y) => {
                    const path = this.findPath(player, x, y);
                    return path;
                });

                player.onStopPathing((x, y) => {
                    if(player.target instanceof Chest) {
                        const chest = player.target;
                        player.target = null;

                        if (!chest.open) {
                            chest.open = true;

                            // 상자를 연다
                            const mixer = new THREE.AnimationMixer(chest.mesh.children[0]);
                            const clips = this.model.animations;
                            const clip = THREE.AnimationClip.findByName( clips, 'Cube.001Action_Cube.001' );
                            const action = mixer.clipAction( clip );
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            action.play();
                            const update = setInterval(() => {
                                mixer.update(0.05);
                                if (!action.isRunning()){
                                    clearInterval(update);
                                }
                            }, 10);
                        }



                        /*console.log(clip);

                        // 다음 프레임에 상자를 제거해버린다. 
                        // TODO : 이것도 좀 영리하게 만들수 없을까?
                        requestAnimationFrame(() => {
                            this.removeEntity(chest);
                            this.scene.remove(chest.mesh);
                            
                        });*/
                    }
                });

                // TODO : 화면에 배치하고 보이지 않게 하여야 한다
                player.setGridPosition(3, 3);
                player.idle();
                this.addEntity(player);
                this.unregisterEntityPosition(player); // 플레이어를 엔티티에 포함시키지않기위한 특수처리
                this.player = player;

                // 게임 씬 페이즈를 선언한다.
                // 등장컷신 -> 전투 -> (승리컷신) -> 탐험 -> 퇴장컷신 . 순으로 만들어진다.
                // 등장 컷신 
                this.nextPhase = new Cutscene(this, "enter");

                // 월드에 추가를 한다
                // TODO : entity 를 일괄로 처리할 수 있는 장치가 필요하다?>
                this.scene.add(this.player.mesh);
                this.start();
            }
        }, 100);

    }

    loadSprites() {
        const sprites = {};
        for (const data of SpriteData) {
            const sprite = { data: data, image:null, isLoaded: false  };
            sprites[data.id] = sprite;

            const img = new Image();
            img.src = `static/${data.id}.png`;
            img.onload = function() {
                sprite.image = img;
                sprite.isLoaded = true;
                sprite.width = img.width;
                sprite.height = img.height;
            }
        }

        this.sprites = sprites;
    }

    loadMap() {
        this.map = new Map();
    }

    loadModel() {
        //const modelNames = ["treasure"];
        var loader = new GLTFLoader();
        loader.load("static/box.gltf", (gltf) => {
            this.model = gltf; // 임시 코드... 모델을 어떻게 관리할까?
        },undefined, function ( error ) {

            console.error( error );
        
        });
    }

    isSpritesLoaded() {
        if (_.any(this.sprites, function(sprite) { return !sprite.isLoaded; } )) {
            return false;
        }
        return true;
    }

    initEntityGrid() {
        this.entityGrid = [];
        for(let i=0; i < this.map.height; i += 1) {
            this.entityGrid[i] = [];
            for(let j=0; j < this.map.width; j += 1) {
                this.entityGrid[i][j] = {};
            }
        }
    }

    addEntity(entity) {
        if(this.entities[entity.id] === undefined) {
            this.entities[entity.id] = entity;
            this.registerEntityPosition(entity);
        }
    }

    removeEntity(entity) {
        if(entity.id in this.entities) {
            this.unregisterEntityPosition(entity);
            delete this.entities[entity.id];
        }
    }
  
    registerEntityPosition(entity) {
        const x = entity.gridX;
        const y = entity.gridY;
    
        this.entityGrid[y][x][entity.id] = entity;
    }

    unregisterEntityPosition(entity) {
        const x = entity.gridX;
        const y = entity.gridY;

        if(this.entityGrid[y][x][entity.id]) {
            delete this.entityGrid[y][x][entity.id];
        }
    }

    getEntityAt(x, y) {
        if(this.map.isOutOfBounds(x, y) || !this.entityGrid) {
            return null;
        }
        
        const entities = this.entityGrid[y][x];
        let entity = null;
        if(_.size(entities) > 0) {
            entity = entities[_.keys(entities)[0]];
        } else {
            // entity = this.getItemAt(x, y);
        }
        return entity;
    }

    getItemAt(x, y) {
        return null;
    }

    getGridPosition(intersect, boundingbox) {
        const ts = this.map.tilesize;
        const xIndex = Math.floor((intersect.x - boundingbox.min.x) / ts );
        const yIndex = Math.floor((intersect.z - boundingbox.min.y) / ts );
        
        return { x: xIndex, y: yIndex };
    }

    click(x, y) {
        if (this.ui) {
            const result = this.ui.clickHandler(x, y);
            if (result) {
                return;
            }
        }

        if (this.phase) {
            this.phase.click(x, y);
        }

        const size = new THREE.Vector2();
        this.renderer.getSize(size);

        const mouse = new THREE.Vector2();
        mouse.x = (x / size.x) * 2 - 1;
        mouse.y = -(y / size.y) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( mouse, this.camera );
        // 지형터치를 어떻게 만들지?
        const intersects = raycaster.intersectObjects(this.scene.children);
        for ( const inter of intersects) {
            // TODO: 함수를 world 쪽에 만들어두어야 한다
            const pos = this.getGridPosition(inter.point, this.world.terrain.geometry.boundingBox);

            // 이제 여기서 무엇을 클릭했는지 조사한다
            const entity = this.getEntityAt(pos.x, pos.y);
            if (entity instanceof Chest) {
                // 상자를 향해  이동한다
                this.player.setTarget(entity);
                this.player.follow(entity);
            } else {
                // 해당 위치로 플레이어를 이동시킨다
                this.player.go(pos.x, pos.y);
            }
        }
    }

    keyDown(key) {
        if (key === 66) {
            // 전투모드를 활성화한다
            this.battlemode = !this.battlemode;
        }
    }

    forEachEntity(callback) {
        _.each(this.entities, function(entity) {
            callback(entity);
        });
    }

   
    findPath(character, x, y) {
        const path = [];
        if(this.map.isColliding(x, y)) {
            // 해당 위치가 갈수 없는 곳이다
            return path;
        }
    
        if(this.pathfinder && character) {
            const path = this.pathfinder.findPath(this.map.grid, character, x, y, false);
            return path;
        } 
        return [];
    }
}
