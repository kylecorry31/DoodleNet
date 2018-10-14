var gameID = decodeURIComponent(location.search.split('id=')[1]);
var gameObj;
var training = [];
var currentLabel;
var nn;
var mobilenet;
var lastLoss;

function Game(){
  this.canvas = null;
  this.lastX = this.lastY = null;


  this.clear = function(){
    background(255);
  }

  this.init = function(){
    this.canvas = createCanvas(400, 400);
    this.canvas.parent('canvas-container');
    this.clear();
  }

  this.loop = function(){

          if (mouseIsPressed) {
            fill(0);
            stroke(0);
            strokeWeight(10);
            if (this.lastX === null){
              point(mouseX, mouseY);
            } else {
              line(this.lastX, this.lastY, mouseX, mouseY);
            }

            this.lastX = mouseX;
            this.lastY = mouseY;
          } else {
            this.lastX = this.lastY = null;
          }
}
}


GameAPI.getGame(gameID, function(game){
  if(!game.canModify){
    location.href = 'game-info.html?id=' + encodeURIComponent(gameID);
    return;
  }
  loadMobilenet(function(model){
    mobilenet = model;
    document.getElementById('title').innerHTML = 'Training: ' + game.name;
    document.getElementById('loading').classList.add('hidden');

    currentLabel = game.labels[0];
    displayCurrentExampleCount();

    var idx = 0;
    document.getElementById('label-select').innerHTML = game.labels.map(function(label){
      if(label === currentLabel){
        return `<option value="label-${idx++}" selected>${label}</option>`
      } else {
        return `<option value="label-${idx++}">${label}</option>`
      }
    }).join('');

    document.getElementById('label-select').addEventListener('change', function(){
      var value = document.getElementById('label-select').value;
      var idx = +(value.split('label-')[1]);
      currentLabel = game.labels[idx];
      displayCurrentExampleCount();
    })

    document.getElementById('clear-btn').addEventListener('click', function(){
      gameObj.clear();
    });

    document.getElementById('submit').addEventListener('click', function(){
      nn = new NeuralNetwork(game.id, game.labels, game.name);
      training.forEach(function(data){
        var img = new Image();
        img.src = data.data;
        nn.addExample(canvasToPixels(img), nn.labels.indexOf(data.label));
      });
      nn.fit(function(){
        nn.save(function(){
          NotificationManager.create("Model saved", "Loss: " + lastLoss);
          setTimeout(function(){
            location.href = 'game-info.html?id=' + encodeURIComponent(gameID);
          }, 1000);
       });
     }, displayLoss);
    });

    document.getElementById('cancel').addEventListener('click', function(){
      location.href = 'game-info.html?id=' + encodeURIComponent(gameID);
    });

    document.getElementById('example-btn').addEventListener('click', function(){
      var canvasData = canvasToImage(gameObj.canvas.canvas);
      training.push({ data: canvasData, label: currentLabel });
      showTrainingData();
      displayCurrentExampleCount();
      gameObj.clear();
    });

  });

});

// Modified from https://davidwalsh.name/convert-canvas-image
function canvasToImage(canvas) {
	return canvas.toDataURL("image/jpeg");
}

function canvasToPixels(canvas){
  var pixels = tf.fromPixels(canvas, 3).expandDims(0).toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
  return tf.image.resizeBilinear(pixels, [224, 224]);
}

function displayLoss(loss){
  document.getElementById('loss').innerHTML = `Loss: ${loss.toFixed(5)}`;
  lastLoss = loss.toFixed(5);
}


function displayCurrentExampleCount(){
  var numExamples = training.filter(function(val){
    return val.label === currentLabel;
  }).length;

  document.getElementById('num-examples').innerHTML = `${numExamples} example${numExamples === 1 ? '': 's'} of '${currentLabel}'`;
}

function showTrainingData(){
  var i = 0;
  displayCurrentExampleCount();
  document.getElementById('training-data').innerHTML = training.map(data => `
    <div class="training">
      <img src="${data.data}" alt="${data.label}"/>
      <p>${data.label}</p>
      <div class="training-delete" onclick="deleteExample(${i++})">X</div>
    </div>
    `).join('')
}

function deleteExample(i){
  training.splice(i, 1);
  showTrainingData();
}

function setup(){
  gameObj = new Game();
  gameObj.init();
}

function draw(){
  gameObj.loop();
}
