const Promise = require('bluebird'),
  _ = require('lodash'),
  path = require('path'),
  fs = Promise.promisifyAll(require("fs")),
  chalk = require('chalk'),
  winston = require('winston'),
  slug = require('slug'),
  Conn = require(`${__dirname}/db_connection.js`),
  Config = require(`${__dirname}/config.js`),
  winstonConfig = require(`${__dirname}/winston.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`);

/**
 * Utility functions and contacts, grouped in an object
 * @type {Object}
 */
const connInstance = new Conn(Config),
  db = connInstance.db;

/**
 * Genral Utility functions and constants, grouped in an object
 * @type {Object}
 */
const Helpers = {

  Conn: connInstance,
  db: db,

  pgp: connInstance.pgp,

  tini: new Date(),

  get tini_time() {
    return this.tini.getTime();
  },

  get memoryUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    return `${Math.round(used * 100) / 100} MB`;
  },

  getTimeInSeconds: function (starting_time) {
    return Math.round((Date.now() - starting_time) / 100) / 10;
  },

  insertWarlog: async function (wars, logger) {

    const table = new Helpers.pgp.helpers.TableName({
      table: 'war_log',
      schema: 'public'
    });

    const cs = new Helpers.pgp.helpers.ColumnSet([{
        name: 'id',
        prop: 'id'
      },
      {
        name: 'season',
        prop: 'season'
      },
      {
        name: 'guerra_numero',
        prop: 'guerra_numero'
      },
      {
        name: 'player_tag',
        prop: 'player_tag'
      },
      {
        name: 'player_name',
        prop: 'player_name'
      },
      {
        name: 'cards_earned',
        prop: 'cards_earned',
        def: 0
      },
      {
        name: 'battles_played',
        prop: 'battles_played',
        def: 0
      },
      {
        name: 'wins',
        prop: 'wins',
        def: 0
      },
      {
        name: 'player_count',
        prop: 'player_count',
        def: 0
      },
      {
        name: 'war_id',
        prop: 'war_id'
      }
    ], {
      table
    });
    const insertQuery = Helpers.pgp.helpers.insert(wars, cs) +
      " ON CONFLICT (id) DO UPDATE SET " +
      cs.columns.map(x => {
        var col = Helpers.pgp.as.name(x.name);
        return col + ' = EXCLUDED.' + col;
      }).join();

    return Helpers.db.none(insertQuery)
      .then(function () {

        logger.info(`inserted ${wars.length} records on war_log`);
        return;
      }).catch((err) => {
        debug(`error inserting on ${chalk.yellow.bold('war_log')}`);
        logger.error(err.stack);
        return;
      });
  },


  insertMembers: async function (members, logger) {


    const table = new Helpers.pgp.helpers.TableName({
      table: 'members',
      schema: 'public'
    });


    const cs = new Helpers.pgp.helpers.ColumnSet([{
        name: 'player_name',
        prop: 'name'
      },
      {
        name: 'player_tag',
        prop: 'tag'
      },
      {
        name: 'rank',
        prop: 'rank',
        def: null
      },
      {
        name: 'previous_rank',
        prop: 'previousRank',
        def: null
      },
      {
        name: 'role',
        prop: 'role',
        def: null
      },
      {
        name: 'exp_level',
        prop: 'expLevel',
        def: null
      },
      {
        name: 'trophies',
        prop: 'trophies',
        def: null
      },
      {
        name: 'donations_given',
        prop: 'donations',
        def: null
      },
      {
        name: 'donations_received',
        prop: 'donationsReceived',
        def: null
      }
    ], {
      table
    });
    const insertQuery = Helpers.pgp.helpers.insert(members, cs) +
      " ON CONFLICT (player_tag) DO UPDATE SET " +
      cs.columns.map(x => {
        var col = Helpers.pgp.as.name(x.name);
        return col + ' = EXCLUDED.' + col;
      }).join();

    return Helpers.db.none(insertQuery)
      .then(function () {

        logger.info(`inserted ${members.length} records on members`);
        return;
      }).catch((err) => {
        debug(`error inserting on ${chalk.yellow.bold('members')}`);
        logger.error(err.stack);
        return;
      });
  },

  insertBattles: async function (battles, tablename, logger) {


    const table = new Helpers.pgp.helpers.TableName({
      table: tablename,
      schema: 'public'
    });


    const cs = new Helpers.pgp.helpers.ColumnSet([{
        name: 'id',
        prop: 'id'
      },
      {
        name: 'type',
        prop: 'type'
      },
      {
        name: 'date',
        prop: 'date'
      },
      {
        name: 'player_tag',
        prop: 'player_tag'
      },
      {
        name: 'clan_tag',
        prop: 'clan_tag'
      },
      {
        name: 'player_name',
        prop: 'player_name'
      }
    ], {
      table
    });
    const insertQuery = Helpers.pgp.helpers.insert(battles, cs) +
      " ON CONFLICT (id) DO UPDATE SET " +
      cs.columns.map(x => {
        var col = Helpers.pgp.as.name(x.name);
        return col + ' = EXCLUDED.' + col;
      }).join();

    return Helpers.db.none(insertQuery)
      .then(function () {

        logger.info(`inserted ${battles.length} records on ${tablename}`);
        return;
      }).catch((err) => {
        debug(`error inserting on ${chalk.yellow.bold(tablename)}`);
        logger.error(err.stack);
        return;
      });
  },


  replaceBadEncoding: function (uglystring) {

    var niceString = uglystring.replace(/ß/g, "á")
      .replace(/Ú/g, "é")
      .replace(/Ý/g, "í")
      .replace(/¾/g, "ó")
      .replace(/·/g, "ú")
      .replace(/±/g, "ñ")
      .replace(/Ð/g, "Ñ");

    return niceString;
  },


  cleanOldFiles: async function (folder) {
    let files = await fs.readdirAsync(folder),
      result = {
        total: files.length,
        removed: 0,
        folder: folder
      };
    try {
      for (let file of files) {
        if (file === '.gitignore') {
          continue;
        }
        let stats = await fs.statAsync(path.resolve(`${folder}/${file}`)),
          age = parseInt((Date.now() - new Date(stats.mtime).getTime()) / 1000, 10);
        if (!stats.isFile()) {
          continue;
        } else if (age > 86400) {
          await fs.unlinkAsync(path.resolve(`${folder}/${file}`));
          result.removed++;
        }

      }
    } catch (err) {
      debug('error cleanOldFiles', err);
    }
    return result;

  },

  /**
   * Event listener for HTTP server "error" event.
   * @param {Error} error the error
   * @param {Object} logger winston logger instance
   * @param {number|string}  port the port used by the app
   *
   * @return {void}
   */
  onError: function (error, logger, port) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string' ?
      'Pipe ' + port :
      'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      Helpers.exit();
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      Helpers.exit();
      break;
    default:
      throw error;
    }
  },

  /**
   * Event listener for HTTP server "listening" event.
   * @param {Object} server instance of http server
   * @param {Object} logger instance of winston logger
   *
   * @return {void}
   */
  onListening: function (server, logger) {
    var addr = server.address();
    var bind = typeof addr === 'string' ?
      'pipe ' + addr :
      'port ' + addr.port;
    logger.info('Listening on ' + bind + ' node env is', process.env.NODE_ENV);
  },

  /**
   * Transform a Date object to text in format YYYY-MM-DD hh:mm:ss
   * @param  {Date} date Date object
   * @return {string} text in format YYYY-MM-DD hh:mm:ss
   */
  dateToNiceText: function (date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    var date_nice = date.toISOString().split(/[T|.]/);
    date_nice = date_nice[0] + ' ' + date_nice[1];
    return date_nice;
  },

  /* beautify preserve:start */
  createLogger: function (logfile) {
    var loggerConfig = winstonConfig.buildConfig(logfile);
    var logger = new (winston.Logger)(loggerConfig);

    return logger;
  },
  /* beautify preserve:end */

  /**
   * Method for cleaning special chars
   * @param  {String} str   source string
   * @return {String}        Clean string
   */
  cleanString: function (str) {
    var cleanstr = String(str).replace(/[,.\-& ]/g, '_');
    cleanstr = cleanstr.replace(/"/g, '');
    cleanstr = cleanstr.replace(/[ÀÁÂÃÄÅ]/g, "A");
    cleanstr = cleanstr.replace(/[àáâãäå]/g, "a");
    cleanstr = cleanstr.replace(/[ÈÉÊË]/g, "E");
    cleanstr = cleanstr.replace(/[é]/g, "e");
    cleanstr = cleanstr.replace(/[Í]/g, "I");
    cleanstr = cleanstr.replace(/[í]/g, "i");
    cleanstr = cleanstr.replace(/[Ó]/g, "O");
    cleanstr = cleanstr.replace(/(ó|ó)/g, "o");
    cleanstr = cleanstr.replace(/[Ú]/g, "U");
    cleanstr = cleanstr.replace(/[ú]/g, "u");
    cleanstr = cleanstr.replace(/[Ñ]/g, "N");
    cleanstr = cleanstr.replace(/[ñ]/g, "n");
    cleanstr = cleanstr.replace(/(__)+/g, '_');

    cleanstr = cleanstr.replace(/'/g, '');
    return cleanstr;
  },

  /**
   * Closes the connection with the DDBB
   *
   * @return {Promise}  returns a promise that fullfills when the connection is closed
   */
  closeConnection: function () {
    return Promise.resolve().then(function () {
      return Helpers.Conn.closeConnection();
    }).then(function () {
      debug('Closed DB Connection');
      return;
    });
  },

  /**
   * Used to end a CLI script. Closes the DDBB connection before exiting
   *
   * @param {string} signal SIGTERM, SIGKILL, SIGUSR2, etc
   *
   * @return {Promise}  a promise that fullfills when the process is killed with signal 1
   */
  exit: _.once((signal) => {
    if (signal) {
      Helpers.logger.info(`received ${signal}`);
    } else {
      Helpers.logger.info('Received exit command');
    }

    return Promise.delay(300)
      .then(function () {
        return Helpers.closeConnection();
      })
      .delay(500)
      .then(function () {
        clearInterval(Config.filestore_options.reapIntervalObject);
        return debug('calling process.exit(0)');
      }).delay(200)
      .then(function () {
        return process.exit(0);
      }).catch((err) => {
        debug(err);
        return Promise.delay(300).then(() => {
          return process.exit(0);
        });

      });
  }, 200),
}; // end of Helpers

Helpers.logger = Helpers.createLogger(this_script);

module.exports = Helpers;
