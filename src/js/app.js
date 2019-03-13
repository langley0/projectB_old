// ux 와 게임 화면 구성을 여기서 연결한다
export default class App {
    setGame(game) {
        this.game = game;
    }

    center() {
        window.scrollTo(0, 1);
    }

    start(username) {
        // set option 
        this.center();
        this.game.run();
    }
}