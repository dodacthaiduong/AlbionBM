const REQUIRED_KEYS = [
  "PORT",
  "CORS_ORIGIN",
  "ALBION_API_ASIA_URL",
  "ALBION_API_AMERICA_URL",
  "ALBION_API_EUROPE_URL",
];

const readRequired = (env, key) => {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const readUrl = (env, key) => {
  const value = readRequired(env, key);
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol");
    return value.replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid URL in environment variable: ${key}`);
  }
};

const getServerConfig = (env = process.env) => {
  for (const key of REQUIRED_KEYS) readRequired(env, key);
  const port = Number(readRequired(env, "PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid PORT environment variable");
  }

  return {
    port,
    corsOrigin: readRequired(env, "CORS_ORIGIN"),
    albionApiBaseUrls: {
      asia: readUrl(env, "ALBION_API_ASIA_URL"),
      america: readUrl(env, "ALBION_API_AMERICA_URL"),
      europe: readUrl(env, "ALBION_API_EUROPE_URL"),
    },
  };
};

module.exports = { getServerConfig };
