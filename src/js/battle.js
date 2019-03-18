import Phase from "./phase";
import EntityFactory from "./entityfactory";
import Types from "../share/gametypes";
import ThreeUI from '../lib/three-ui/ThreeUI';
import MovieClip from "./movieclip";

export default class Battle extends Phase {
    
    constructor(game) {
        super();
        
        this.teams = [null, null]; // 서로 싸우는 두개의 팀을 둔다.
        this.playerSide = null; 
        this.playerTeam = null;
        
        this.turn = 0;
        this.state = Types.BattleState.BEGIN;
        

        this.onBegin(() => {
            console.log("배틀을 시작합니다");
            // 적을 등장시킨다
            const enemy = EntityFactory.createEntity(Types.Entities.DEATHKNIGHT, 11);
            enemy.setSprite(game.sprites["deathknight"]);
            enemy.setGridPosition(8, 3);
            game.addEntity(enemy);
            // game.scene.add(enemy.mesh);

            for (const block of enemy.shatters) {
                game.scene.add(block);
            }

            enemy.mesh.material.transparent = true;
            enemy.mesh.material.opacity = 0;
            enemy.fadeIn(game.currentTime);


            this.playerSide = 0;
            this.teams[0] = game.player; 
            this.teams[1] = enemy;
            this.playerTeam = this.teams[this.playerSide];


            // ui 빌드. 자동화를 어떻게 하지?
            const ui = game.ui;
            const rectangle = ui.createRectangle('#FF6D92', 400, 250, 100, 50);
            rectangle.anchor.x = ThreeUI.anchors.left;
            rectangle.anchor.y = ThreeUI.anchors.top;
            const text = ui.createText('Attack', 20, 'Arial', 'white');
            text.textAlign = 'center';
            text.textBaseline = 'middle';
            text.anchor.x = ThreeUI.anchors.center;
            text.anchor.y = ThreeUI.anchors.center;
            text.parent = rectangle;

            rectangle.onClick(() => {
                // 플레이어가 상대를 공격한다
                this.attack(game.player, enemy);
            });

            rectangle.visible = false;
            this.controlUI = rectangle;
        });


        this.onUpdate(() => {
            if (this.state === Types.BattleState.BEGIN) {
                // 턴의 시작
                this.turn ++;
                
                //플레이어 턴이라면 ux 를 설정한다
                if (this.isPlayerTurn()) {
                    this.showPlayerUI();
                }
                this.state = Types.BattleState.MAIN;

            } else if(this.state === Types.BattleState.MAIN) {
                for(const team of this.teams) {
                    if (team.isDead) {
                        //
                    }
                }

            } else if(this.state === Types.BattleState.END) {
                if (this.isPlayerTurn()) {
                    this.hidePlayerUI();
                }
            }

            // 턴 메인 
            if (this.attackerMovie) {
                this.attackerMovie.update();
            }
            
            if (this.deadMovie) {
                this.deadMovie.update();
            }
            
            
        });
    }

    showPlayerUI() {
        this.controlUI.visible = true;
    }

    hidePlayerUI() {
        this.controlUI.visible = false;
    }


    isPlayerTurn() {
        return ((this.turn + 1) % 2 === this.playerSide);
    }

    attack(attacker, target) {
       const from = attacker.mesh.position;
        const to = target.mesh.position;
        // 공격애니메이션을 튼다
        this.attackerMovie = new MovieClip(
            new MovieClip.Timeline(0, 30, attacker.mesh, [["x", from.x, (to.x + from.x)/2, "linear"], ["y", from.y, from.y + 10, "outCubic"]]),
            new MovieClip.Timeline(31, 60, attacker.mesh, [["x", (to.x + from.x)/2, to.x, "linear"], ["y", from.y + 10, from.y, "inCubic"]]),
            new MovieClip.Timeline(61, 70, attacker.mesh, [["x", to.x, to.x, "linear"], ["y", from.y, from.y, "linear"]]),
            new MovieClip.Timeline(71, 100, attacker.mesh, [["x", to.x, (to.x + from.x)/2, "linear"], ["y", from.y, from.y + 10, "outCubic"]]),
            new MovieClip.Timeline(101, 130, attacker.mesh, [["x", (to.x + from.x)/2, from.x, "linear"], ["y", from.y + 10, from.y, "inCubic"]]),
        );

        this.attackerMovie.playAndDestroy(() => {
            // 여기서 상대를 제거한다.
            this.attackerMovie = null;

            this.deadMovie = new MovieClip(
                new MovieClip.Timeline(0, 30, target.mesh, [["alpha", 1, 0, "linear"]])
            );

            this.deadMovie.playAndDestroy(() => {
                //game.removeEntity(target);
                //game.scene.remove(target.mesh);
                this.deadMovie = null;
                this.state = Types.BattleState.END
            });
        })
    }
}