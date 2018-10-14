var labelCount = 3;

document.getElementById('cancel').addEventListener('click', function(){
  location.href = 'index.html';
});

document.getElementById('submit').addEventListener('click', function(){
  // TODO: make sure all fields are filled out
  var name = document.getElementById('game-name').value;

  var labels = [];
  var labelElts = document.getElementsByClassName('game-label');
  for(var i = 0; i < labelElts.length; i++){
    var lbl = labelElts[i].value;
    if (lbl){
      labels.push(lbl);
    }
  };

  if (!name) {
    alert("MUST FILL OUT NAME");
    return;
  }

  if (labels.length < 2) {
    alert("YOU MUST HAVE AT LEAST TWO LABELS");
    return;
  }

  var g = {
    name: name,
    labels: labels
  };

  GameAPI.createGame(g, function(game){
    NotificationManager.create(g.name, "Successfully created.");
    setTimeout(function(){
      location.href = 'train.html?id=' + encodeURIComponent(game.id);
    }, 1500);
  });

});

document.getElementById('add-label').addEventListener('click', function(){
  var div = document.createElement('div');
  div.classList.add('deletable-label');
  div.id = "label-" + labelCount;
  div.innerHTML = `
  <input type="text" class="game-label" placeholder="Label ${labelCount}">
  <a href="#" class="label-delete" onclick="deleteLabel('label-${labelCount}')">X</a>
  `;
  document.getElementById('game-labels').appendChild(div);
  labelCount++;
});

function deleteLabel(label){
  var elt = document.getElementById(label);
  elt.parentNode.removeChild(elt);
}
