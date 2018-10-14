var gameID = decodeURIComponent(location.search.split('id=')[1]);

document.getElementById('edit-game').addEventListener('click', function(){
  location.href = "edit.html?id=" + encodeURIComponent(gameID);
});

document.getElementById('train-game').addEventListener('click', function(){
  location.href = "train.html?id=" + encodeURIComponent(gameID);
});

document.getElementById('play-game').addEventListener('click', function(){
  location.href = "play.html?id=" + encodeURIComponent(gameID);
});

document.getElementById('delete-game').addEventListener('click', function(){
  GameAPI.deleteGame(gameID, function(){
    location.href = "index.html";
  })
});

GameAPI.getGame(gameID, function(game){
  document.getElementById('title').innerHTML = 'Game: ' + game.name;
  document.getElementById('loading').classList.add('hidden');
  if(!game.canModify){
    document.getElementById('delete-game').classList.add('hidden');
    document.getElementById('train-game').classList.add('hidden');
    document.getElementById('edit-game').classList.add('hidden');
    document.getElementById('title').innerHTML += ' (demo game)'
  }
});
