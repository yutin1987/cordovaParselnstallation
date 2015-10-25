# ngCordova Parse Installation plugin

Parse Installation of your ngCordova.

## Installation

    cordova plugin add https://github.com/yutin1987/cordovaParselnstallation.git

### Manually in iOS

TODO: Write these instructions

### Manually in Android

TODO: Write these instructions

### Sample Code

```
<script src="js/parse.js"></script>

Parse.initialize(
  'AppId',
  'AppKey'
);
  
$ionicPlatform.ready(function() {
  ParseInstallation
    .initialize(
      {
        senderID: 'XXXXXXX',
        onNotification: function(data) {
        }
      }
    )
    .then(function(installation) {
      // alert('New object created with objectId: ' + installation.id);
    });
});
```

### License

MIT License - http://opensource.org/licenses/mit-license.php
