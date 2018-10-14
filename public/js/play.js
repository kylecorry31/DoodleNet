var gameID = decodeURIComponent(location.search.split('id=')[1]);

var GAME_STATE = {
  INITIALIZING: 0,
  CALIBRATING: 1,
  LOADING: 2,
  PLAYING: 3
};

Object.freeze(GAME_STATE);

var canvas;
var game;

var mobilenet;
var training = []; // TODO: move to a training page
var lastClassification = null;

function Canvas(width, height){
  this.width = width;
  this.height = height;
  this.canvas = createCanvas(width, height);

  this.getP5Canvas = function(){
    return this.canvas;
  };

  this.getHTMLCanvas = function(){
    return this.canvas.canvas;
  };

  this.clear = function(backgroundColor){
    backgroundColor = backgroundColor || 255;
    background(backgroundColor);
  }

}


function Game(){
  this.currentGameNN = null;
  this.successSound;
  this.useMouse = false;
  this.state = GAME_STATE.INITIALIZING;
  this.webcam = null;
  this.canvas = null;
  this.target = null;
  this.tracker = null;
  this.lastX = this.lastY = null;

  this.setNN = function(nn){
    this.currentGameNN = nn;
  }

  this.clear = function(){
    this.canvas.clear();
    this.canvasModified = false;
  }

  this.init = function(){
    this.successSound = loadSound('ta-da.wav');
    this.canvas = new Canvas(400, 400);
    this.canvas.getP5Canvas().parent('canvas-container');
    this.clear();
    if (!this.useMouse){
      this.webcam = createCapture(VIDEO);
      this.webcam.size(400, 400);
      this.webcam.position(-400, -400);
      // this.webcam.style('display', 'none');
      this.webcam.style('opacity', 0.0);
      this.webcam.id("webcam");
      this.state = GAME_STATE.CALIBRATING;
    } else {
      this.state = GAME_STATE.PLAYING;
    }
  }

  this.loop = function(){
      switch (this.state){
        case GAME_STATE.CALIBRATING:
          document.getElementById('to-draw').innerHTML = `Click on the item you will use to draw in the webcam image above. (Colors that stand out work best)`
          image(this.webcam, 0, 0);
          document.getElementById('game-name').innerHTML = 'Game: ' + this.currentGameNN.name;
          if (mouseIsPressed){
            // TODO: improve target selection
            var calibrationColor = get(mouseX, mouseY);
            this.clear();
            this.setRandomTarget();
            this.tracker = new Tracker(this.currentGameNN.gameID, calibrationColor, this.webcam, '#webcam');
            this.state = GAME_STATE.PLAYING;
          }
          break;
        case GAME_STATE.PLAYING:
          var targetingDot = document.getElementById('targeting-dot');
          var instructions = "";
          if (this.useMouse){
            instructions = "(press mouse to draw)"
          } else {
            instructions = "(hold SHIFT to draw)";
          }
          document.getElementById('to-draw').innerHTML = `Draw '${this.target}' ${instructions}`
          var cX = 0;
          var cY = 0;
          if (this.useMouse){
            cX = mouseX;
            cY = mouseY;
          } else {
            cX = width * this.tracker.targetingX;
            cY = height * this.tracker.targetingY;
          }

          if ((this.useMouse && mouseIsPressed) || (keyIsPressed && keyCode == 16)) {
            this.canvasModified = true;
            fill(0);
            stroke(0);
            strokeWeight(10);
            canvasModified = true;
            if (this.lastX === null){
              point(cX, cY);
            } else {
              line(this.lastX, this.lastY, cX, cY);
            }

            this.lastX = cX;
            this.lastY = cY;
            targetingDot.style.opacity = '0.0';
          } else {
            this.lastX = this.lastY = null;
            // Draw very light dot above canvas
            if (this.useMouse){
              targetingDot.style.opacity = '0.0';
              targetingDot.style.top = '0px';
              targetingDot.style.left = '0px';
            } else {
              targetingDot.style.opacity = '0.5';
              targetingDot.style.top = round(cY - 200) + 'px';
              targetingDot.style.left = round(cX + 20) + 'px';
            }
          }


          break;
    }
  }

  this.setRandomTarget = function(){
    var lastTarget = this.target;
    while(this.target === lastTarget){
      this.target = random(this.currentGameNN.labels);
    }
  }
}



function setup(){
  loadMobilenet(function(model){
    mobilenet = model;
    console.log("MobileNet loaded");
    GameAPI.getGame(gameID, function(g){
      game = new Game();
      game.setNN(new NeuralNetwork(g.id, g.labels, g.name));


      // TODO: see if user would rather use mouse
      document.getElementById('loading').innerHTML = `
        <div id="loading-inner">
          <div class="game-btn" id="mouse-btn" onclick="loadScreenMouseChoice(true);"><h2>Use Mouse</h2></div>
          <div class="game-btn" id="cam-btn" onclick="loadScreenMouseChoice(false);"><h2>Use Camera</h2></div>
        </div>
      `;



    });
  });
}

function loadScreenMouseChoice(useMouse){
  game.useMouse = useMouse;
  document.getElementById('loading').classList.add('hidden');
  game.init();
  
  classifyImage(function(){});

  document.getElementById('clear-btn').addEventListener('click', function(){
    game.clear();
  });

  document.getElementById('done-btn').addEventListener('click', function(){
    location.href = 'game-info.html?id=' + encodeURIComponent(game.currentGameNN.gameID);
  });

  document.getElementById('skip-btn').addEventListener('click', function(){
    game.clear();
    game.setRandomTarget();
  });



  setInterval(function(){
    if(game.canvasModified && game.currentGameNN.state === NETWORK_STATE.INACTIVE && game.state == GAME_STATE.PLAYING){
      classifyImage(function(classification){
        document.getElementById('classification').innerHTML = `Classification: '${classification.classification}'`;
        document.getElementById('confidence').innerHTML = `Confidence: ${Math.round(classification.confidence * 100 * 100) / 100}%`
        if (classification.classification === game.target && classification.confidence >= 0.75) {
          game.successSound.play();
          game.setRandomTarget();
          game.clear();
          lastClassification = null;
          return;
        }

        lastClassification = classification.classification;
      });
    }
  }, 1000)


  game.setRandomTarget();
}


function draw(){
  if (game && game.state != GAME_STATE.INITIALIZING){
    game.loop();
  }
}


// NETWORK REQUESTS

function loadGames(callback){
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.onload = function(){
    callback(this.response);
  };
  xhr.open("GET", "/games");
  xhr.send();
}


// HELPERS
function classifyImage(callback){
  game.currentGameNN.classify(canvasToPixels(game.canvas.getHTMLCanvas()), callback);
}

// Modified from https://davidwalsh.name/convert-canvas-image
function canvasToImage(canvas) {
	return canvas.toDataURL("image/jpeg");
}

function canvasToPixels(canvas){
  var pixels = tf.fromPixels(canvas, 3).expandDims(0).toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
  return tf.image.resizeBilinear(pixels, [224, 224]);
}

// LIBRARY CODE

// From https://gist.github.com/mjackson/5311256, all credits for this algorithm belong to mjackson (https://gist.github.com/mjackson)

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, v ];
}
