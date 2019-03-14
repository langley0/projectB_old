import App from './js/app';
import Game from './js/game';

function initApp() {
  const app = new App();
  const game = new Game();

  var canvas = document.getElementById("canvas");
  canvas.width = 800;
  canvas.height = 400;

  game.init(canvas);
  app.setGame(game);

  // 게임을 시작한다
  $('#canvas').click(function (event) {
    // 마우스 상태정보를 업데이트한다
    // TODO : 일괄 코드로 변경필요
    var gamePos = $('#canvas').offset();

    const mouse = {};
    mouse.x = event.pageX - gamePos.left;
    mouse.y = event.pageY - gamePos.top;
          
    game.click(mouse.x, mouse.y);
  });


  // 플레이 버튼을 누르면 시작하게 해야 하지만... 일단은 그냥하자
  app.start("TEST");
}

initApp();