const orderButtons = document.getElementsByClassName('order');
const submitOrderButton = document.getElementById('submit');
const nameInput = document.getElementById('nameInput');
const menu = document.querySelector('#user-menu-button');
const closeBtn = document.querySelector('#close-sidebar');
const openBtn = document.querySelector('#open-sidebar');

menu.addEventListener('click', toggleMenu);
closeBtn.addEventListener('click', toggleSidebar);
openBtn.addEventListener('click', toggleSidebar);
function toggleMenu() {
  console.log('you clicked the menu button');
  document.querySelector('#menu').classList.toggle('hidden');
}
function toggleSidebar() {
  console.log('you clicked the menu button');
  document.querySelector('#sidebar').classList.toggle('hidden');
}

// submit order flow
submitOrderButton.addEventListener('click', submitOrder);

function submitOrder(event) {
  let order = document.querySelectorAll('.orderItem');
  let orderArr = [];
  const orderTaker = document.querySelector('#orderTaker').innerText;

  for (let i = 0; i < order.length; i++) {
    orderArr[i] = order[i].innerText;
  }

  fetch('/submitNewOrder', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order: orderArr,
      name: nameInput.value,
      orderTaker: orderTaker,
    }),
  }).then(function (response) {
    window.location.reload();
  });
}
// put selections into the DOM
Array.from(orderButtons).forEach(function (orderButton) {
  orderButton.addEventListener('click', function () {
    console.log('You clicked a coffee button  ☕️!');
    let sizes = document.querySelectorAll('input[name="cup__size"]');
    let milkChoices = document.querySelectorAll('input[name="milk');

    let selectedValue;
    for (const size of sizes) {
      if (size.checked) {
        selectedValue = size.value;
      }
    }

    let milkValue;
    for (const milk of milkChoices) {
      if (milk.checked) {
        milkValue = milk.value;
      }
    }

    let li = document.createElement('li');
    li.innerText = `${selectedValue} ${orderButton.value} with ${milkValue} Milk`;
    li.classList.add('orderItem');
    document.getElementById('orderTicket').appendChild(li);
  });
});
