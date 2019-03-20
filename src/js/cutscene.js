import Phase from "./phase";
import Battle from "./battle2";

export default class Cutscene extends Phase {
    constructor(game, kind) {
        super();

        this.game = game;
        this.kind = kind;

        this.onBegin(() => {
            if (kind === "enter") {
                // 플레이어를 위치에 옮기고 페이드인을 시도한다
                game.player.mesh.visible = false;
                this.skipFrame = 60;
            }
        });

        this.onUpdate(() => {
            if (kind === "enter") {
                if (this.skipFrame > 0) {
                    --this.skipFrame;
                } else {
                    if (game.player.mesh.visible) {
                        if (!game.player.isFading) {
                            // 여기서 다음 페이즈로 넘어간다
                            ///game.nextPhase = new Battle(game);
                        }
                    } else {
                        game.player.mesh.visible = true;
                        game.player.spriteMesh.material.opacity = 0;
                        game.player.fadeIn(game.currentTime);
                    }
                }
            }
            
        });
    }

}