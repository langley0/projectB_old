import Character from "./character";

export default class Updater {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.updateCharacters();
        this.updateTransitions();
    }

    updateCharacters() {
        this.game.forEachEntity(function(entity) {
            const isCharacter = entity instanceof Character;
            if (isCharacter && entity.isLoaded) {
                this.updateCharacter(entity);
            }
        });
    }

    updateCharacter(c) {
        // 캐릭터의 위치를 

    }

    updateTransitions() {
        // 타일의 중앙으로 옮겨놓는다
        const offsetX = this.game.map.offset.x + this.game.map.tilesize / 2;
        const offsetY = 0;
        const offsetZ = this.game.map.offset.y + this.game.map.tilesize / 2;

        this.game.forEachEntity((entity) => {
            const m = entity.movement;
            if (m) {
                if (m.inProgress) {
                    m.step(this.game.currentTime)
                }
            }

            // 엔티티의 실제 위치를 2d (x, y) 에서 3d(x,y,z) 으로 변경한다
            if (entity.mesh) {
                entity.mesh.position.set(
                    offsetX + entity.x + entity.offset.x , 
                    offsetY + entity.offset.y, 
                    offsetZ + entity.y + entity.offset.z);
            }
        })
    }
}
