import Player from './player';
import Updater from './updater';
import Map from './map';
import Pathfinder from './pathfinder';
import Entity from './entity';
import EntityFactory from './entityfactory';
import GLTFLoader from './gltfloader';
import Types from '../share/gametypes';

import Chest from './chest';
import ThreeUI from '../lib/three-ui/ThreeUI';

import SpriteData from './sprites';
import '../lib/bokehshader2';
import Character from './character';
import MovieClip from './movieclip';

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
        const frustumSize = 100;
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
            let lookTarget;
            let cameraPos;
            const reltiveOffset = new THREE.Vector3(-200, 150, 200);
            if (this.battlemode) {
                // 전투에 참여하는 캐릭터들의 중간값을 본다.

                // 전투 참여 캐릭터들을 일단 스프라이트 메쉬로 뽑아낸다
                let center = new THREE.Vector3(0, 0, 0);
                let count = 0;
                this.forEachEntity((entity) => {
                    if (entity.spriteMesh) {
                        center = center.add(entity.mesh.position.clone());
                        count ++;
                    }
                });

                lookTarget = center.divideScalar(count);

                if (this.battle_asset.zoom_effect) {
                    // 거리를 줄인다
                    reltiveOffset.z = 250;
                    reltiveOffset.y = 75;
                }

            } else {
                lookTarget = this.player.mesh.position.clone();;
                lookTarget.y += 16;
            }

            
            cameraPos = reltiveOffset.add(lookTarget);

            
            
            // 카메라가 물체를 쫓아가야 한다.
            const diff = cameraPos.sub(this.camera.position);
            const speed = 5;

            const scalar = Math.min(diff.length(), speed);
            const offset = diff.normalize().multiplyScalar(scalar); 
         
            this.camera.position.add(offset);
            this.camera.lookAt(lookTarget);

            // 캐릭터 엔티티는 모두 이와 같이 처리한다
            this.forEachEntity((entity) => {
                if (entity.spriteMesh) {
                    entity.spriteMesh.lookAt(this.camera.position);
                }
            });
        }
    }

    tick() {
        this.currentTime = new Date().getTime();

        // 로직 -> 렌더링 순서로 업데이트를 한다
        this.updater.update();
        this.ui.render();

        // 배틀모드 특별처리
        if (this.battle_asset) {
            if (this.battle_asset.movie) {
                this.battle_asset.movie.update();
            }

            if (this.battle_asset.update) {
                this.battle_asset.update();
            }
        }


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

    enterZone(zoneName) {
        if (this.currentZone) {
            // 존에서 빠져나간다.
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
            // entitiy 들을 모두 제거한다 (올바르게 제거할 방법이 ??)
            this.entities = {};
        }

        this.map.initByName(zoneName);
        this.currentZone = zoneName;

        this.initEntityGrid();
        Entity.setGridSize(this.map.tilesize);

        // 렌더링 신 초기화
        this.scene.add(this.map.mesh);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add( ambient );

        // 프랍을 배치한다
        let id = 100;
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

        this.pathfinder = new Pathfinder(this.map.width, this.map.height)

        // 플레이어를 배치한다. 
        // TODO : 플레이어의 시작위치를 맵에 적어놔야 한다
        this.player.setGridPosition(3, 3);
        this.player.idle();
        this.addEntity(this.player);
        this.scene.add(this.player.mesh);
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

                // 플레이어를 선언한다
                const player = new Player(1, username, "");
                player.setSprite(this.sprites["test5"]);
                player.buildMesh();
                player.mesh.scale.set(0.5, 0.5, 0.5);
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
                    } 

                    if (this.map.isPortal(x, y)) {
                        // 워프 시킨다
                        const dest = this.map.getPortalDestination(x, y);
                        this.enterZone(dest);
                    }
                });

                this.player = player;

                this.enterZone('home');
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

    getGridPosition(intersect) {
        const offset = this.map.offset;
        const ts = this.map.tilesize;
        const xIndex = Math.floor((intersect.x - offset.x) / ts );
        const yIndex = Math.floor((intersect.z - offset.y) / ts );
        
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
            const pos = this.getGridPosition(inter.point);

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
            if (this.battlemode) {
                // ui 를 화면에 그린다
                const uiimg = new Image();
                // uiimg.src = "static/battleui.png";
                uiimg.src = "static/battle-turn2.png";
                uiimg.onload = () => {
                    const canvas = document.getElementById("foreground");
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(uiimg, 0, 0);
                };

                // 적을 추가하고 카메라타겟을 둘의 중간으로 잡는다
                const enemy = new Character(10, "");
                enemy.setSprite(this.sprites["test4"]);
                enemy.buildMesh();
                enemy.setGridPosition(3,5);
                this.addEntity(enemy);
                this.scene.add(enemy.mesh);
                enemy.animate("attack_ready", 200);

                // 캐릭터도 강제로 이동시킨다
                this.player.setGridPosition(12,5);
                this.player.setOrientation(Types.Orientations.LEFT);
                this.player.walk();

                const battle_asset = {
                    enemy: enemy,
                    click: this.click,
                };

                this.click = () => {
                    // 다른 함수로 대체
                    // 캐릭터 앞까지 이동을 하고 그 다음에 공격을 한다.
                    // 좌표는 일단 하드코딩을 한다
                    if (!enemy.isAttacking) {
                        const from = enemy.mesh.position.clone();
                        const to = this.player.mesh.position.clone();

                        // 타임아웃으로 컨트롤을 한다 
                        const attackerMovie = new MovieClip(
                            new MovieClip.Timeline(0, 40, enemy.mesh, [["x", from.x, to.x-16, "inOutSine"], ["z", from.z, to.z, "inOutSine"]]),
                            new MovieClip.Timeline(41, 100, enemy.mesh, [["x", to.x-16, to.x-16, "linear"], ["z", to.z, to.z, "linear"]]),
                            new MovieClip.Timeline(101, 130, enemy.mesh, [["x", to.x-16, from.x, "inOutSine"], ["z", to.z, from.z, "inOutSine"]]),
                        );

                        attackerMovie.playAndDestroy(() => {
                            enemy.isAttacking = false;
                        });

                        enemy.isAttacking = true;
                        battle_asset.movie = attackerMovie;
                        battle_asset.update = () => {
                            if (attackerMovie._playing) {
                                if (attackerMovie._frame > 100) {
                                    // 이동 모션을 튼다
                                    enemy.animate("attack_ready", 200);
                                    battle_asset.zoom_effect = false;
                                } else if (attackerMovie._frame > 70) {
                                    enemy.animate("attack", 100); 
                                } else if (attackerMovie._frame > 40) {
                                    battle_asset.zoom_effect = true;
                                }
                                
                            }
                        }
                        
                    }
                };

                this.battle_asset = battle_asset;
                


            } else {
                const canvas = document.getElementById("foreground");
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 배틀리소스를 제거한다
                if (this.battle_asset) {
                    const enemy = this.battle_asset.enemy;
                    this.removeEntity(enemy);
                    this.scene.remove(enemy.mesh);
                    this.click = this.battle_asset.click;
                    if (this.battle_asset.timeout) {
                        clearTimeout(this.battle_asset.timeout);
                    }

                    this.player.idle();

                    this.battle_asset = null;
                }
            }
        // } else if (key === 73) {
        //    // ui 를 화면에 그린다
        //    const uiimg = new Image();
        //    uiimg.src = "static/inventory.png";
        //    uiimg.onload = () => {
        //        const canvas = document.getElementById("foreground");
        //        const ctx = canvas.getContext('2d');
        //        ctx.drawImage(uiimg, 500, 50);
        //    };
        // } else {
        //     const canvas = document.getElementById("foreground");
        //     const ctx = canvas.getContext('2d');
        //     ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (key === 67) {
            // 카메라 토글
            this.isometric = !this.isometric;
            if (this.isometric) {
                
                const aspect = canvas.width / canvas.height;
                const frustumSize = 100;
                const camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
                camera.position.set( frustumSize, frustumSize, frustumSize );

                this.postprocessing.enabled = false;
                

                this.camera = camera;
            } else {
                const camera = new THREE.PerspectiveCamera( 20, canvas.width / canvas.height, 1, 3000 );
                this.camera = camera;
                this.postprocessing.enabled = true;
            }
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
