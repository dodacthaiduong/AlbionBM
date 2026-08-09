const test = require("node:test");
const assert = require("node:assert/strict");
const { getServerConfig } = require("../config/env");

const validEnv = {
  PORT: "4001",
  CORS_ORIGIN: "https://app.example.com",
  ALBION_API_ASIA_URL: "https://asia.example.com/",
  ALBION_API_AMERICA_URL: "https://america.example.com",
  ALBION_API_EUROPE_URL: "https://europe.example.com",
};

test("getServerConfig parses port and normalizes Albion URLs", () => {
  assert.deepEqual(getServerConfig(validEnv), {
    port: 4001,
    corsOrigin: "https://app.example.com",
    albionApiBaseUrls: {
      asia: "https://asia.example.com",
      america: "https://america.example.com",
      europe: "https://europe.example.com",
    },
  });
});

test("getServerConfig rejects missing required variables", () => {
  const env = { ...validEnv };
  delete env.ALBION_API_EUROPE_URL;

  assert.throws(() => getServerConfig(env), {
    message: /ALBION_API_EUROPE_URL/,
  });
});

test("getServerConfig rejects invalid ports and URLs", () => {
  assert.throws(() => getServerConfig({ ...validEnv, PORT: "not-a-port" }), /PORT/);
  assert.throws(
    () => getServerConfig({ ...validEnv, ALBION_API_ASIA_URL: "not-a-url" }),
    /ALBION_API_ASIA_URL/
  );
});
