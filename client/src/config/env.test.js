import assert from "node:assert/strict";
import test from "node:test";
import { getClientConfig } from "./env.js";

const validEnv = {
  VITE_API_BASE_URL: "https://api.example.com/api",
  VITE_DEV_API_PROXY_TARGET: "https://server.example.com",
};

test("getClientConfig returns configured API and proxy targets", () => {
  assert.deepEqual(getClientConfig(validEnv), {
    apiBaseUrl: "https://api.example.com/api",
    devApiProxyTarget: "https://server.example.com",
  });
});

test("getClientConfig rejects missing client variables", () => {
  assert.throws(
    () => getClientConfig({ VITE_API_BASE_URL: "/api" }),
    /VITE_DEV_API_PROXY_TARGET/
  );
});
