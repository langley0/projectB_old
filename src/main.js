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

  // 플레이 버튼을 누르면 시작하게 해야 하지만... 일단은 그냥하자
  app.start("TEST");
}

initApp();