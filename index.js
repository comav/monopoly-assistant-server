let express = require('express');

let app = express();

let path = require('path');
let RequestIp = require('@supercharge/request-ip');
let bodyParser = require('body-parser');

//app.use(bodyParser);

app.use(express.json());
app.use(express.urlencoded({extended:true}));

let lowdb = require('lowdb');
let FileSync = require('lowdb/adapters/FileSync');
let adapter = new FileSync('db.json');
let db = lowdb(adapter);

app.get('/newcard', async (req, res) => {
  let username = req.query.owner;
  console.log(username);
  let cardDB = await db.get("cards").find({owner: username}).value();
  console.log(cardDB);
  if (!cardDB) {
    let card = {
      owner: username,
      number: cardNumber(),
      network: cardNetwork(),
      balance: 100,
      design: random(0, 4)
    }
    db.get("cards").push(card).write();
    res.status('200');
    res.json({
      status: 200
    })
  } else {
    res.status('403');
    res.json({
      status: 403
    })
  }
})

app.get('/getcardinfo', express.json(), async (req, res) => {
  console.log(req.query);
  let user = await db.get("cards").find({owner: req.query.owner}).value();
  console.log(2, user);
  if (user) {
    res.json({
      number: user.number,
      network: user.network,
      balance: user.balance,
      design: user.design
    })
    // let cardNetworks = ['ProCard', 'ШИZA'];
    // let card = new Card(cardNetworks[Math.floor(Math.random() * cardNetworks.length)], cardNumber());
    // console.log(card);
    // res.json(card);
  } else {
    // let card = new Card(user.network, user.number);
    // console.log("An existing card was found & sent: " + card);
    // res.json(card);
    res.status(400);
    res.send("Theres no card for provided owner");
  }
  
});

app.get('/transaction', async (req, res) => {
  let sender = req.query.sender;
  let receiver = req.query.receiver;
  let amount = parseInt(req.query.amount);

  let senderData = await db.get("cards").find({number: sender}).value(); 
  let receiverData = await db.get("cards").find({number: receiver}).value();

  if (amount < 0) {
    res.status("400");
    res.send("Illegal operation");
    return;
  }

  if ((senderData.balance - amount) > -1) {
    let newBalance = senderData.balance - amount;
    await db.get("cards").find({number: sender}).assign({balance: newBalance}).write();
    await db.get("cards").find({number: receiver}).assign({balance: receiverData.balance + amount}).write();
    res.json({
      status: "Success"
    })
    console.log(`Moved ${amount} UAH from ${senderData.owner}'s card (${senderData.number}) to ${receiverData.owner}'s card (${receiverData.number})`);
  } else {
    res.status('400')
    res.send('Not enough money')
  }
})

var Card = function (network, number) {
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

function cardNetwork() {
  let networks = ['ProCard', 'ШИZA'];
  return networks[Math.floor(Math.random() * networks.length)];
}

function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}


app.listen(5502, () => {
  console.log(`App is started on port 5502`);
});