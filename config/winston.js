var chalk = require('chalk');
var winston = require('winston');

var buildConfig = function (logfile) {
  var consoleTransportConfig = {
    timestamp: function () {
      return new Date().toISOString();
    },
    formatter: function (opts) {
      return opts.timestamp() + ' ' +
        chalk.cyan(opts.level.toUpperCase()) + ' ' +
        chalk.yellow(opts.message) +
        (opts.meta && Object.keys(opts.meta).length ? '\n\t' + JSON.stringify(opts.meta) : '');
    },
  };
  /* beautify preserve:start */
  var consoleTransport = new (winston.transports.Console)(consoleTransportConfig);

  var fileTransportConfig = {
    dirname: `${__dirname}/../logs`,
    filename: `${logfile}.log`,
    maxsize: 1 * 1024 * 1024, // in bytes
    maxFiles: 7,
    tailable: true,
    json: false,
    timestamp: function () {
      return new Date().toISOString();
    },
    formatter: function (opts) {
      // Return string will be passed to logger.
      return opts.timestamp() + ' ' + opts.level.toUpperCase() + ' ' +
        (undefined !== opts.message ? opts.message : '') +
        (opts.meta && Object.keys(opts.meta).length ? '\n\t' + JSON.stringify(opts.meta) : '');
    },
  };

  var fileTransport = new (winston.transports.File)(fileTransportConfig);
  /* beautify preserve:end */
  var loggerConfig = {
    level: 'debug',
    transports: [
      consoleTransport,
      fileTransport,
    ],
    /*
    filters:   [
      function (level, msg, meta) {
        var current_date = new Date().toISOString();
        return current_date + ' ' + level.toUpperCase() + ' ' + msg;
      }
    ],
    */
  };

  return loggerConfig;
};

exports.buildConfig = buildConfig;
