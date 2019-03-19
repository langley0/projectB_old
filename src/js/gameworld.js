export default class GameWorld {
    constructor(game, map) {
        this.game = game;
        this.map = map;

        const geometry = new THREE.PlaneBufferGeometry(map.width * map.tilesize, map.height * map.tilesize, map.width, map.height );
        const material = new THREE.MeshStandardMaterial( { color: 0x405040, roughness: 0.75 } );
        const plane  = new THREE.Mesh( geometry, material );
        plane.rotation.order = 'YXZ';
        plane.rotation.x = -Math.PI/2;
        plane.receiveShadow = true;
        geometry.computeBoundingBox();

        game.map.offset = {
            x: geometry.boundingBox.min.x,
            y: geometry.boundingBox.min.y
        };

        this.terrain = plane;
    }
}