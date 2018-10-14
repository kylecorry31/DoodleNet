handleLoadingScreen();

document.getElementById('tutorial').addEventListener('click', function(){
  localStorage.removeItem('doneTutorial');
  handleLoadingScreen();
});

GameAPI.getGames(function(games){

  document.getElementById('games').innerHTML = games.map(function(game){
    return `
      <div class="game game-btn" onclick="selectGame('${game.id}')">
        <h2>${game.name} ${!game.canModify ? '(demo game)':''}</h2>
      </div>
    `;
  }).join('');

  document.getElementById('create-game').addEventListener('click', function(){
    if(games.length < 20){
      location.href = "create.html";
    } else {
      NotificationManager.create("Can't create", "Too many games, please delete one.");
    }
  })

});

function selectGame(gameID){
  location.href = "game-info.html?id=" + encodeURIComponent(gameID);
}

function timedMessageDisplay(messages){
  if(messages.length == 0){
    document.getElementById('loading').classList.add('hidden');
    return;
  }

  document.getElementById('loading').classList.remove('hidden');

  var first = messages[0];

  messages.splice(0, 1);

  document.getElementById('loading').innerHTML = `<h1>${first.message}</h1>`

  setTimeout(function(){
    timedMessageDisplay(messages);
  }, first.time);

}

function handleLoadingScreen(){
  if(localStorage.getItem("doneTutorial")){
    document.getElementById('loading').classList.add('hidden');
  } else {
    localStorage.setItem("doneTutorial", true);
    var messages = [
      {
        message: 'Welcome to DoodleNet.',
        time: 2000
      }, {
        message: "Your webcam may be used to play the game.",
        time: 3000
      }, {
        message: "No data is stored from the webcam.",
        time: 3000,
      }, {
        message: "If using the webcam, select an object which stands out in color from everything else.",
        time: 4000
      }, {
        message: "If it isn\'t guessing well (or isn\'t very confident), it may need to be trained.",
        time: 3000
      }
    ];

    timedMessageDisplay(messages);

  }
}
