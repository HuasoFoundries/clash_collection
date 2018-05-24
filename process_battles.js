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


async function getBattlesFromAPI() {

    let t_ini = Date.now(),
        interval = setInterval(() => {
            debug('waiting for API response');
        }, 1000);

    const res = await fetch(`https://api.royaleapi.com/clan/${Config.CLAN_TAG}/battles?type=war&exclude=${excluded_fields.join(',')}`, {
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
    const battles_raw = await res.json();


    let total_time = Helpers.getTimeInSeconds(t_ini);

    await fs.writeFileAsync(`${__dirname}/dumps/battles_raw.json`, JSON.stringify(battles_raw, null, 4), 'utf-8');


    logger.info(`API answer complete in  ${chalk.red(total_time)} seconds`);


    return battles_raw;
}

async function cleanBattles(battles_raw) {

    const war_battles = _.chain(battles_raw).filter((battle) => {
        return (battle.type === 'clanWarCollectionDay' || battle.type === 'clanWarWarDay');
    }).map((battle) => {
        battle.team = _.map(battle.team, (player) => {
            return _.omit(player, ['deck', 'deckLink']);
        });
        battle.opponent = _.map(battle.opponent, (player) => {
            return _.omit(player, ['deck', 'deckLink']);
        });
        return battle;
    }).value();

    await fs.writeFileAsync(`${__dirname}/dumps/war_battles.json`, JSON.stringify(war_battles, null, 4), 'utf-8');

    let clean_battles = _.map(war_battles, (battle) => {
        battle.team = _.map(battle.team, (player) => {
            player.clan = _.omit(player.clan, ['badge']);
            player.clan_tag = player.clan.tag;
            player.clan_name = player.clan.name;
            return _.omit(player, ['deck', 'deckLink', 'clan']);
        });
        battle.opponent = _.map(battle.opponent, (player) => {
            player.clan = _.omit(player.clan, ['badge']);
            player.clan_tag = player.clan.tag;
            player.clan_name = player.clan.name;
            return _.omit(player, ['deck', 'deckLink', 'clan']);
        });


        return battle;
    });


    await fs.writeFileAsync(`${__dirname}/dumps/clean_battles.json`, JSON.stringify(clean_battles, null, 4), 'utf-8');
    return clean_battles;

}

function processBattles(clean_battles) {


    const CollectionDay = [];
    const WarDay = [];

    _.chain(clean_battles)
        .filter(function (battle) {
            return battle.team[0].clan_tag === Config.CLAN_TAG;
        })
        .each((battle) => {
            _.each(battle.team, (player) => {
                let dataObj = {
                    id: `${battle.utcTime}_${player.tag}`,
                    type: battle.type,
                    date: new Date(1000 * battle.utcTime).toISOString().split('.')[0] + 'Z',
                    player_tag: player.tag,
                    clan_tag: player.clan_tag,
                    player_name: player.name,
                    player_trophies: player.startTrophies || null,
                    winner: battle.winner,
                    team_crowns: battle.teamCrowns,
                    opponent_crowns: battle.opponentCrowns,
                    team_size: battle.teamSize,
                    opponent: battle.opponent[0].name,
                    opponent_trophies: battle.opponent[0].startTrophies || null,
                    opponent2: battle.opponent[1] ? battle.opponent[1].name : null,
                    opponent2_trophies: battle.opponent[1] ? battle.opponent[1].startTrophies || null : null,

                };
                if (battle.type === 'clanWarWarDay') {
                    WarDay.push(dataObj);
                } else {
                    CollectionDay.push(dataObj);
                }

            });
        }).value();

    return {
        CollectionDay,
        WarDay
    };

}

async function Main() {
    const battles_raw = await getBattlesFromAPI();

    const clean_battles = await cleanBattles(battles_raw);


    let {
        CollectionDay,
        WarDay
    } = processBattles(clean_battles);

    await Promise.all([
        Helpers.insertBattles(WarDay, 'war_day', logger),
        Helpers.insertBattles(CollectionDay, 'collection_day', logger),
        fs.writeFileAsync(`${__dirname}/dumps/WarDay.json`, JSON.stringify(WarDay, null, 4), 'utf-8'),
        fs.writeFileAsync(`${__dirname}/dumps/CollectionDay.json`, JSON.stringify(CollectionDay, null, 4), 'utf-8')
    ]);

    logger.info(`wrote ${WarDay.length} battles to WarDay.json`);
    logger.info(`wrote ${CollectionDay.length} battles to CollectionDay.json`);

    let total_time = Helpers.getTimeInSeconds(starting_time);
    logger.info(`${chalk.green(this_script)}  complete in ${chalk.red(total_time)} seconds`);
    return Helpers.exit();
}

Main();
