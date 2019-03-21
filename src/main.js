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

  // index.html 내 ui 테스트용 코드입니다. - 해림
  $('#menu-modal').click(function (){
    var modal = document.getElementById('modalContainer');
    modal.style.display = 'block';
    var closeBtn = document.getElementById('button-goBack');
    var inventoryBtn = document.getElementById('button-inventory');

    closeBtn.addEventListener('click', function(event){
      modal.style.display = "none";
    });

    inventoryBtn.addEventListener('click', function() {
      modal.style.display = "none";
      var inventory = document.getElementById('inventory');
      inventory.style.display="block";

      inventory.addEventListener('click', function(event){
        inventory.style.display = "none";
      });
    });
  });

  // $('#game-start').click(function (){
  //   var intro = document.getElementById('intro');
  //   intro.style.display = 'none';
  //   app.start("TEST");
  // });

  // 플레이 버튼을 누르면 시작하게 해야 하지만... 일단은 그냥하자
  app.start("TEST");

  var navi = document.getElementById('navi');
  navi.style.opacity = 1;
  var stage = document.getElementById('stageInfo');
  stage.style.display = 'block';
}

initApp();