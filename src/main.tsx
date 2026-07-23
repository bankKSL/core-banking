import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";
import { QueryProvider } from "./providers/QueryProvider";
import { ToastProviderWrapper } from "./components/ui/toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <ToastProviderWrapper>
        <App />
      </ToastProviderWrapper>
    </QueryProvider>
  </StrictMode>,
);
