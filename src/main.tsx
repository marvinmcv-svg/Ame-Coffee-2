import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AmeCoffeeBar } from "@/components/blocks/ame-coffee-bar";
import { WhatsAppReservation } from "@/components/blocks/whatsapp-reservation";
import { AmeliaChat } from "@/components/blocks/amelia-chat";

// React islands mounted into the static page.
const islands: [string, ReactNode][] = [
  ["coffee-bar-root", <AmeCoffeeBar />],
  ["reserve-root", <WhatsAppReservation />],
  ["amelia-root", <AmeliaChat />],
];
for (const [id, node] of islands) {
  const el = document.getElementById(id);
  if (el) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}

// Islands change the page height; let GSAP recompute its scroll triggers.
requestAnimationFrame(() => {
  (window as unknown as { ScrollTrigger?: { refresh: () => void } }).ScrollTrigger?.refresh();
});
