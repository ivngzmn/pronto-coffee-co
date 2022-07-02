const complete = document.getElementsByClassName("completed");
const trash = document.getElementsByClassName("clear");
const menu = document.querySelector("#user-menu-button");
const closeBtn = document.querySelector("#close-sidebar");
const openBtn = document.querySelector("#open-sidebar");

menu.addEventListener("click", toggleMenu);
closeBtn.addEventListener("click", toggleSidebar);
openBtn.addEventListener("click", toggleSidebar);

function toggleMenu() {
  console.log("you clicked the menu button");
  document.querySelector("#menu").classList.toggle("hidden");
}
function toggleSidebar() {
  console.log("you clicked the menu button");
  document.querySelector("#sidebar").classList.toggle("hidden");
}

Array.from(complete).forEach(function (element) {
  element.addEventListener("click", function () {
    const id = this.parentNode.parentNode.childNodes[9].innerText;
    const barista = document.querySelector("#barista").innerText;
    const customerName = this.parentNode.parentNode.childNodes[3].innerText;

    //https://usefulangle.com/post/98/javascript-text-to-speech how to add text to speech
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance("Order for " + customerName)
    );

    console.log(id);

    fetch("messages/like", {
      method: "put",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id,
        barista: barista,
      }),
    })
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((data) => {
        console.log(data);
        window.location.reload(true);
      });
  });
});

Array.from(trash).forEach(function (element) {
  element.addEventListener("click", function () {
    const id = this.parentNode.parentNode.childNodes[7].innerText;

    fetch("messages", {
      method: "delete",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
      }),
    }).then(function (response) {
      window.location.reload();
    });
  });
});
