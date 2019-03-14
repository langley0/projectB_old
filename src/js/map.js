import $ from "jquery";
import * as _ from 'underscore';

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
            this._initMap(data);
            this._generateCollisionGrid();
            this.isLoaded = true;
        }, 'json');
    }

    _initMap(map) {
        this.width = map.width;
        this.height = map.height;
        this.data = map.data;
        this.tilesize = map.tilesize;
        this.collisions = map.collisions;
    }

    _generateCollisionGrid() {
        this.grid = [];
        for(let	i = 0; i < this.height; i++) {
            this.grid[i] = [];
            for(let j = 0; j < this.width; j++) {
                this.grid[i][j] = 0;
            }
        }

        _.each(this.collisions, function(tileIndex) {
            const pos = this.tileIndexToGridPosition(tileIndex+1);
            self.grid[pos.y][pos.x] = 1;
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
        // 타일은 0 번은 없는 것이기 때문에 1번부터 시작한다
        tileNum -= 1;
        const x = tileNum % this.width;
        const y = Math.floor(tileNum / this.width);

        return { x: x, y: y };
    }
}