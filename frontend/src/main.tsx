import React from "react";
import ReactDOM from "react-dom/client";
import App from "@app/App";
import "./index.css";
import * as Sentry from "@sentry/react";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // "development" or "production", set automatically by Vite
  tracesSampleRate: 1.0, // fine at 100% for a demo; low traffic
});