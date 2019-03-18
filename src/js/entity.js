export default class Entity {
    constructor(id, kind) {
        this.id = id;
        this.kind = kind;
        this.isLoaded = false;
    }

    static setGridSize(size) {
        Entity.gridSize = size;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setGridPosition(x, y) {
        this.gridX = x;
        this.gridY = y;
    
        this.setPosition(x * Entity.gridSize, y * Entity.gridSize);
    }

    fadeIn(currentTime) {
        this.isFading = true;
        this.startFadingTime = currentTime;
    }
}