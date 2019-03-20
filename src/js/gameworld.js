export default class GameWorld {
    constructor(game, map) {
        this.game = game;
        this.map = map;

        const geometry = new THREE.PlaneBufferGeometry(map.width * map.tilesize, map.height * map.tilesize, map.width, map.height );
        const material = new THREE.MeshStandardMaterial( { transparent: true, opacity: 0 } );
        const plane  = new THREE.Mesh( geometry, material );
        plane.rotation.order = 'YXZ';
        plane.rotation.x = -Math.PI/2;
        plane.position.y = 1;
        geometry.computeBoundingBox();

        game.map.offset = {
            x: geometry.boundingBox.min.x,
            y: geometry.boundingBox.min.y
        };
        this.terrain = plane;

        if (map.model) {
            const model = map.model.scene.children[0];
            model.receiveShadow = true;
            //model.position.x = 50;
            model.rotation.y = -Math.PI /2;
            model.scale.set(5, 5, 5);

            this.model = model;
        }
    }
}