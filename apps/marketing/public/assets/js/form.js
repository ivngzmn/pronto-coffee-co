// Contact form helper for the static marketing site.
(function formControlInit() {
  const form = document.querySelector("form");

  function submitHandler(event) {
    event.preventDefault();

    const successDisplay = document.querySelector("#success");
    const errorDisplay = document.querySelector("#error");

    if (!successDisplay || !errorDisplay) return;

    errorDisplay.style.display = "none";
    successDisplay.style.display = "block";
    form.reset();
  }

  if (form) form.addEventListener("submit", submitHandler);
})();
