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


async function getMembersFromAPI() {

    let interval = setInterval(() => {
        debug('waiting for API response');
    }, 1000);

    const res = await fetch('https://api.royaleapi.com/clan/88VLLOJJ', {
        method: 'GET',
        headers: {
            'auth': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzY2LCJpZGVuIjoiNDAxNDQwOTQ3NzkzMTY2MzM2IiwibWQiOnt9fQ.Ig7Rd_zovu4U0hGOIzXic5Pwy-xoHL3vNpBMqIs1M0M' // eslint-disable-line
        },
    });
    const clan = await res.json();

    await fs.writeFileAsync(`${__dirname}/dumps/members.json`, JSON.stringify(clan.members, null, 4), 'utf-8');

    clearInterval(interval);
    return clan.members;
}

async function Main() {
    const members = await getMembersFromAPI();

    return Helpers.insertMembers(members, logger)
        .then(() => {
            return Helpers.exit();
        });
}

Main();
