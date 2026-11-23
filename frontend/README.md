# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## AME Messenger configuration

1. Copy `.env.example` to `.env` and set `VITE_API_URL` plus the Firebase web app values.
2. In Firebase Console, enable Google and Facebook under Authentication → Sign-in method. For Facebook, configure the Facebook App ID/secret and add the Firebase OAuth redirect URL in the Meta developer console. Add your local and production domains to Firebase authorized domains.
3. Copy `backend/.env.example` to `backend/.env`; configure MongoDB, `JWT_SECRET`, and the same Firebase Web API key.
4. Configure SMTP values to enable password-reset email delivery. Reset links expire after 30 minutes.
5. The backend server default port is 5001 to match the frontend API default.

Social sign-in and password reset need these external provider credentials; the source code includes the integration, but credentials are intentionally not included in this archive.
