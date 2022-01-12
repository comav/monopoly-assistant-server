let express = require('express');

let app = express();

let cors = require('cors');
let qrcode = require('qrcode');
let https = require('https');
let fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

let lowdb = require('lowdb');
let FileSync = require('lowdb/adapters/FileSync');
let adapter = new FileSync('db.json');
let db = lowdb(adapter);

// Database events docs
// Event {
//  eventTime: current time
//  eventType: newCard || transaction || bankTransaction || getCardData
//  eventInfo: additional info
// }
//
// Every Event child is a string

app.get('/newcard', async (req, res) => {
  let username = req.query.owner;
  console.log(username);
  let cardDB = await db.get("cards").find({ owner: username }).value();
  console.log(cardDB);
  if (!cardDB) {
    let card = {
      owner: username,
      number: cardNumber(),
      network: cardNetwork(),
      balance: 100,
      design: random(0, 5)
    }
    db.get("cards").push(card).write();
    res.status('200');
    res.json({
      status: 200
    })
    let event = {
      eventTime: getCurrentTime(),
      eventType: 'newCard',
      eventInfo: card.owner
    }
    db.get("events").push(event).write();
  } else {
    res.status('403');
    res.json({
      status: 403
    })
  }
})

app.get('/getcardinfo', express.json(), async (req, res) => {
  console.log(req.query);
  let user = await db.get("cards").find({ owner: req.query.owner }).value();
  console.log(2, user);
  if (user) {
    res.json({
      number: user.number,
      network: user.network,
      balance: user.balance,
      design: user.design,
      status: 200
    })
  } else {
    res.status(400);
    res.json({
      status: 400
    })
  }

});

app.get('/transaction', async (req, res) => {
  let sender = req.query.sender;
  let receiver = req.query.receiver;
  let amount = parseInt(req.query.amount);

  console.log(sender, receiver, amount);

  let senderData = await db.get("cards").find({ number: sender }).value();
  let receiverData = await db.get("cards").find({ number: receiver }).value();

  console.log(sender);
  console.log(receiver);
  console.log(amount);

  if (amount < 0) {
    res.status("400");
    res.send("Illegal operation");
    return;
  }

  if ((senderData.balance - amount) > -1) {
    let newBalance = senderData.balance - amount;
    await db.get("cards").find({ number: sender }).assign({ balance: newBalance }).write();
    await db.get("cards").find({ number: receiver }).assign({ balance: receiverData.balance + amount }).write();
    res.json({
      status: "Success"
    })
    console.log(`Moved ${amount} UAH from ${senderData.owner}'s card (${senderData.number}) to ${receiverData.owner}'s card (${receiverData.number})`);
  } else {
    res.status('400')
    res.send('Not enough money')
  }
})

app.get('/banktransaction', async (req, res) => {
  let receiver = req.query.receiver;
  let amount = parseInt(req.query.amount);

  let receiverData = await db.get("cards").find({ number: receiver }).value();

  if (amount < 0) {
    res.status("400");
    res.send("Illegal operation");
    return;
  }

  await db.get("cards").find({ number: receiver }).assign({ balance: receiverData.balance + amount }).write();
  res.json({
    status: "Success"
  })
  console.log(`Moved ${amount} UAH from bank to ${receiverData.owner}'s card (${receiverData.number})`);
}
)

app.get('/getuserlist', async (req, res) => {
  let userlistDB = await db.get("cards").value();
  console.log(userlistDB);
  let userlist = [];
  for (let i = 0; i < userlistDB.length; i++) {
    let user = {
      label: userlistDB[i].owner,
      value: userlistDB[i].number
    }
    userlist.push(user);
  }
  console.log(userlist);
  res.json(userlist);
})

app.get('/buyproperty', async (req, res) => {
  let cardID = req.query.propid;
  let buyer = req.query.buyer;
  let cardData = await db.get("propertyData").find({ name: cardID }).value();
  let buyerData = await db.get("cards").find({ owner: buyer }).value();

  console.log(`Received a request to buy property: ${cardID}`);

  if (buyerData.balance > cardData.price || buyerData.balance === cardData.price) {
    db.get("propertyData").find({ name: cardID }).assign({ owner: buyerData.owner }).write();
    res.send(`Selled ${cardID} to ${buyer}, owner: ${buyerData.owner}`);
  }
})

app.get('/getpropertyownagedata', (req, res) => {
  let propertyData = db.get("propertyData").value();
  let response = [];
  for (i = 0; i < propertyData.length; i++) {
    let responseItem = {
      name: propertyData[i].name,
      owner: propertyData[i].owner,
      homes: propertyData[i].homes
    }
    response.push(responseItem);
  }
  console.log(response);
  res.send(response);
})

app.get('/changedesign', async (req, res) => {
  let designNumber = Number(req.query.design);
  await db.get("cards").find({owner:req.query.user}).assign({design:designNumber}).write();
  console.log('Success');
  res.send('Success');
})

//other get requests

app.get('/generateqr', async (req, res) => {
  let propertyName = req.query.property;
  let propertyData = await db.get("propertyData").find({name: propertyName}).value();
  let qrMessage = {
    name: propertyName
  }
  if (propertyData.owner === "") {
    qrcode.toString(propertyName, {type: 'terminal'}, (err, url) => {
      console.log(url);
    })
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

function getCurrentTime() {
  let today = new Date();
  let currTime = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
  return currTime;
}

https.createServer(options, app).listen(5502);