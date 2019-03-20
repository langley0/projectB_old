import App from './js/app';
import Game from './js/game';

function initApp() {
  const app = new App();
  const game = new Game();

  const canvas = document.getElementById("canvas");

  game.init(canvas);
  app.setGame(game);

  // 게임을 시작한다
  $('#foreground').click(function (event) {
    // 마우스 상태정보를 업데이트한다
    // TODO : 일괄 코드로 변경필요
    var gamePos = $('#canvas').offset();

    const mouse = {};
    mouse.x = event.pageX - gamePos.left;
    mouse.y = event.pageY - gamePos.top;
          
    game.click(mouse.x, mouse.y);
  });

  window.addEventListener('keydown', (e) => {
    game.keyDown(e.keyCode);
  },false);

  // 플레이 버튼을 누르면 시작하게 해야 하지만... 일단은 그냥하자
  app.start("TEST");
}

initApp();