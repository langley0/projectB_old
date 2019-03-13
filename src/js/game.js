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
        // game 밖으로 업데이트 코드를 분리한다
        const self = this;
        const animate = function () {
            requestAnimationFrame( animate );
            self.render();
        };
        animate();

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

    render() {
        this.renderer.render( this.scene, this.camera );

    }
}
