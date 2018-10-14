var NETWORK_STATE = {
  CLASSIFYING: 0,
  TRAINING: 1,
  INACTIVE: 2,
  NOT_READY: 3
};

Object.freeze(NETWORK_STATE);

function getBuiltNetwork(gameID, callback){
  tf.loadModel('models/' + encodeURIComponent(gameID) + "/model.json").then(function(model){
    callback(model);
  }).catch(function(e){
    callback(null);
  });
}

function loadMobilenet(callback) {
  // Adapted from https://js.tensorflow.org/tutorials/webcam-transfer-learning.html
  tf.loadModel(
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json').then(function(mobilenet){
        var layer = mobilenet.getLayer('conv_pw_13_relu');
        callback(tf.model({inputs: mobilenet.inputs, outputs: layer.output}));
      });
};


function NeuralNetwork(gameID, labels, name){
  this.state = NETWORK_STATE.NOT_READY;
  this.labels = labels;
  this.gameID = gameID;
  this.name = name;
  // Adapted from https://js.tensorflow.org/tutorials/webcam-transfer-learning.html

  this.recreateModel = function(){
    this.model = tf.sequential({
      layers: [
        tf.layers.flatten({inputShape: [7, 7, 256]}),
        tf.layers.dense({
          units: 100,
          activation: 'relu',
          kernelInitializer: 'varianceScaling',
          useBias: true
        }),
        tf.layers.dense({
          units: labels.length,
          kernelInitializer: 'varianceScaling',
          useBias: false,
          activation: 'softmax'
        })
      ]
    });
    const optimizer = tf.train.adam(0.0001);
    this.model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});
  }

  this.loadFromServer = function(callback){
    this.recreateModel();
    getBuiltNetwork(gameID, function(model){
      if(model){
        this.model = model;
        const optimizer = tf.train.adam(0.0001);
        this.model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});
        console.log('using prebuilt-network');
        callback();
      } else {
        this.recreateModel();
        callback();
      }
    }.bind(this))
  }

  this.loadFromServer(function(){
    this.state = NETWORK_STATE.INACTIVE;
  }.bind(this));

  this.addExample = function(example, label) {
    var y = tf.tidy(() => tf.oneHot(tf.tensor1d([label], 'int32'), this.labels.length));

    example = mobilenet.predict(example);

    if (this.xs == null) {
      this.xs = tf.keep(example);
      this.ys = tf.keep(y);
    } else {
      const oldX = this.xs;
      this.xs = tf.keep(oldX.concat(example, 0));

      const oldY = this.ys;
      this.ys = tf.keep(oldY.concat(y, 0));

      oldX.dispose();
      oldY.dispose();
      y.dispose();
    }
  }

  this.save = function(callback){
    this.model.save(tf.io.browserHTTPRequest(
    '/models/' + encodeURIComponent(this.gameID),
    {method: 'POST'})).then(callback);
  }

  this.fit = function(callback, batchCallback){
    this.state = NETWORK_STATE.TRAINING;
    if (!this.xs){
      this.state = NETWORK_STATE.INACTIVE;
      callback();
      return;
    }
    var batchSize =  Math.floor(this.xs.shape[0] * 0.4);
    if (batchSize == 0){
      batchSize = 1;
    }
    this.recreateModel();
    this.model.fit(this.xs, this.ys, {
        epochs: 20,
        callbacks: {
          onBatchEnd: function(batch, logs){
            if(batchCallback){
              batchCallback(logs.loss);
            }
          },
          onTrainEnd: function(){
            this.state = NETWORK_STATE.INACTIVE;
            callback();
          }.bind(this)
        }
      });
    }

  this.classify = function(c, callback){
    this.state = NETWORK_STATE.CLASSIFYING;
    // Adapted from https://js.tensorflow.org/tutorials/webcam-transfer-learning.html
    var pixels = c;
    var activation = mobilenet.predict(pixels);
    var prediction = this.model.predict(activation);
    this.state = NETWORK_STATE.INACTIVE;
    prediction.as1D().data().then(function(data){
        var max = data[0];
        var maxIndx = 0;

        for(var i = 0; i < data.length; i++){
          if(data[i] > max){
            max = data[i];
            maxIndx = i;
          }
        }

        var classification = {
          classification: labels[maxIndx],
          confidence: max
        };
        callback(classification);
      });
  }
}
