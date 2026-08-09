# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Local Setup & Environment Variables

Copy the environment templates and install dependencies:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
npm --prefix server install
npm --prefix client install
npm --prefix server run dev
npm --prefix client run dev
```

Important notes about environment configuration:

1. Deployed environments must replace all endpoint values in the environment (server/.env variables on the server host; VITE_* variables in the client build environment).
2. VITE_* values are embedded at client build time, so the client must be rebuilt after changing them.
3. Secrets belong only in server environment variables; never put secrets in VITE_* variables (they are exposed to the browser).
4. PG_PASSWORD must never be committed; server/.env and client/.env are gitignored.
