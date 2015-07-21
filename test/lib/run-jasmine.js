/*globals require:true, phantom:true, console:true*/
var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 10001, //< Default Max Timeout is 3s
    start = new Date().getTime(),
    condition = false,
    interval = setInterval(function () {
      if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
        // If not time-out yet and condition not yet fulfilled
        condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
      } else {
        if (!condition) {
          // If condition still not fulfilled (timeout but condition is 'false')
          console.log("'Timeout");
          phantom.exit(1);
        } else {
          // Condition fulfilled (timeout and/or condition is 'true')
          console.log("Finished in " + (new Date().getTime() - start) + "ms.");
          typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
          clearInterval(interval); //< Stop this interval
        }
      }
    }, 100); //< repeat check every 100ms
}


if (system.args.length !== 2) {
  console.log('Usage: run-jasmine.js URL');
  phantom.exit(1);
}

var page = require('webpage').create();
var finished = false;
var failures = 0;
// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function (msg) {
  console.log(msg);
  if (msg.match(/Finished in \d+ seconds/)) {
    finished = true;
  }
  var exec = /\d+ specs*, (\d+) failures*/.exec(msg);
  if (exec) {
    failures = exec[1];
  }
};

page.open(system.args[1], function (status) {
  waitFor(function () {
    return finished;
  }, function () {
    console.log(failures + ' failed tests');
    phantom.exit(failures);
  });
});