let express = require('express');

let path = require('path');
let random = require('random');
let RequestIp = require('@supercharge/request-ip');

let app = express();

let lowdb = require('lowdb');
let FileSync = require('lowdb/adapters/FileSync');
let adapter = new FileSync('db.json');
let db = lowdb(adapter);

app.get('/newplayer', (req, res) => {
    db.set('users');
})

app.get('/getcardinfo', (req, res) => {
    let cardNetworks = ['ProCard', 'ШИZA'];
    let card = new Card(cardNetworks[Math.floor(Math.random() * cardNetworks.length)], cardNumber());
    console.log(card);
    res.json(card);
});

var Card = function(network, number) {
    this.network = network;
    this.number = number;
};

function cardNumber() {
    let generatedNumber = '9';
    let numbers = '1234567890';
    for (let i = 0; i < 18; i++) {
        switch (i) {
            case 3:
            case 8:
            case 13:
                generatedNumber += ' ';
                break;
            default:
                generatedNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
    }
    return generatedNumber;
}

app.listen(5502, () => {
    console.log(`App is started on port 5502`);
});