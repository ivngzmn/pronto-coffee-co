(function bindAppLinks() {
  const configuredAppUrl =
    document.documentElement.dataset.appUrl || "http://localhost:5173";

  Array.from(document.querySelectorAll("[data-app-path]")).forEach((link) => {
    const path = link.getAttribute("data-app-path");
    if (!path) return;

    link.setAttribute(
      "href",
      `${configuredAppUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
    );
  });
})();
