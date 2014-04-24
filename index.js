'use strict';

var util = require('util');
var stream = require('stream');
var execSync = require('exec-sync');
var request = require('request');

// Give our module a stream interface
util.inherits(Driver, stream);

function Driver(opts, app) {

  this.app = app;

  if (!app.opts.bugsnagKey) {
    throw new Error('No BugSnag key, support driver is disabled.');
  }

  this.bugsnag = require('bugsnag');
  this.bugsnag.register(app.opts.bugsnagKey);

}

Driver.prototype.config = function(rpc,cb) {

  if (!rpc) {
    return cb(null, {
      'contents':[
        { 'type': 'submit', 'name': 'Send Device Logs to Ninja Support', 'rpc_method': 'send' }
      ]
    });
  }

  if (rpc.method == 'send') {
    this.sendLogs(cb);
    return;
  } else {
    return cb(true);
  }

};

Driver.prototype.sendLogs = function(cb) {
  this.getLogs(function sendSupportLogs(logs) {
    //this.getUser(this.app, function(err, user) {
      //logs.user = user;
      logs.userId = this.app.serial;//user.email;
      logs.serial = this.app.serial;
      logs.groupingHash = 'support';

      //this.bugsnag.notify(new Error('Support logs for ' + logs.userId), logs);
      
      console.log('Got Logs', logs);

   // }.bind(this));
   
  }.bind(this));
};

var commands = {
  'env': 'env',
  'uptime': 'uptime',
  'traceZendo' : 'curl -v --trace-time https://zendo.ninja.is/',
  'pingGoogle' : 'ping -c 10 -i 10  http://google.com',
  'dmesg': 'dmesg',
  'ninjaLog': 'cat /var/log/ninjablock.log',
  'network': 'ifconfig -a',
  'wifi': 'iwconfig',
  'netstat': 'netstat -an',
  'packages': 'dpkg --get-selections | grep -v deinstall',
  'motd': 'cat /run/motd.dynamic'
};

Driver.prototype.getLogs = function(cb) {
  console.log('ninja-support - Getting logs');

  var details = {};

  for (var id in commands) {
    console.log('ninja-support - Running command "' + id + '" - ' + commands[id]);
    try {
      details[id] = execSync(commands[id]);
    } catch(e) {
      details[id] = 'Failed ' + e.toString();
    }
  }

  cb(details);
};

Driver.prototype.getUser = function(app, cb) {
  return cb(null, this.app.serial);
  // This doesn't work yet!!!!

  var proto = (app.opts.secure) ? 'https://' : 'http://';
  var uri = proto + app.opts.apiHost + ':' + app.opts.apiPort + '/rest/v0/devices';

  console.log('uri', uri, 'token', app.token);
  var opts = {
    url: uri,
    headers: {
      'X-Ninja-Token': app.token
    },
    method: 'GET',
    json: true
  };

  request(opts, function (err, res, body) {
    console.log('GOT BODY', body);
    if (body && body.result === 1) {
      cb(null, body.data)
    } else {
      cb(body && body.error || "REST: Unknown Error")
    }
  });
};


// Export it
module.exports = Driver;