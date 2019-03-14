import Player from './player';
import Updater from './updater';
import Map from './map';
import Pathfinder from './pathfinder';
import OrbitControls  from 'three-orbitcontrols';



export default class Game {
    init(canvas) {
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 1000 );
        camera.position.set( 0, 100, 250 );

        const renderer = new THREE.WebGLRenderer({canvas: canvas});
        renderer.shadowMap.enabled = true;
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( canvas.width, canvas.height );

        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        //===========================
        // 테스트 코드이다.
        const map = {
            width : 10,
            height: 10,
            tileSize: 16,
        }

        const geometry = new THREE.PlaneBufferGeometry(map.width * map.tileSize, map.height * map.tileSize, map.width, map.height );
        const material = new THREE.MeshBasicMaterial( { color: 0x405040 } );
        const plane  = new THREE.Mesh( geometry, material );
        plane.rotation.order = 'YXZ';
        plane.rotation.x = -Math.PI/2;
        plane.receiveShadow = true;
        // 클릭 판정용 바운딩박스
        geometry.computeBoundingBox();
        // 월드용 오프셋을 기록한다
        

        scene.add( plane );

        this._terrain = plane;

        // TODO : mad에 따라서 라이트를 바꾸어야 한다
        // 헤미스피어를 붙인다
        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        // TODO : 카메라 시선을 플레이어에 맞추어야 한다
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        new OrbitControls(camera, renderer.domElement)
        


        // 게임 정보
        this.entities = {};
    }

    tick() {
        this.currentTime = new Date().getTime();

        // 로직 -> 렌더링 순서로 업데이트를 한다
        this.updater.update();
        this.renderer.render( this.scene, this.camera );
        
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
        this.updater = new Updater(this);

        const wait = setInterval(() => {
            if (this.map.isLoaded && this.isSpritesLoaded()) {
                clearInterval(wait);

                // 리소스 로딩이 끝나면 서버에 접속한다
                // 접속이 완료되면 핸들러들을 연결하고 게임을 시작한다
                // TODO : 서버 접속을 만들어야 한다

                this.pathfinder = new Pathfinder(this.map.width, this.map.height)

                const player = new Player(1, username, "");
                player.setSprite(this.sprites["clotharmor"]);
                player.onRequestPath((x, y) => {
                    const path = this.findPath(player, x, y);
                    return path;
                });

                // TODO : 스타팅포인트를 정해야한다
                player.setGridSize(this.map.tilesize);
                player.setGridPosition(5, 5);

                this.addEntity(player);
                this.player = player;


                // 월드에 추가를 한다
                // TODO : entity 를 일괄로 처리할 수 있는 장치가 필요하다?>
                this.scene.add(this.player.mesh);

                this.start();
            }
        }, 100);

    }

    loadSprites() {
        const spriteNames = ["clotharmor", "sword1"];
        const sprites = {};
        for (const spName of spriteNames) {
            const img = new Image();
            img.src = `static/${spName}.png`;
            img.onload = function() {
                img.isLoaded = true;
            }

            sprites[spName] = img;
        }

        this.sprites = sprites;

    }

    loadMap() {
        this.map = new Map();
        this.map.offset = {
            x: this._terrain.geometry.boundingBox.min.x,
            y: this._terrain.geometry.boundingBox.min.y
        };
    }

    isSpritesLoaded() {
        if (_.any(this.sprites, function(sprite) { return !sprite.isLoaded; } )) {
            return false;
        }
        return true;
    }

    addEntity(entity) {
        if(this.entities[entity.id] === undefined) {
            this.entities[entity.id] = entity;
        }
    }

    getGridPosition(intersect, boundingbox) {
        const ts = this.map.tilesize;
        const xIndex = Math.floor((intersect.x - boundingbox.min.x) / ts );
        const yIndex = Math.floor((intersect.z - boundingbox.min.y) / ts );
        
        return { x: xIndex, y: yIndex };
    }

    click(x, y) {
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
            const pos = this.getGridPosition(inter.point, this._terrain.geometry.boundingBox);
            // 해당 위치로 플레이어를 이동시킨다
            this.player.go(pos.x, pos.y);
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
