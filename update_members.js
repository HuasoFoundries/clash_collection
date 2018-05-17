/**
 * Shows how to use chaining rather than the `serialize` method.
 */
"use strict";

var _ = require('lodash'),
    Config = require(`${__dirname}/config/config.js`),
    path = require('path'),
    chalk = require('chalk'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require("fs")),
    Helpers = require(`${__dirname}/config/helpers.js`),
    logger = Helpers.createLogger(this_script),
    fetch = require('node-fetch'),
    starting_time = Date.now();


async function getClanFromAPI() {

    let t_ini = Date.now(),
        interval = setInterval(() => {
            debug('waiting for API response');
        }, 500);

    const res = await fetch(`https://api.royaleapi.com/clan/${Config.CLAN_TAG}`, {
        method: 'GET',
        headers: {
            'auth': Config.ROYALE_AUTH // eslint-disable-line
        },
    });
    let time_until_reset = Math.abs(Helpers.getTimeInSeconds(res.headers.get('x-ratelimit-reset')));
    debug(`API ${chalk.green('request limit')} is ${chalk.red(res.headers.get('x-ratelimit-limit'))} requests/second`);
    debug(`${chalk.red(res.headers.get('x-ratelimit-remaining'))} ${chalk.green('remaining requests')} for the next ${chalk.red(time_until_reset)} seconds`); // eslint-disable-line


    let clan = await res.json();

    clan = _.omit(clan, ['clanChest', 'badge', 'location']);
    clan.members = _.map(clan.members, (member) => {
        return _.omit(member, ['clanChestCrowns', 'arena']);
    });

    await fs.writeFileAsync(`${__dirname}/dumps/clan.json`, JSON.stringify(clan, null, 4), 'utf-8');

    await fs.writeFileAsync(`${__dirname}/dumps/members.json`, JSON.stringify(clan.members, null, 4), 'utf-8');

    let total_time = Helpers.getTimeInSeconds(t_ini);
    logger.info(`API answer complete in  ${chalk.red(total_time)} seconds`);
    clearInterval(interval);
    return clan;
}

async function Main() {
    const clan = await getClanFromAPI();

    await Helpers.insertMembers(clan.members, logger);


    let total_time = Helpers.getTimeInSeconds(starting_time);
    logger.info(`${chalk.green(this_script)}  complete in ${chalk.red(total_time)} seconds`);
    return Helpers.exit();

}

Main();
