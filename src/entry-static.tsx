/**
 * Entry for the static GitHub Pages build (`npm run build:pages`).
 *
 * The agenda is entirely client-side — the directory is a module constant and
 * edits live in localStorage via the zustand store — so Pages can serve it as
 * a plain SPA. This entry mounts the same component tree the Start app renders
 * under `/`, minus the server-only shell (auth, PGLite, Nitro middleware).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { AgendaApp } from "@/components/agenda/agenda-app";
import "./styles.css";

const container = document.getElementById("app");
if (!container) throw new Error("#app container is missing from index.html");

createRoot(container).render(
  <StrictMode>
    <AgendaApp />
    <Toaster
      theme="light"
      position="top-center"
      toastOptions={{
        className: "!bg-raised !text-fg !border-border !shadow-[var(--shadow-card)] !font-sans",
      }}
    />
  </StrictMode>,
);
