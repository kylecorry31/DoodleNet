function _webRequest(path, method, callback, params){
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.open(method, path);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onload = function(ev){
    callback(this.response);
  };
  if (typeof params !== 'undefined'){
    xhr.send(JSON.stringify(params));
  } else {
    xhr.send();
  }
}


var GameAPI = {
  getGames: function(callback){
    _webRequest('games', 'GET', callback);
  },

  getGame: function(gameID, callback){
    _webRequest('games/' + encodeURIComponent(gameID), 'GET', callback);
  },

  createGame: function(game, callback){
    _webRequest('games/', 'POST', callback, game);
  },

  updateGame: function(game, callback){
    _webRequest('games/' + encodeURIComponent(game.id), 'PUT', callback, game);
  },

  deleteGame: function(gameID, callback){
    _webRequest('games/' + encodeURIComponent(gameID), 'DELETE', callback);
  }
};

Object.freeze(GameAPI);
