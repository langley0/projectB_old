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
  return app;
}

initApp();