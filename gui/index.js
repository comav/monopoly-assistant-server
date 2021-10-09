let userData = {};

window.onload = async () => {
  const response = await fetch('http://127.0.0.1:5502/getuserlist', {
    method: 'GET'
  })
    .then((resp) => resp.json())
    .then((response) => userData = response);
    console.log(userData);
    for (let i = 0; i < userData.length; i++) {
      let receiverList = document.getElementById('receiver');
      let listItem = document.createElement('option');
      listItem.setAttribute('value', userData[i].value);
      listItem.innerText = userData[i].label;
      receiverList.appendChild(listItem);
    }
}

 function sendMoney() {
  let amount = document.getElementById('moneyAmount').value;
  let selectedUser = document.getElementById('receiver').value;
  
  const response = fetch(`http://127.0.0.1:5502/banktransaction?receiver=${selectedUser}&amount=${amount}`, {
    method: 'GET'
  });
}