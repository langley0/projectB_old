export default class Entity {
    constructor(id, kind) {
        this.id = id;
        this.kind = kind;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setGridPosition(x, y, gridSize) {
        this.gridX = x;
        this.gridY = y;
    
        this.setPosition(x * gridSize, y * gridSize);
    }
}