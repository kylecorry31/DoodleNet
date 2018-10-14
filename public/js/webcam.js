function Tracker(name, color, camera, videoID){
  this.x = 0;
  this.y = 0;

  this.targetingX = 0;
  this.targetingY = 0;

  this.width = 0;
  this.height = 0;

  tracking.ColorTracker.registerColor(name, function(r, g, b) {
    var stdDevH = 0.1;
    var stdDevS = 0.2;
    var stdDevV = 0.3;
    var hsv = rgbToHsv(color[0], color[1], color[2]);
    var newHsv = rgbToHsv(r, g, b);

    if (hsv[0] - stdDevH < newHsv[0] && newHsv[0] < hsv[0] + stdDevH &&
        hsv[1] - stdDevS < newHsv[1] && newHsv[1] < hsv[1] + stdDevS &&
        hsv[2] - stdDevV < newHsv[2] && newHsv[2] < hsv[2] + stdDevV) {
          return true;
    }
    return false;
  });

  var colors = new tracking.ColorTracker([name]);

  colors.on('track', function(event) {
   if (event.data.length === 0) {
     return;
   }
   var biggest = event.data[0];

   event.data.forEach(function(rect) {
     if (rect.width * rect.height > biggest.width * biggest.height){
       biggest = rect;
     }
   })

   var rect = biggest;

   this.x = rect.x + (rect.width / 2)
   this.y = rect.y + (rect.height / 2)

   this.width = rect.width;
   this.height = rect.height;

   var captureWidth = camera.size().width;
   var captureHeight = camera.size().height;

   this.targetingX = 1 - this.x / captureWidth;
   this.targetingY = this.y / captureHeight;
  }.bind(this));

  tracking.track(videoID, colors);
}
