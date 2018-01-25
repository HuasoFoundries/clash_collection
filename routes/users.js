var express = require('express'),
	router = express.Router(),
	chalk = require('chalk'),
	_ = require('lodash'),
	sqlite = require('sqlite'),
	Promise = require('bluebird'),
	dbPromise = sqlite.open('./cards.sqlite3', {
		Promise,
		cached: true
	}),
	rp = require('request-promise'),
	debug = require('debug')('CR:users'),
	env = process.env; // eslint-disable-line no-process-env


dbPromise.then((db) => {
	debug('DB is Open');
	debug('API KEY IS ', env.API_KEY);
	db.close();
});

let insert_cards_stmt = `INSERT OR REPLACE INTO CARDS (
	id,
	name,
	icon,
	key,
	rarity,
	elixir,
	type,
	arena,
	description) 
VALUES (
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?
	);`;

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.json({
		result: 'respond with a resource'
	});
});

async function getResponse(playertag) {
	var authOption = {
			method: 'GET',
			url: `http://api.cr-api.com/player/${playertag}`,
			headers: {
				'cache-control': 'no-cache',
				auth: env.API_KEY
			}
		},
		response = await rp(authOption);
	let typeofres = typeof response,
		jsonres = typeofres === 'string' ? JSON.parse(response) : response;
	debug('Type of response is', typeofres);


	return jsonres;
}

async function insertCards(cards) {
	let db = await dbPromise,
		stmt = await db.prepare(insert_cards_stmt);


	_.each(cards, (card) => {
		stmt.run(card.id, card.name, card.icon, card.key, card.rarity, card.elixir, card.type, card.arena, card.description);
		debug(card);
	});

	await stmt.finalize();
	return;

}

/* beautify preserve:start */
router.get('/:playertag', async (req, res, next) => {
/* beautify preserve:end */
	var playertag = req.params.playertag;
	try {
		let jsonres = await getResponse(playertag);
		await insertCards(jsonres.cards);

		res.json(jsonres.cards);
	} catch (err) {
		debug('cr-api ERROR');
		_.each(err, (content, key) => {
			debug(`${key} : ${content}`);
		});
		res.send(err.error);
	}
});

debug('Route users ready');
module.exports = router;
