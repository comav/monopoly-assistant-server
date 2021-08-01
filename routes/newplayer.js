let express = require('express');
let app = express();

let lowdb = require('lowdb');
let FileSync = require('lowdb/adapters/FileSync');
let adapter = new FileSync('db.json');
let db = lowdb(adapter);

app.get('/newplayer', (req, res) => {
    db.set('users');
})