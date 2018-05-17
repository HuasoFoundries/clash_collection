var express = require('express'),
	router = express.Router(),
	_ = require('lodash'),
	sqlite = require('sqlite'),
	Promise = require('bluebird'),
	Config = require(`${__dirname}/../config/config.js`),
	Helpers = require(`${__dirname}/../config/helpers.js`),
	path = require('path'),
	chalk = require('chalk'),
	this_script = path.basename(__filename, path.extname(__filename)),
	debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`),
	logger = Helpers.createLogger(this_script),
	fetch = require('node-fetch');

let dbPromise = sqlite.open('./cards.sqlite3', {
	Promise,
	cached: true
});

let insert_cards_stmt = `INSERT OR REPLACE INTO cards (
	id,	name,	icon,	key,	rarity,	elixir,	type,	arena,	description) 
	VALUES (?, ?,	?,	?,	?,	?,	?,	?,	?	);`,
	insert_player_cards = `INSERT OR REPLACE INTO player_cards 
	(id,player_tag,card_id, card_key,level, count, required_for_upgrade, left_to_upgrade)
	VALUES (?,?,?,?,?,?,?,?);`,
	insert_player = `INSERT OR REPLACE INTO player (tag,name) VALUES (?,?)`;


/* GET users listing. */
router.get('/', function (req, res, next) {
	res.json({
		result: 'respond with a resource'
	});
});

async function getResponse(playertag) {

	const res = await fetch(`https://api.royaleapi.com/player/${playertag}`, {
		method: 'GET',
		headers: {
			// 'cache-control': 'no-cache',
			'auth': Config.ROYALE_AUTH // eslint-disable-line
		},
	});
	let time_until_reset = Math.abs(Helpers.getTimeInSeconds(res.headers.get('x-ratelimit-reset')));
	debug(`API ${chalk.green('request limit')} is ${chalk.red(res.headers.get('x-ratelimit-limit'))} requests/second`);
	debug(`${chalk.red(res.headers.get('x-ratelimit-remaining'))} ${chalk.green('remaining requests')} for the next ${chalk.red(time_until_reset)} seconds`); // eslint-disable-line

	let player = await res.json();

	return player;
}

async function insertCards(jsonres) {

	dbPromise.then((db) => {
		debug('DB is Open');
	});


	let db = await dbPromise,
		player_insertion = await db.run(insert_player, jsonres.tag, jsonres.name),
		stmt = await db.prepare(insert_cards_stmt);


	_.each(jsonres.cards, (card) => {
		stmt.run(card.id, card.name, card.icon, card.key, card.rarity, card.elixir, card.type, card.arena, card.description);
		debug(`upserting card ${card.key} into cards table`);
	});

	await stmt.finalize();

	let stmt2 = await db.prepare(insert_player_cards);

	_.each(jsonres.cards, (card) => {
		stmt2.run(jsonres.tag + '|' + card.id, jsonres.tag, card.id, card.key, card.level, card.count, card.requiredForUpgrade, card.leftToUpgrade);
		debug(`upserting card ${card.key} for player ${jsonres.tag} into player_cards table`);
	});

	await stmt2.finalize();


	return;

}

/* beautify preserve:start */
router.get('/:playertag', async (req, res, next) => {
/* beautify preserve:end */
	var playertag = req.params.playertag;
	try {
		let jsonres = await getResponse(playertag);

		await insertCards(jsonres);

		res.json(_.pick(jsonres, [
			'tag', 'name', 'trophies', 'games', 'chestCycle', 'cards'
		]));
	} catch (err) {
		debug('cr-api ERROR');
		_.each(err, (content, key) => {
			debug(`${key} : ${content}`);
		});
		res.send(err.error);
	}
});

/* beautify preserve:start */
router.get('/cards/:playertag', async (req, res, next) => {
/* beautify preserve:end */
	var playertag = req.params.playertag;
	try {

		dbPromise.then((db) => {
			debug('DB is Open');
		});


		let db = await dbPromise,
			cards = await db.all(
				`SELECT 
				cards.name,
				cards.icon,
				cards.rarity,
				cards.elixir,
				cards.type,
				player_cards.level, 
				player_cards.required_for_upgrade 
				FROM player
				JOIN player_cards ON player.tag = player_cards.player_tag
				JOIN cards ON cards.id = player_cards.card_id
				WHERE player.tag=?`,
				playertag);

		_.each(cards, (card) => {
			if (
				(card.rarity === 'Epic' && card.level < 4) ||
				(card.rarity === 'Rare' && card.level < 7) ||
				(card.rarity === 'Common' && card.level < 9)
			) {
				card.comment = 'Below tournament standard';
				card.tournament = 'below';
			} else if (
				(card.rarity === 'Legendary' && card.level > 1) ||
				(card.rarity === 'Epic' && card.level > 4) ||
				(card.rarity === 'Rare' && card.level > 7) ||
				(card.rarity === 'Common' && card.level > 9)
			) {
				card.comment = 'Above tournament standard';
				card.tournament = 'above';
			} else {
				card.comment = 'On tournamet standard';
				card.tournament = 'pair';
			}
		});

		res.render('cards', {
			cards: cards
		});

	} catch (err) {
		debug('ERROR requesting player cards');
		_.each(err, (content, key) => {
			debug(`${key} : ${content}`);
		});
		res.send(err.error);
	}
});

debug('Route users ready');
module.exports = router;
