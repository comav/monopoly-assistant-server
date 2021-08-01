let express = require('express');
let app = express();

app.get('/newcard', (req, res) => {
    let cardNetworks = ['ProCard', 'ШИZA'];
    let card = new Card(cardNetworks[Math.floor(Math.random() * cardNetworks.length)], cardNumber());
    console.log(card);
    res.send(card);
});

var Card = function(network, number) {
    this.network = network;
    this.number = number;
};

function cardNumber() {
    let generatedNumber = '9';
    let numbers = '1234567890';
    for (let i = 0; i < 15; i++) {
        generatedNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return generatedNumber;
}