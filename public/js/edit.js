var gameID = decodeURIComponent(location.search.split('id=')[1]);

GameAPI.getGame(gameID, function(game){
  if(!game.canModify){
    location.href = 'game-info.html?id=' + encodeURIComponent(gameID);
    return;
  }
  document.getElementById('title').innerHTML = 'Editing: ' + game.name;
  document.getElementById('loading').classList.add('hidden');

  document.getElementById('edit-title').value = game.name;

  document.getElementById('edit-labels').innerHTML = game.labels.map(function(label){
    return `
      <input type="text" value="${label}" class="game-label">
    `;
  }).join('');

  document.getElementById('submit').addEventListener('click', function(){
    var name = document.getElementById('edit-title').value;
    var labels = [];
    var labelElts = document.getElementsByClassName('game-label')
    for(var i = 0; i < labelElts.length; i++){
      labels.push(labelElts[i].value);
    };

    var g = {
      id: gameID,
      name: name,
      labels: labels
    };

    GameAPI.updateGame(g, function(){
      NotificationManager.create(g.name, "Successfully updated.");
      setTimeout(function(){
        location.href = 'game-info.html?id=' + encodeURIComponent(gameID);
      }, 1500);
    });

  });

  document.getElementById('cancel').addEventListener('click', function(){
    location.href = 'game-info.html?id=' + encodeURIComponent(gameID);
  });

});
