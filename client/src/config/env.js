const readRequired = (env, key) => {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const getClientConfig = (env) => ({
  apiBaseUrl: readRequired(env, "VITE_API_BASE_URL"),
  devApiProxyTarget: readRequired(env, "VITE_DEV_API_PROXY_TARGET"),
});

export { getClientConfig };
