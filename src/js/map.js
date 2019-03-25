import GLTFLoader from './gltfloader';

const isInt = function(n) {
    return (n % 1) === 0;
};

export default class Map {
    constructor(game) {
        this.loadMap();
    }

    loadMap() {
        const filepath = "static/maps.json";
        $.get(filepath, (data) => {
            this._rawData = data;

            this.tilesheet = new Image();
            this.tilesheet.src = "static/tilesheet.png";
            this.tilesheet.onload = () => {
                this.isLoaded = true;
            };
        }, 'json');
    }
    
    initByName(mapName) {
        if (mapName in this._rawData) {
            const mapData = this._rawData[mapName];
            this._initMap(mapData);
            this._generateCollisionGrid();
            this._buildMesh();
        }
    }

    _initMap(map) {
        this.width = map.width;
        this.height = map.height;
        this.data = map.data;
        this.tilesize = map.tilesize;
        this.collisions = map.collisions;
        this.props = map.props;
        
        this.portals = {};
        for (const portal of map.portals) {
            this.portals[portal.x + portal.y * this.width] = portal;
        }
    }

    _generateCollisionGrid() {
        this.grid = [];
        for(let	i = 0; i < this.height; i++) {
            this.grid[i] = [];
            for(let j = 0; j < this.width; j++) {
                this.grid[i][j] = 0;
            }
        }

        _.each(this.collisions, (tileIndex) => {
            const pos = this.tileIndexToGridPosition(tileIndex);
            this.grid[pos.y][pos.x] = 1;
        });
    }

    isColliding(x, y) { 
        if(this.isOutOfBounds(x, y) || !this.grid) {
            return false;
        }
        return (this.grid[y][x] === 1);
    }

    isOutOfBounds(x, y) {
        return isInt(x) && isInt(y) && (x < 0 || x >= this.width || y < 0 || y >= this.height);
    }

    tileIndexToGridPosition(tileNum) {
        const x = tileNum % this.width;
        const y = Math.floor(tileNum / this.width);
        return { x: x, y: y };
    }

    GridPositionToTileIndex(x, y) {
        return (y * this.width) + x;;
    }

    isPortal(x, y) {
        const index = this.GridPositionToTileIndex(x, y);
        console.log(x, y, index, this.portals);
        return (index in this.portals);
    }

    getPortalDestination(x, y) {
        const index = this.GridPositionToTileIndex(x, y)    ;
        return this.portals[index].target;
    }



    _buildMesh() {
        // 타일맵을 만들어서 붙이도록 하자.
        const geometry = new THREE.PlaneGeometry(this.width * this.tilesize, this.height * this.tilesize, this.width, this.height );
        // uv 를 수정한다
        const tilesize = this.tilesize;
        const imageWidth = this.tilesheet.width;
        const imageHeight = this.tilesheet.height;;
        
        const w = tilesize /imageWidth;
        const h = -tilesize /imageHeight;
        const tileXCnt = imageWidth / tilesize;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = y * this.width + x;

                const tileIndex = this.data[y][x];
                
                const tileX = tileIndex % tileXCnt;
                const tileY = Math.floor(tileIndex/tileXCnt);

                const u = (tileX * tilesize) / imageWidth;
                const v = 1 - (tileY * tilesize) / imageHeight;
                
                geometry.faceVertexUvs[0][index* 2][0] = new THREE.Vector2(u, v);
                geometry.faceVertexUvs[0][index* 2][1] = new THREE.Vector2(u, v+h);
                geometry.faceVertexUvs[0][index* 2][2] = new THREE.Vector2(u+w, v);
                
                geometry.faceVertexUvs[0][index* 2 + 1][0] = new THREE.Vector2(u, v+h);
                geometry.faceVertexUvs[0][index* 2 + 1][1] = new THREE.Vector2(u+w, v+h);
                geometry.faceVertexUvs[0][index* 2 + 1][2] = new THREE.Vector2(u+w, v);
            }
        }

        const tex = new THREE.Texture();
        tex.image = this.tilesheet;
        tex.format = THREE.RGBAFormat;
        tex.needsUpdate  = true;
        
        const material = new THREE.MeshStandardMaterial( { transparent: true, map: tex } );
        material.roughness = 0.9;
        material.metalness = 0;
        
        const plane  = new THREE.Mesh( geometry, material );
        plane.receiveShadow = true;
        plane.rotation.order = 'YXZ';
        plane.rotation.x = -Math.PI/2;
        plane.position.y = 1;
        geometry.computeBoundingBox();

        this.offset = {
            x: geometry.boundingBox.min.x,
            y: geometry.boundingBox.min.y
        };
        this.mesh = plane;
    }
}