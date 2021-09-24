let express = require('express');

let app = express();

let path = require('path');
let random = require('random');
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
      balance: 100
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
      balance: user.balance
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

  if ((senderData.balance - amount) > -1) {
    let newBalance = senderData.balance - amount;
    await db.get("cards").find({number: sender}).assign({balance: newBalance}).write();
    await db.get("cards").find({number: receiver}).assign({balance: receiverData.balance + amount}).write();
    res.json({
      status: "Success"
    })
  } else {
    res.status('400')
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

app.listen(5502, () => {
  console.log(`App is started on port 5502`);
});