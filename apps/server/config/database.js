const { requireEnv } = require("./load-env");

module.exports = {
  url: requireEnv("DB_STRING"),
  dbName: "PRONTO-COFFEE-CO",
};
