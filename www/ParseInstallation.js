var exec = require('cordova/exec');

module.exports = (function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Allow for MSIE11 msCrypto
  var _crypto = _global.crypto || _global.msCrypto;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _crypto && _crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      _crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // uuid v4
  function uuid() {
    var rnds = _rng();
    var bth = _byteToHex;
    var i = 0;

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    return  bth[rnds[i++]] + bth[rnds[i++]] +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] + '-' +
            bth[rnds[i++]] + bth[rnds[i++]] +
            bth[rnds[i++]] + bth[rnds[i++]] +
            bth[rnds[i++]] + bth[rnds[i++]];
  }

  var deferred;
  var toReturn;
  if (window.jQuery) {
    deferred = jQuery.Deferred;
    toReturn = function(def) {
      return def;
    };
  } else if (window.angular) {
    injector = angular.injector(["ng"]);
    $q = injector.get("$q");
    deferred = $q.defer;
    toReturn = function(def) {
      return def.promise;
    };
  } else {
    return console.error('AppVersion either needs a success callback, or jQuery/AngularJS defined for using promises');
  }

  function getAppName() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getAppName', []);
    return toReturn(q);
  }
  
  function getPackageName() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getPackageName', []);
    return toReturn(q);
  }

  function getVersionNumber() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getVersionNumber', []);
    return toReturn(q);
  }

  function getVersionCode() {
    var q = deferred();
    exec(q.resolve, q.reject, 'ParseInstallation', 'getVersionCode', []);
    return toReturn(q);
  }

  function saveInstallation(token) {
    var q = deferred();
    var Installation = Parse.Object.extend("_Installation");
    var installation = new Installation();

    // platform
    var platform = device.platform.toLowerCase();

    // installationId
    var installationId = window.localStorage.getItem('parseInstallationId');

    if (!installationId) {
      installationId = uuid();
      window.localStorage.setItem('parseInstallationId', installationId);
    }

    installation.set('deviceType', platform);
    if (platform === 'android') {
      installation.set('pushType', 'gcm');
    }
    installation.set('installationId', installationId);
    installation.set('deviceToken', token);
    // installation.set('parseVersion', token);
    // installation.set('timeZone', token);

    // getVersionCode().then(function(packageName) {
    // });

    setTimeout(function() {
      q.resolve(installation);
    });

    return toReturn(q)
      .then(function(installation) {
        return getVersionNumber()
          .then(function(versionNumber) {
            return installation.set('appVersion', versionNumber);
          });
      })
      .then(function(installation) {
        return getAppName()
          .then(function(appName) {
            return installation.set('appName', appName);
          });
      })
      .then(function(installation) {
        return getPackageName()
          .then(function(packageName) {
            return installation.set('appIdentifier', packageName);
          });
      })
      .then(function(installation) {
        return installation.save();
      });
  }

  var pushToken;
  var onNotification;
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
    initialize: function (appId, appKey, config) {

      Parse.initialize(appId, appKey);

      if (config.onNotification) {
        onNotification = config.onNotification;
      }

      var platform = device.platform.toLowerCase();
      if (platform === 'android') {
        config = config.android;
      } else if (platform === 'ios') {
        config = config.ios;
      } else {
        return q.reject('Not suppert platform');
      }

      if (config !== undefined && config.ecb === undefined) {
        config.ecb = 'ParseInstallation.listenNotification';
      }

      var q = deferred();

      window.plugins.pushNotification.register(function (token) {
        if (token != 'OK') {
          pushToken = token;
        }

        var nextLoop = function() {
          setTimeout(function () {
            if (pushToken) {
              saveInstallation(pushToken)
                .then(q.resolve, q.reject);
            } else {
              nextLoop();
            }
          });
        };
        nextLoop();
      }, q.reject, config);

      return toReturn(q);
    }
  };
}).call(this);