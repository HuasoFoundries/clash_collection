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
    starting_time = Date.now(),
    excluded_fields = ['arena', 'mode', 'challengeType', 'winCountBefore', 'deckType'];


async function getWarsFromAPI() {

    let t_ini = Date.now(),
        interval = setInterval(() => {
            debug('waiting for API response');
        }, 1000);

    const res = await fetch(`https://api.royaleapi.com/clan/${Config.CLAN_TAG}/warlog?&exclude=standings`, {
        method: 'GET',
        headers: {
            'cache-control': 'no-cache',
            'auth': Config.ROYALE_AUTH // eslint-disable-line
        },
    });
    let time_until_reset = Math.abs(Helpers.getTimeInSeconds(res.headers.get('x-ratelimit-reset')));
    debug(`API ${chalk.green('request limit')} is ${chalk.red(res.headers.get('x-ratelimit-limit'))} requests/second`);
    debug(`${chalk.red(res.headers.get('x-ratelimit-remaining'))} ${chalk.green('remaining requests')} for the next ${chalk.red(time_until_reset)} seconds`); // eslint-disable-line

    clearInterval(interval);
    const wars_raw = await res.json();


    let total_time = Helpers.getTimeInSeconds(t_ini);

    await fs.writeFileAsync(`${__dirname}/dumps/wars_raw.json`, JSON.stringify(wars_raw, null, 4), 'utf-8');


    logger.info(`API answer complete in  ${chalk.red(total_time)} seconds`);


    return wars_raw;
}

async function processWarlog(wars_raw) {

    let groupedBattles = _.groupBy(wars_raw, 'seasonNumber'),
        clean_warlog = [];

    await fs.writeFileAsync(`${__dirname}/dumps/groupedBattles.json`, JSON.stringify(groupedBattles, null, 4), 'utf-8');


    _.each(groupedBattles, (wars, season) => {
        let total_wars = wars.length;
        _.each(wars, (war, index) => {

            war.guerra_numero = total_wars - index;
            war.war_id = _.padStart(season, 3, '0') + '_' + _.padStart(war.guerra_numero, 2, '0');
            war.player_count = war.participants.length;
            war.season = war.seasonNumber;

            let war_stats = _.omit(war, ['participants', 'seasonNumber']);
            _.each(war.participants, (player) => {

                clean_warlog.push(_.extend({
                    id: war_stats.war_id + '_' + player.tag,
                    player_tag: player.tag,
                    player_name: player.name,
                    battles_played: player.battlesPlayed,
                    cards_earned: player.cardsEarned,
                    wins: player.wins
                }, war_stats));
            });
        });
    });
    return clean_warlog;

}

async function Main() {
    const wars_raw = await getWarsFromAPI();

    const clean_warlog = await processWarlog(wars_raw);


    await Promise.all([
        Helpers.insertWarlog(clean_warlog, logger),
        fs.writeFileAsync(`${__dirname}/dumps/clean_warlog.json`, JSON.stringify(clean_warlog, null, 4), 'utf-8')
    ]);

    logger.info(`wrote ${clean_warlog.length} battles to clean_warlog.json`);

    let total_time = Helpers.getTimeInSeconds(starting_time);
    logger.info(`${chalk.green(this_script)}  complete in ${chalk.red(total_time)} seconds`);
    return Helpers.exit();
}

Main();
