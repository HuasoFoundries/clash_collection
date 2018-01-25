BEGIN TRANSACTION;
CREATE TABLE `player_cards` (
	`id`	TEXT,
	`player_tag`	TEXT,
	`card_id`	INTEGER,
	`level`	INTEGER,
	`count`	INTEGER,
	`required_for_upgrade`	INTEGER,
	`left_to_upgrade`	INTEGER,
	PRIMARY KEY(`id`),
	FOREIGN KEY(`player_tag`) REFERENCES player(tag),
	FOREIGN KEY(`card_id`) REFERENCES card(id)
);
CREATE TABLE `player` (
	`tag`	TEXT,
	`name`	TEXT,
	PRIMARY KEY(`tag`)
);
CREATE TABLE "cards" (
	`id`	INTEGER,
	`name`	TEXT,
	`icon`	TEXT,
	`key`	TEXT,
	`rarity`	TEXT,
	`elixir`	INTEGER,
	`type`	TEXT,
	`arena`	INTEGER,
	`alias`	TEXT,
	`description`	TEXT,
	PRIMARY KEY(`id`)
);
COMMIT;
