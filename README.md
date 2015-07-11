# ngCordova Parse Installation plugin

Parse Installation of your ngCordova.

## Installation

Step1. install [pushNotifications](http://ngcordova.com/docs/plugins/pushNotifications/):

    cordova plugin add https://github.com/phonegap-build/PushPlugin.git

Step2. install ngCordovaParse:

    cordova plugin add https://github.com/yutin1987/cordovaParselnstallation.git

### Manually in iOS

TODO: Write these instructions

### Manually in Android

TODO: Write these instructions

### Sample Code

```
$ionicPlatform.ready(function() {
  ParseInstallation
    .initialize(
      'Application ID',
      'JavaScript Key',
      {
        android: {'senderID': 'XXXXXXXXXXXX'},
        ios: {},
        onNotification: function(notification) {
          $rootScope.$broadcast('notificationReceived', notification);
        }
      }
    )
    .then(function(installation) {
      alert('New object created with objectId: ' + installation.id);
    });
});
```

### License

MIT License - http://opensource.org/licenses/mit-license.php