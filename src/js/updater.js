import Character from "./character";
import Types from '../share/gametypes';

export default class Updater {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.updateCharacters();
        this.updateTransitions();
    }

    updateCharacters() {
        this.game.forEachEntity((entity) => {
            const isCharacter = entity instanceof Character;
            if (isCharacter && entity.isLoaded) {
                this.updateCharacter(entity);
            }
        });
    }

    updateCharacter(c) {
        // 캐릭터의 이동 위치를 업데이트한다
        const fps = 60;
        const tick = Math.round(16 / Math.round((c.moveSpeed / (1000 / fps))));
    
        if(c.isMoving() && c.movement.inProgress === false) {
            if(c.orientation === Types.Orientations.LEFT) {
                c.movement.start(this.game.currentTime,
                                function(x) {
                                    c.x = x;
                                    c.hasMoved();
                                },
                                function() {
                                    c.x = c.movement.endValue;
                                    c.hasMoved();
                                    c.nextStep();
                                },
                                c.x - tick,
                                c.x - 16,
                                c.moveSpeed);
            }
            else if(c.orientation === Types.Orientations.RIGHT) {
                c.movement.start(this.game.currentTime,
                                function(x) {
                                    c.x = x;
                                    c.hasMoved();
                                },
                                function() {
                                    c.x = c.movement.endValue;
                                    c.hasMoved();
                                    c.nextStep();
                                },
                                c.x + tick,
                                c.x + 16,
                                c.moveSpeed);
            }
            else if(c.orientation === Types.Orientations.UP) {
                c.movement.start(this.game.currentTime,
                                function(y) {
                                    c.y = y;
                                    c.hasMoved();
                                },
                                function() {
                                    c.y = c.movement.endValue;
                                    c.hasMoved();
                                    c.nextStep();
                                },
                                c.y - tick,
                                c.y - 16,
                                c.moveSpeed);
            }
            else if(c.orientation === Types.Orientations.DOWN) {
                c.movement.start(this.game.currentTime,
                                function(y) {
                                    c.y = y;
                                    c.hasMoved();
                                },
                                function() {
                                    c.y = c.movement.endValue;
                                    c.hasMoved();
                                    c.nextStep();
                                },
                                c.y + tick,
                                c.y + 16,
                                c.moveSpeed);
            }
        }
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
