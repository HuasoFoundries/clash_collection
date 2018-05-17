const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname + '/../.env'),
  silent: false
});

const env = process.env; // eslint-disable-line no-process-env

const Config = {
  DEBUG_PREFIX: env.DEBUG_PREFIX,
  ROYALE_AUTH: env.ROYALE_AUTH,
  CLAN_TAG: env.CLAN_TAG,
  session_opts: {
    secret: env.SESSION_SECRET,
    saveUninitialized: true,
    proxy: true,
    resave: false,
    cookie: {
      //maxAge: 7200 * 1000,
      httpOnly: false
    }
  },
  filestore_options: {
    ttl: 7200,
    path: path.resolve(`${__dirname}/../${env.SESSION_STORE_LOCATION}`),
    reapIntervalObject: {}
  },
  pgConfig: {
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT || 5432,
    max: env.DATABASE_POOL_SIZE_MAX || 10,
    // How long a client is allowed to remain idle before being closed:
    idleTimeoutMillis: (env.DATABASE_IDLE_TIMEOUT || 30) * 1000,
  }

};

module.exports = Config;
