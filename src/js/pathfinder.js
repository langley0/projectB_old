import AStar from '../lib/astar';

export default class Pathfinder {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = null;
        this.ignored = [];

        this.initBlankGrid();
    }

    initBlankGrid() {
        this.blankGrid = [];
        for(let i=0; i < this.height; i += 1) {
            this.blankGrid[i] = [];
            for(let j=0; j < this.width; j += 1) {
                this.blankGrid[i][j] = 0;
            }
        }
    }

    findPath(grid, entity, x, y, findIncomplete) {
        const start = [entity.gridX, entity.gridY];
        const end = [x, y];

        this.grid = grid;
        let path = AStar(this.grid, start, end);
    
        if(path.length === 0 && findIncomplete === true) {
            // If no path was found, try and find an incomplete one
            // to at least get closer to destination.
            path = this.findIncompletePath_(start, end);
        }
    
        return path;
    }

    /**
     * Finds a path which leads the closest possible to an unreachable x, y position.
     *
     * Whenever A* returns an empty path, it means that the destination tile is unreachable.
     * We would like the entities to move the closest possible to it though, instead of
     * staying where they are without moving at all. That's why we have this function which
     * returns an incomplete path to the chosen destination.
     *
     * @private
     * @returns {Array} The incomplete path towards the end position
     */
    findIncompletePath_(start, end) {
        let perfect, x, y,
            incomplete = [];

        perfect = AStar(this.blankGrid, start, end);
    
        for(let i=perfect.length-1; i > 0; i -= 1) {
            x = perfect[i][0];
            y = perfect[i][1];
        
            if(this.grid[y][x] === 0) {
                incomplete = AStar(this.grid, start, [x, y]);
                break;
            }
        }
        return incomplete;
    }

    /**
     * Removes colliding tiles corresponding to the given entity's position in the pathing grid.
     */
    ignoreEntity(entity) {
        if(entity) {
            this.ignored.push(entity);
        }
    }

    clearIgnoreList() {
        this.applyIgnoreList_(false);
        this.ignored = [];
    }
}