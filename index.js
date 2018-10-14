var http = require('http')
  , fs   = require('fs')
  , url  = require('url')
  , path = require('path')
  , firebase = require("firebase")
  , formidable = require('formidable')
  , bodyParser = require('body-parser')
  , rmdir = require('rimraf')
  , port = 8080;

var protectedGames = []

var express = require('express')
var app = express()
app.use(bodyParser.json({
  extended: true
}));
app.use('/', express.static('public'))
app.use('/models', express.static('models'))


app.route('/games')
  .get((req, res) => {
    getGames(res);
  })
  .post((req, res) => {
    createGame(req, res)
  })

app.route('/games/:gameID')
  .get((req, res) => {
    getGame(req, res)
  })
  .put((req, res) => {
    updateGame(req, res);
  })
  .delete((req, res) => {
    deleteGame(req, res);
  })

app.route('/models/:gameID')
  .post((req, res) => {
    saveModel(req, res)
  })

var config = {
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER",
  databaseURL: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER",
  messagingSenderId: "PLACEHOLDER"
};
firebase.initializeApp(config);

app.listen(process.env.PORT || port, () => console.log(`listening on port ${process.env.PORT || port}`))


// subroutines

function sendFile(res, filename, contentType) {
    contentType = contentType || 'text/html';
    fs.readFile(filename, function (error, content) {
        res.setHeader('Content-type', contentType);
        res.status(200).send(content);
    })
}

function sendJSON(res, json) {
  res.json(json);
}

function createGame(req, res){
  var game = req.body;
  var gameID = createGameOnFB(game.name, game.labels)
  sendJSON(res, { id: gameID })
}

function getGame(req, res){
  getGameFromFB(req.params.gameID, function(game){
    sendJSON(res, game)
  })
}

function getGames(res){
  getGamesFromFB(function(games){
    sendJSON(res, games);
  })
}

function updateGame(req, res){
  var game = req.body
  if(isProtectedGame(req.params.gameID)){
    sendJSON(res, { id: req.params.gameID, conModify: false });
    return;
  }
  updateGameOnFB(req.params.gameID, game.name, game.labels)
  sendJSON(res, { id: req.params.gameID })
}

function isProtectedGame(gameID){
  return protectedGames.indexOf(gameID) >= 0;
}

function deleteGame(req, res){
  if(isProtectedGame(req.params.gameID)){
    sendJSON(res, { id: req.params.gameID, conModify: false });
    return;
  }
  deleteGameFromFB(req.params.gameID)
  deleteModel(req.params.gameID)
  sendJSON(res, { id: req.params.gameID })
}

function deleteModel(gameID){
  if(isProtectedGame(gameID)){
    return;
  }
  pathname = "models/" + gameID
  if (fs.existsSync(pathname)){
    rmdir(pathname, function(error){
      if(error){
        console.error(error);
      }
    })
  }
}

function saveModel(req, res){
  if(isProtectedGame(req.params.gameID)){
    sendJSON(res, { id: req.params.gameID, conModify: false });
    return;
  }
  pathname = "models/" + req.params.gameID
  var filesCompleted = 0;

  if (!fs.existsSync(pathname)){
    fs.mkdirSync(pathname)
}

  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    fs.readFile(files['model.json']['path'], function(error, content){
      fs.writeFile(pathname + "/model.json", content, function(err) {
          if(err) {
              return console.log(err);
          }
          filesCompleted++;
          if (filesCompleted == 2){
            sendJSON(res, {})
          }
      });
    })

    fs.readFile(files['model.weights.bin']['path'], function(error, content){
      fs.writeFile(pathname + "/model.weights.bin", content, function(err) {
          if(err) {
              return console.log(err);
          }
          filesCompleted++;
          if (filesCompleted == 2){
            sendJSON(res, {})
          }
      });
    })

  });
}


// FIREBASE

function getGameFromFB(gameID, callback){
  firebase.database().ref('games/' + gameID).once('value').then(function(data){
    if (!(data && data.val())){
      callback({});
      return;
    }
    data = data.val();
    data.canModify = !isProtectedGame(gameID);
    data.id = gameID;
    callback(data);
  })
}

// TODO: Taken and modified from my a3

function getGamesFromFB(callback){
  firebase.database().ref('games').once("value").then(function(data){
    if (!(data && data.val())){
      callback([]);
      return;
    }
    data = data.val();

    var keys = Object.keys(data);
    var games = [];
    keys.forEach((key) => {
      var value = data[key];
      value.id = key;
      value.canModify = !isProtectedGame(key);
      games.push(value);
    });

    callback(games);
  });
}

function createGameOnFB(name, labels) {
    return firebase.database().ref('games/').push({
          name: name,
          labels: labels
        }).key;
}

function updateGameOnFB(id, name, labels){
  if(isProtectedGame(id)){
    return undefined;
  }
  return firebase.database().ref('games/' + id).set({
        name: name,
        labels: labels
      });
}

function deleteGameFromFB(id){
  if(isProtectedGame(id)){
    return;
  }
  firebase.database().ref('games/' + id).remove();
}
