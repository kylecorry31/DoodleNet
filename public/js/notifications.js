var NotificationManager = {
  _notificationPane: undefined,
  create: function(title, desc, timeout, delay){
    if(!timeout){
      timeout = 2;
    }
    if(!this._notificationPane){
      this._notificationPane = document.createElement('div');
      this._notificationPane.classList.add('notificationPane');
      document.body.appendChild(this._notificationPane);
    }
    var notification = document.createElement('div');
    notification.classList.add('notification');
    var context = this;
    notification.addEventListener("click", function(){
     context._notificationPane.removeChild(notification);
   });
    notification.innerHTML = '<h1 class="notification-title">'+ title + '</h1><p class="notification-desc">' + desc + '</p>';
    if(delay){
      setTimeout(function(){
        this._displayNotification(notification, timeout);
      }, delay * 1000);
    } else {
      this._displayNotification(notification, timeout);
    }
  },
  _displayNotification: function(notification, timeout){
    this._notificationPane.appendChild(notification);
    var context = this;
    setTimeout(function(){
      context._notificationPane.removeChild(notification);
    }, timeout * 1000);
  }
};
