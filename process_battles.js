/**
 * Shows how to use chaining rather than the `serialize` method.
 */
"use strict";

var _ = require('lodash'),
    Config = require(`${__dirname}/config/config.js`),
    path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require("fs")),
    Helpers = require(`${__dirname}/config/helpers.js`),
    logger = Helpers.createLogger(this_script),
    fetch = require('node-fetch');


async function getBattlesFromAPI() {

    let interval = setInterval(() => {
        debug('waiting for API response');
    }, 1000);

    const res = await fetch('https://api.royaleapi.com/clan/88VLLOJJ/battles?type=all', {
        method: 'GET',
        headers: {
            'auth': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzY2LCJpZGVuIjoiNDAxNDQwOTQ3NzkzMTY2MzM2IiwibWQiOnt9fQ.Ig7Rd_zovu4U0hGOIzXic5Pwy-xoHL3vNpBMqIs1M0M' // eslint-disable-line
        },
    });
    const battles_raw = await res.json();

    await fs.writeFileAsync(`${__dirname}/dumps/battles_raw.json`, JSON.stringify(battles_raw, null, 4), 'utf-8');

    clearInterval(interval);
    return battles_raw;
}

function processBattles(battles_raw) {

    const battles_without_deck = _.map(battles_raw, (battle) => {
        battle.team = _.map(battle.team, (team) => {
            team.clan = _.omit(team.clan, ['badge']);
            team.clantag = team.clan.tag;
            return _.omit(team, ['deck', 'deckLink', 'crownsEarned', 'startTrophies', 'clan']);
        });


        return _.omit(battle, ['opponent', 'arena', 'mode', 'challengeType', 'winCountBefore']);
    });

    const CollectionDay = [];
    const WarDay = [];

    _.chain(battles_without_deck)
        .filter(function (battle) {
            return (battle.type === 'clanWarCollectionDay' || battle.type === 'clanWarWarDay') &&
                battle.team[0].clantag === '88VLL0JJ';
        })
        .each((battle) => {
            _.each(battle.team, (player) => {
                let dataObj = {
                    id: `${battle.utcTime}_${player.tag}`,
                    type: battle.type,
                    date: new Date(1000 * battle.utcTime).toISOString().split('.')[0] + 'Z',
                    player_tag: player.tag,
                    clan_tag: player.clantag,
                    player_name: player.name
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

    let {
        CollectionDay,
        WarDay
    } = processBattles(battles_raw);

    return Helpers.insertBattles(WarDay, 'war_day', logger)
        .then(() => {
            return Helpers.insertBattles(CollectionDay, 'collection_day', logger);
        }).then(() => {
            console.log(`will write ${WarDay.length} battles to WarDay.json`);
            return fs.writeFileAsync(`${__dirname}/dumps/WarDay.json`, JSON.stringify(WarDay, null, 4), 'utf-8');
        }).then(() => {
            console.log('wrote file WarDay.json');
            console.log(`will write ${CollectionDay.length} battles to CollectionDay.json`);
            return fs.writeFileAsync(`${__dirname}/dumps/CollectionDay.json`, JSON.stringify(CollectionDay, null, 4), 'utf-8');
        }).then(() => {
            console.log('wrote file CollectionDay.json');
            return Helpers.exit();
        });
}

Main();
