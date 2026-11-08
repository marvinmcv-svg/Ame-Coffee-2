import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AmeCoffeeBar } from "@/components/blocks/ame-coffee-bar";

// React island: mounts the interactive coffee bar into the static page.
const el = document.getElementById("coffee-bar-root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <AmeCoffeeBar />
    </StrictMode>,
  );
  // The island changes page height; let GSAP recompute its scroll triggers.
  requestAnimationFrame(() => {
    (window as unknown as { ScrollTrigger?: { refresh: () => void } }).ScrollTrigger?.refresh();
  });
}
