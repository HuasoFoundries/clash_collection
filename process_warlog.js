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
    argv = require('minimist')(process.argv.slice(2));


async function getWarsFromAPI() {

    let t_ini = Date.now(),
        interval = setInterval(() => {
            debug('waiting for API response');
        }, 1000);

    const res = await fetch(`https://api.royaleapi.com/clan/${Config.CLAN_TAG}/warlog`, {
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
    let wars_raw = await res.json();

    wars_raw = _.map(wars_raw, (war) => {
        war.standings = _.map(war.standings, (standings) => {
            return standings.tag;
        });
        war.place = war.standings.indexOf(Config.CLAN_TAG) + 1;
        return _.omit(war, ['standings']);
    });
    let total_time = Helpers.getTimeInSeconds(t_ini);

    await fs.writeFileAsync(`${__dirname}/dumps/wars_raw.json`, JSON.stringify(wars_raw, null, 4), 'utf-8');


    logger.info(`API answer complete in  ${chalk.red(total_time)} seconds`);
    logger.info(`Wrote ${chalk.red(wars_raw.length)} wars to ${chalk.green('wars_raw.json')}`);

    return wars_raw;
}

async function getWarsFromFile() {
    debug('getting wars from file');
    const wars_raw = require(`${__dirname}/dumps/wars_raw.json`);
    logger.info(`Read ${chalk.red(wars_raw.length)} wars from ${chalk.green('wars_raw.json')}`);
    return wars_raw;
}


async function processWarlog(wars_raw) {

    let groupedBattles = _.groupBy(wars_raw, 'seasonNumber'),
        clean_warlog = [],
        total_wars = 0,
        clean_wars = [];

    await fs.writeFileAsync(`${__dirname}/dumps/groupedBattles.json`, JSON.stringify(groupedBattles, null, 4), 'utf-8');


    _.each(groupedBattles, (wars, season) => {
        let season_wars = wars.length;
        total_wars = total_wars + 1 * season_wars;
        _.each(wars, (war, index) => {

            war.player_count = war.participants.length;
            war.season = war.seasonNumber;
            war.created_at = new Date(1000 * war.createdDate).toISOString().split('.')[0] + 'Z';
            war.war_id = war.created_at.split('T')[0];

            let clean_war = _.omit(war, ['participants', 'seasonNumber', 'createdDate', 'standings']);
            clean_wars.push(clean_war);
            _.each(war.participants, (player) => {

                clean_warlog.push(_.extend({
                    id: clean_war.war_id + '_' + player.tag,
                    player_tag: player.tag,
                    player_name: player.name,
                    battles_played: player.battlesPlayed,
                    cards_earned: player.cardsEarned,
                    wins: player.wins
                }, clean_war));
            });
        });
    });


    logger.info(`Wrote ${chalk.red(total_wars)} wars to ${chalk.green('groupedBattles.json')}`);

    return {
        clean_wars,
        clean_warlog
    };

}

async function Main() {
    const wars_raw = await (argv.from_file ? getWarsFromFile() : getWarsFromAPI());

    const {
        clean_wars,
        clean_warlog
    } = await processWarlog(wars_raw);

    let the_promises = [
        fs.writeFileAsync(`${__dirname}/dumps/clean_warlog.json`, JSON.stringify(clean_warlog, null, 4), 'utf-8'),
        fs.writeFileAsync(`${__dirname}/dumps/clean_wars.json`, JSON.stringify(clean_wars, null, 4), 'utf-8')
    ];


    if (!argv.from_file) {
        the_promises = the_promises.concat([
            Helpers.insertClanWars(clean_wars, logger),
            Helpers.insertWarlog(clean_warlog, logger),
        ]);
    }
    await Promise.all(the_promises);

    logger.info(`Wrote ${chalk.red(clean_warlog.length)} battles to ${chalk.green('clean_warlog.json')}`);
    logger.info(`Wrote ${chalk.red(clean_wars.length)} wars to ${chalk.green('clean_wars.json')}`);

    let total_time = Helpers.getTimeInSeconds(starting_time);
    logger.info(`${chalk.green(this_script)}  complete in ${chalk.red(total_time)} seconds`);
    return Helpers.exit();
}

Main();
