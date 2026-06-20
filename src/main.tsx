import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppErrorBoundary } from "./components/app/AppErrorBoundary";
import { RootBootstrap } from "./app/RootBootstrap";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Корневой элемент приложения не найден");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <RootBootstrap />
    </AppErrorBoundary>
  </StrictMode>,
);
