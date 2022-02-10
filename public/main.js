var orderButtons = document.getElementsByClassName("order");
var submitOrderButton = document.getElementById('submit')
var nameInput = document.getElementById("nameInput")
submitOrderButton.addEventListener('click', submitOrder)


/*
0 Latte
1 Cappucino
2 House Blend
*/

function submitOrder(event){
    let order = document.querySelectorAll('.orderItem')
    let orderArr = []

    for(let i = 0; i < order.length; i++){
        orderArr[i] = order[i].innerText
    }
      console.log("sending name to the server", nameInput.value)
    fetch('/', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
       "order": orderArr,
       "name": nameInput.value
      })
    }).then(function (response) {
      window.location.reload()
    })
}

Array.from(orderButtons).forEach(function(orderButton) {
  orderButton.addEventListener('click', function(){
    
    let sizes = document.querySelectorAll('input[name="size"]')
    let milkChoices = document.querySelectorAll('input[name="milk')
    
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


    let li = document.createElement('li')
    li.innerText = `${selectedValue} ${orderButton.value} with ${milkValue} Milk`
    li.classList.add("orderItem")
    document.getElementById("orderTicket").appendChild(li)


    });
})

// Array.from(sizeButtons).forEach(function(sizeButton) {
//   sizeButton.addEventListener('click', function(){
   
// let span = document.createElement('span')
// span.innerHTML = ` Size: ${sizeButton.value} `
// span.classList.add("size")
// document.querySelector('li').appendChild(span)
//     });
// })


  