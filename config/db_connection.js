const pgpLib = require('pg-promise');
const Promise = require('bluebird');
const path = require('path');

const this_script = path.basename(__filename, path.extname(__filename));


const pgOptions = {
	promiseLib: Promise,
	capSQL: true
};
const pgp = pgpLib(pgOptions);

const Conn = function (Config) {
	const debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`);
	debug('connected to database');
	const _this = this;
	this.pgp = pgp;
	this.db = pgp(Config.pgConfig);

	this.closeConnection = function () {
		debug('closing connection');
		return pgp.end();
	};

	return this;
};

module.exports = Conn;
