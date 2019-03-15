import Entity from './entity';

export default class Prop extends Entity {
    constructor(id, kind) {
        super(id, kind);
        
        this.load();
    }

    load() {
        // 공통적으로 box 메쉬를 만들어서 사용한다. 일단은 메쉬가 따로 없으므로 ...
        // TODO :load() 데이터를 외부의 데이터를 읽도록 해야한다
        const geometry = new THREE.BoxBufferGeometry( 8, 8, 8 );
        const material	= new THREE.MeshLambertMaterial({ color: 0xffffff });
        const mesh	= new THREE.Mesh( geometry, material );

        geometry.computeBoundingBox();

        this.mesh = mesh;
        this.offset = {
            x: 0,
            y: -geometry.boundingBox.min.y,
            z: 0,
        }

        this.isLoaded = true;
    }

    attachPointLight(color, intensity, radius) {
        var light = new THREE.PointLight(color, intensity, radius);
        light.position.set(0, 10, 0);
        light.castShadow = true;
        this.mesh.add( light );
    }
}