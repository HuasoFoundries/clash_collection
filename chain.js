/**
 * Shows how to use chaining rather than the `serialize` method.
 */
"use strict";

var sqlite = require('sqlite'),
    _ = require('lodash'),
    debug = require('debug')('CR:chain'),
    Promise = require('bluebird'),
    dbPromise = sqlite.open('./chain.sqlite3', {
        Promise
    });

var db;

function closeDb() {
    console.log("closeDb");
    db.close();
}

function readAllRows() {
    console.log("readAllRows lorem");
    db.each("SELECT rowid , info,id FROM lorem2").then((row, index, total) => {
            console.log(row, index, total);
        }).then((algo) => {
            return closeDb();
        })
        .catch((err) => {
            console.log('ERROR', err);
            return closeDb();
        });
}

function insertRows() {
    console.log("insertRows Ipsum i");
    db.prepare("INSERT INTO lorem2 (info,id) VALUES (?,?)").then((stmt) => {
        for (var i = 0; i < 10; i++) {
            stmt.run("Ipsum " + i, i);
        }

        return stmt.finalize().then(readAllRows);
    });


}

function createTable() {
    console.log("createTable lorem");
    return db.run("CREATE TABLE IF NOT EXISTS lorem2 (info TEXT, id INTEGER)").then(insertRows);
}


function runChainExample() {
    return dbPromise.then((dbInstance) => {
        db = dbInstance;
        return createTable();
    });
}

runChainExample();
