import Character from "./character";
import Types from '../share/gametypes';

export default class Updater {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.updateEntities();
        this.updateTransitions();
        this.updatePhase();
    }

    updateEntities() {
        this.game.forEachEntity((entity) => {
            const isCharacter = entity instanceof Character;
            if (isCharacter) {
                this.updateCharacter(entity);
                this.updateAnimation(entity);
            }
            this.updateEntityFading(entity);
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

    updateAnimation(entity) {
        const anim = entity.currentAnimation;
                
        if(anim) {
            if (anim.update(this.game.currentTime)) {
                // 매터리얼을 변경한다
                if (anim.currentFrame) {
                    if ((entity.flipSpriteX && entity.texture.repeat.x > 0) || 
                        (!entity.flipSpriteX && entity.texture.repeat.x < 0)) {
                        entity.texture.repeat.x = -entity.texture.repeat.x;
                    }

                    if (entity.texture.repeat.x > 0) {
                        entity.texture.offset.set(
                            anim.currentFrame.x / entity.sprite.width, 
                            (entity.sprite.height - anim.currentFrame.y - anim.height)/ entity.sprite.height);
                            //anim.currentFrame.y / entity.sprite.height);
                            
                    } else {
                        entity.texture.offset.set(
                            -(entity.sprite.width - anim.currentFrame.x - anim.width) / entity.sprite.width, 
                            (entity.sprite.height - anim.currentFrame.y - anim.height)/ entity.sprite.height);
                            //anim.currentFrame.y / entity.sprite.height);
                    }
                }
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

            // 쉐터 박스를 테스트 한다
            if (entity.shatters) {
                for (const block of entity.shatters) {
                    if (!block._pos_init) {
                        block.position.x += entity.mesh.position.x;
                        block.position.z += entity.mesh.position.z;
                        block._pos_init = true;

                        block.shatterTick = Math.random() * 100;
                    }
               
                    const d = 1;
                    --block.shatterTick;
                    if (block.shatterTick < 0) {

                        if (Math.abs(entity.mesh.position.x - block.position.x) < d) { block.position.x = entity.mesh.position.x; }
                        else { block.position.x += d/(entity.mesh.position.x - block.position.x); }

                        if (Math.abs(entity.mesh.position.y - block.position.y) < d*3) { block.position.y = entity.mesh.position.y; }
                        else { block.position.y += d*3/(entity.mesh.position.y - block.position.y); }

                        if (Math.abs(entity.mesh.position.z - block.position.z) < d) { block.position.z = entity.mesh.position.z; }
                        else { block.position.z += d/(entity.mesh.position.z - block.position.z); }
                    }

                }
            }
        })

        if (this.game.mesh__) {
            this.game.mesh__.position.copy(this.game.player.mesh.position);
            this.game.mesh__.position.y = 11;
        }
    }

    updateEntityFading(entity) {
        if(entity && entity.isFading) {
            const duration = 1000;
            const t = this.game.currentTime;
            const dt = t - entity.startFadingTime;
        
            if(dt > duration) {
                entity.isFading = false;
                if (entity.mesh) {
                    entity.spriteMesh.material.opacity = 1;
                }

            } else {
                if (entity.mesh) {
                    entity.spriteMesh.material.opacity = dt / duration;
                }
            }
        }
    }

    updatePhase() {
        if (this.game.nextPhase) {
            if (this.game.phase) {
                // 끝내고 다시 시작한다
                this.game.phase.end();
                this.game.phase = null;
            } else {
                this.game.phase = this.game.nextPhase;
                this.game.nextPhase = null;

                this.game.phase.begin();
            }
        }
        
        if (this.game.phase) {
            this.game.phase.update();
        }
    }
}
