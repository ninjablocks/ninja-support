/**
 * This is a test script I use (with small changes) with all my drivers.
 * 
 * It sets up a fake 'mini-client' that starts the driver with just enough of what client 
 * provides so that it can run.
 *
 * Driver settings(opts) are not persisted between runs, but it can be altered to do that
 * relatively easy using :
 * 
 * require('config.json') 
 * 
 * and 
 * 
 * fs.writeFileSync('config.json', JSON.stringify(opts))
 */

var EventEmitter = require('events').EventEmitter;

var opts = require('./package.json').config;

/* 
 * "app" is the application wide event emitter, that is... it's a channel the different parts of client
 * can use to communicate. Most system-wide events (like connect, disconnect, new device etc.) come through here.
 */
var app = new EventEmitter();

/* In client, the log is provided by log4js, but to save the dependency, I just map console log :) */
app.log = {
    debug: console.log,
    info: console.log,
    warn: console.log,
    error: console.log
};

app.opts = {
  bugsnagKey: process.env.BUGSNAG_KEY
};

/* Here we require(aka import) our driver, and instantiate it with it's settings and a reference to the app */
var driver = new (require('./index'))(opts, app);


driver.save = function() {
  console.log('Saved opts', opts);
};

/*
 * After 500ms (enough time for a driver to get ready, they are used to having some time!) we send the 'client::up'
 * event, which is usually emitted when the client has successfully connected to the cloud, and drivers
 * are free to start providing devices.
 */
setTimeout(function() {
  app.emit('client::up');

  driver.config({method:'send'}, function(response) {
    console.log('Driver config response', response);
  });
}, 500);
