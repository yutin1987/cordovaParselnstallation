# ngCordova Parse Installation plugin

Parse Installation of your ngCordova.

## Installation

Step1. install [pushNotifications](http://ngcordova.com/docs/plugins/pushNotifications/):

    cordova plugin add https://github.com/phonegap-build/PushPlugin.git

Step2. install ngCordovaParse:

    cordova plugin add https://github.com/yutin1987/ngCordovaParse.git

### Manually in iOS

TODO: Write these instructions

### Manually in Android

TODO: Write these instructions

### Sample Code

angular
.module('starter', ['ngCordova', 'ngCordovaParse'])
.run(function(
  $cordovaParse
) {
  $cordovaParse
    .initialize(
      'Application ID',
      'JavaScript Key',
      {
        android: {'senderID': 'XXXXXXXXXXXX'},
        ios: {}
      }
    )
    .then(function(installation){
      alert('New object created with objectId: ' + installation.id);
    });

  $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
    alert(JSON.stringify(notification));
  });
});

### License

MIT License - http://opensource.org/licenses/mit-license.php