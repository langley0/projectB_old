import Phase from "./phase";
import { timingSafeEqual } from "crypto";

class GameSprite {
    constructor(image) {
        this.image = image;
        this.x = 0;
        this.y = 0;
        this.attackRange = 32;
        this.moveSpeed = 1;
        this.offset = { x: 0, y: 0};
        this.target = null;

        this.flipX = false;
        
        this.anims = {
            "idle" : {
                animRow:2,
                animFrameCount:2,
            },
            "walk" : {
                animRow:1,
                animFrameCount:4,
            },
            "attack": {
                animRow: 0,
                animFrameCount:5,
            }
        }
        this.currentFrame = 0;
        this.currentFrameMax = 2;
        this.currentRow = 2;
        this.state = "idle";

        this.utime = Date.now() + 200;
        this.tilesize = 32;

        this.health = 100;
        this.Maxhealth = 100;
    }

    setAnim(name) {
        if (this.state !== name) {
            this.state = name;
            this.currentFrame = 0;
            this.currentRow = this.anims[name].animRow;
            this.currentFrameMax = this.anims[name].animFrameCount;
        }
    }

    render(ctx) {

        ctx.save();
        ctx.translate(this.x + this.offset.x, this.y + this.offset.y);
        if (this.flipX) {
            ctx.translate(this.tilesize, 0);
            ctx.scale(-1, 1);
        } 
        ctx.drawImage(this.image, this.currentFrame * this.tilesize, this.currentRow * this.tilesize, this.tilesize, this.tilesize, 0, 0, this.tilesize, this.tilesize);

        // 헬스바를 그린다
        // 길이는 32 전체 체력분의 비율을 표시한다
        const healthbarSize = this.tilesize;
        ctx.fillStyle = "#000";
        ctx.fillRect(-1, -4, healthbarSize + 2, 4);
        ctx.fillStyle = "#F00";
        ctx.fillRect(0, -3, (healthbarSize * this.health / this.Maxhealth), 2);

        ctx.restore();
    }



    update()  {
        let hit = false;
        if (this.utime <= Date.now()) {
            this.utime += 200;
            this.currentFrame = (this.currentFrame + 1) % this.currentFrameMax;

            if (this.currentFrame == 3 && this.state === "attack") {
                hit = true;
            }
        }

        if (this.target) {

            const dist = this.target.x - this.x;
            if(Math.abs(dist) > this.attackRange) {
                if (dist > 0) {
                    this.x += this.moveSpeed;
                } else {
                    this.x -= this.moveSpeed;
                }

                this.setAnim("walk");

            } else {
                this.setAnim("attack");

                if (hit) {
                    this.animFrameCount
                    this.target.health = Math.max(0, this.target.health - 10);
                }
            }
        }
    }
}

export default class Battle extends Phase {
    constructor(game) {
        super();
        const canvas = document.getElementById("foreground");
        const context = canvas.getContext('2d');

        // 플레이어와 적을 2D Sprite 로 가져온다.
        const player = new GameSprite(game.sprites["clotharmor"]);
        const enemy = new GameSprite(game.sprites["deathknight"]);

        player.x = 200;
        player.y = 200
        player.offset.y = 5;
        player.target = enemy;

        enemy.x = 600;
        enemy.y = 200;
        enemy.tilesize = 42;
        enemy.target = player;
        enemy.flipX = true;

        this.onUpdate(() => {
            player.update();
            enemy.update();

            const boarder = 3;
            context.fillStyle = "#ffffff";
            context.fillRect(150 - boarder, 120 - boarder, 500 + boarder*2, 200 + boarder*2);

            // 여기서 2D 를 렌더링을 한다
            context.fillStyle = "#606060";
            context.fillRect(150, 120, 500, 200);
            context.fillStyle = "#101010";
            context.fillRect(150, 232, 500, 87);
            player.render(context);
            enemy.render(context);

            
            if (enemy.health === 0) {
                // 승리
                player.target = null;
                player.setAnim("idle");
                context.font = "50px Arial";
                context.fillStyle = "white";
                context.textAlign  = "center";
                context.fillText("Victory", 400, 160);
            }
        });
    }
}