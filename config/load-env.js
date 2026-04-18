const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envCandidates = [
  path.resolve(process.cwd(), "config/.env"),
  path.resolve(process.cwd(), ".env"),
];

let loadedEnvPath = null;

for (const envPath of envCandidates) {
  if (!fs.existsSync(envPath)) continue;
  dotenv.config({ path: envPath });
  loadedEnvPath = envPath;
  break;
}

const requireEnv = (name) => {
  const value = process.env[name];

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  const searchedPaths = envCandidates.join(", ");
  throw new Error(
    `Missing required environment variable ${name}. Add it to config/.env or .env. Paths checked: ${searchedPaths}`
  );
};

module.exports = {
  loadedEnvPath,
  requireEnv,
};
