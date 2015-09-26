var exec = require('cordova/exec');

module.exports = (function() {
  var Installation = Parse.Object.extend("_Installation");
  var installation = new Installation();
  var pushToken;
  var onNotification;

  var subscriptions = window.localStorage.getItem('subscriptions') || '[]';
  subscriptions = JSON.parse(subscriptions);

  function getAppName() {
    var promise = new Parse.Promise();
    exec(promise.resolve.bind(promise), promise.reject.bind(promise), 'ParseInstallation', 'getAppName', []);
    return promise;
  }
  
  function getPackageName() {
    var promise = new Parse.Promise();
    exec(promise.resolve.bind(promise), promise.reject.bind(promise), 'ParseInstallation', 'getPackageName', []);
    return promise;
  }

  function getVersionNumber() {
    var promise = new Parse.Promise();
    exec(promise.resolve.bind(promise), promise.reject.bind(promise), 'ParseInstallation', 'getVersionNumber', []);
    return promise;
  }

  function getTimeZone() {
    var promise = new Parse.Promise();
    exec(promise.resolve.bind(promise), promise.reject.bind(promise), 'ParseInstallation', 'getTimeZone', []);
    return promise;
  }

  function getToken(config) {
    var promise = new Parse.Promise();
    if (pushToken) {
      setTimeout(function() {
        promise.resolve(pushToken);
      });
    } else {
      exec(function (token) {
        if (token != 'OK') {
          pushToken = token;
        }

        // watting listenNotification if android
        var timeout = new Date().getTime();
        var nextLoop = function() {
          setTimeout(function () {
            if (pushToken || new Date().getTime() > timeout + 5 * 1000) {
              promise.resolve(pushToken);
            } else {
              nextLoop();
            }
          });
        };
        nextLoop();
      }, function() {
        console.log('error: failed to get token');
        promise.resolve();
      }, "PushPlugin", "register", [config]);
    }
    return promise;
  }

  function saveInstallation(config) {
    return Parse.Promise.when([
        Parse._getInstallationId(),
        getAppName(),
        getPackageName(),
        getVersionNumber(),
        getTimeZone(),
        getToken(config)
      ])
      .then(function(
        iid,
        appName,
        packageName,
        versionNumber,
        timeZone,
        token
      ) {
        installation.set('installationId', iid);
        installation.set('appName', appName);
        installation.set('appIdentifier', packageName);
        installation.set('appVersion', versionNumber);
        installation.set('timeZone', timeZone);
        installation.set('deviceToken', token);

        var platform = device.platform.toLowerCase();
        installation.set('deviceType', platform);
        if (platform === 'android') {
          installation.set('pushType', 'gcm');
          if (config.senderID !== 1076345567071) {
            installation.set('GCMSenderId', config.senderID);
          }
        }
        
        installation.set('parseVersion', Parse.VERSION);
        installation.set('channels', subscriptions);

        return installation.save();
      })
      .then(function(reply) {
        installation.id = reply.id;
        console.log('save installation: ' + reply.id + ', ' + reply.get('installationId'));
        
        return installation;
      });
  }

  return {
    listenNotification: function (notification) {
      setTimeout(function() {
        if (notification.event && notification.event == 'registered') {
          if (notification.regid.length > 0 ) {
            pushToken = notification.regid;
          }
        } else {
          if (onNotification) {
            onNotification(notification);
          } else if (window.onNotification) {
            window.onNotification(notification);
          }
        }
      });
    },
    getCurrentInstallation: function() {
      return Parse.Promise.as(installation);
    },
    initialize: function (config) {
      if (!Parse) {
        throw new Error('Parse is not defined');
      }

      return Parse
        .Promise
        .as(config)
        .then(function(config) {
          if (config.onNotification) {
            onNotification = config.onNotification;
          }
          
          config.ecb = 'ParseInstallation.listenNotification';

          var platform = device.platform.toLowerCase();
          var assign;
          if (platform === 'android') {
            assign = config.android;
            if (!config.senderID && !assign.senderID) {
              config.senderID = 1076345567071;
            }
          } else if (platform === 'ios') {
            assign = config.ios;
          } else {
            return Parse.Promise.error('Not suppert platform');
          }

          for (var key in assign) {
            if (assign.hasOwnProperty(key)) {
              config[key] = assign[key];
            }
          }

          config.badge = config.badge === false ? false : true;
          config.sound = config.sound === false ? false : true;
          config.alert = config.alert === false ? false : true;

          return saveInstallation(config);
        });
    },
    getSubscriptions: function() {
      return Parse.Promise.as(subscriptions);
    },
    subscribe: function(channels) {
      if (typeof channels === 'string') {
        channels = [channels];
      }
      
      channels.forEach(function(item) {
        installation.addUnique("channels", item);
      });
      
      subscriptions = installation.get('channels');

      window.localStorage.setItem('subscriptions', JSON.stringify(subscriptions));

      if (installation.id) {
        installation.save();
      }
    },
    unsubscribe: function(channels) {
      if (typeof channels === 'string') {
        channels = [channels];
      }

      if (channels instanceof RegExp) {
        subscriptions = subscriptions.filter(function(subscription) {
          return !channels.test(subscription);
        });
      } else {
        channels.forEach(function(item) {
          subscriptions = subscriptions.filter(function(subscription) {
            return subscription !== item;
          });
        });
      }

      installation.set("channels", subscriptions);

      window.localStorage.setItem('subscriptions', JSON.stringify(subscriptions));

      if (installation.id) {
        installation.save();
      }
    }
  };
}).call(this);