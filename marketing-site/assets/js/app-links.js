(function configureAppLinks() {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const appBaseUrl =
    window.PRONTO_CONFIG?.appBaseUrl || (isLocalhost ? "http://localhost:3000" : "");

  document.querySelectorAll("[data-app-path]").forEach((link) => {
    link.href = `${appBaseUrl}${link.dataset.appPath}`;
  });
})();
