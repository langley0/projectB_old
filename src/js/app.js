// ux 와 게임 화면 구성을 여기서 연결한다
import Types from '../share/gametypes';

export default class App {
    /*
        ux 기본값 설정
        
        게임모드 : normal / battle

        스테이지정보 : currentStage
        
        버튼.
    */
    init() {
        this.currentStage = 1;
        this.playMode = Types.GameState.NORMAL;
    }

    setUI(playMode) {
        // navi - 영역 버튼 교체
    }

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