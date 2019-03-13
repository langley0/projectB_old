const THREE = require('../lib/three').THREE;

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
            width : 11,
            height: 11,
            tileSize: 16,
        }

        const geometry = new THREE.PlaneBufferGeometry(map.width * map.tileSize, map.height * map.tileSize, map.width, map.height );
        const material = new THREE.MeshBasicMaterial( { color: 0x405040 } );
        const plane  = new THREE.Mesh( geometry, material );
        plane.rotation.order = 'YXZ';
        plane.rotation.x = -Math.PI/2;
        plane.receiveShadow = true;
        scene.add( plane  );
    }

    tick() {
        this.currentTime = new Date().getTime();

        // 렌더러 업데이트
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
        // 리소스 로딩이 끝나면 서버에 접속한다
        // 접속이 완료되면 핸들러들을 연결하고 게임을 시작한다
        this.player = new Player(1, username, "");
        this.start();   
    }

    loadResource() {
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

    isSpritesLoaded() {
        if (__.any()) {
            
        }
    }
}
