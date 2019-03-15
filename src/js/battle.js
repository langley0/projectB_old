import Phase from "./phase";

export default class Battle extends Phase {
    constructor(game) {
        super();
        
        this.game = game;

        this.onBegin(() => {
            console.log("배틀을 시작합니다");
        });
    }
}