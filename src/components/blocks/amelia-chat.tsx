import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarCheck, SendHorizontal, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { faqReply } from "@/lib/amelia-faq";
import { AME_WHATSAPP } from "@/components/blocks/whatsapp-reservation";

type Msg = {
  role: "user" | "assistant";
  content: string;
  whatsapp?: string;
  reserve?: boolean;
};

const GREETING: Msg = {
  role: "assistant",
  content:
    "¡Hola! Soy Amel-IA ☕ la recepcionista virtual de AMÉ. Te ayudo con horarios, sucursales, el menú, el viernes acústico o a preparar tu reserva. ¿Qué necesitas?",
};
const QUICK = ["¿A qué hora abren?", "Quiero reservar una mesa", "¿Qué hay el viernes?", "¿Dónde están?"];

function Avatar({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center rounded-full bg-[#6e625b] text-[#f4eee7]", className)} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="size-[72%]">
        <rect x="6" y="20" width="52" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" />
        <text x="33.5" y="33.5" textAnchor="middle" dominantBaseline="central" fontFamily="Montserrat, sans-serif" fontWeight="600" fontSize="15" letterSpacing="3" fill="currentColor">
          AMÉ
        </text>
      </svg>
      <Sparkles className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full bg-[#c8935a] p-0.5 text-[#1e1713]" />
    </span>
  );
}

export function AmeliaChat() {
  const reduce = useReducedMotion() ?? false;
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([GREETING]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const offline = React.useRef(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [msgs, busy, reduce]);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(text: string) {
    const q = text.trim().slice(0, 600);
    if (!q || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(history);
    setInput("");
    setBusy(true);

    let answer: Msg | null = null;
    if (!offline.current) {
      try {
        const res = await fetch("/api/amelia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // the greeting is local UI, not part of the model conversation
          body: JSON.stringify({ messages: history.slice(1).map(({ role, content }) => ({ role, content })) }),
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: string; whatsapp?: string };
          answer = { role: "assistant", content: data.reply, whatsapp: data.whatsapp };
        } else if (res.status === 503 || res.status === 404) {
          offline.current = true; // not configured: answer locally from now on
        }
      } catch {
        /* network error: fall through to local answers */
      }
    }
    if (!answer) {
      await new Promise((r) => setTimeout(r, 450));
      const { reply, reserve } = faqReply(q);
      answer = { role: "assistant", content: reply, reserve };
    }
    setMsgs((m) => [...m, answer!]);
    setBusy(false);
  }

  const goReserve = () => {
    setOpen(false);
    document.getElementById("reservar")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="font-[family-name:Manrope,sans-serif]">
      {/* launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.2 }}
            className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-full bg-[#1e1713] py-2 pl-2 pr-5 text-[#f4eee7] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(244,238,231,0.12)] transition-transform hover:-translate-y-0.5"
            aria-label="Abrir chat con Amel-IA, la recepcionista virtual"
          >
            <Avatar className="size-11" />
            <span className="text-left leading-tight">
              <span className="block text-[15px] font-semibold">Amel-IA</span>
              <span className="flex items-center gap-1.5 text-[12px] text-[#f4eee7]/60">
                <span className="size-1.5 animate-pulse rounded-full bg-[#00a884]" /> ¿Te ayudo?
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Amel-IA, recepcionista virtual de AMÉ"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[70] flex h-[100dvh] origin-bottom-right flex-col overflow-hidden bg-[#faf7f3] text-[#1e1713] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(640px,calc(100dvh-40px))] sm:w-[400px] sm:rounded-[26px]"
          >
            <header className="flex items-center gap-3 bg-[#1e1713] px-5 py-4 text-[#f4eee7]">
              <Avatar className="size-11" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[16px] font-semibold">Amel-IA</p>
                <p className="flex items-center gap-1.5 text-[12.5px] text-[#f4eee7]/60">
                  <span className="size-1.5 rounded-full bg-[#00a884]" /> Recepcionista virtual · AMÉ
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat" className="grid size-9 place-items-center rounded-full hover:bg-[#f4eee7]/10">
                <X className="size-5" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
              {msgs.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[14.5px] leading-snug",
                      m.role === "user" ? "rounded-br-md bg-[#6e625b] text-[#f4eee7]" : "rounded-bl-md bg-[#efe6db] text-[#2b211c]",
                    )}
                  >
                    {m.content}
                    {m.whatsapp && (
                      <a
                        href={`https://wa.me/${AME_WHATSAPP}?text=${encodeURIComponent(m.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#00a884] px-4 py-2.5 text-[13px] font-semibold text-[#0b141a]"
                      >
                        <SendHorizontal className="size-4" /> Enviar reserva por WhatsApp
                      </a>
                    )}
                    {m.reserve && (
                      <button
                        type="button"
                        onClick={goReserve}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e1713] px-4 py-2.5 text-[13px] font-semibold text-[#f4eee7]"
                      >
                        <CalendarCheck className="size-4" /> Ir a reservas
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex gap-1 px-2 py-1" aria-label="Amel-IA está escribiendo">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-2 animate-bounce rounded-full bg-[#6e625b]/60" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </div>
              )}
              {msgs.length === 1 && !busy && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      className="rounded-full border border-[#6e625b]/30 px-3.5 py-1.5 text-[13px] text-[#4a3f39] transition-colors hover:border-[#6e625b] hover:bg-[#6e625b] hover:text-[#f4eee7]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="border-t border-[#1e1713]/10 bg-[#faf7f3] px-3 pb-3 pt-3"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={600}
                  placeholder="Escribe tu pregunta…"
                  aria-label="Mensaje para Amel-IA"
                  className="h-12 flex-1 rounded-full border outline-none focus-visible:outline-none border-[#1e1713]/12 bg-white px-5 text-[14.5px] text-[#1e1713] outline-none placeholder:text-[#6e625b]/70 focus:border-[#c8935a]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  aria-label="Enviar"
                  className="grid size-12 place-items-center rounded-full bg-[#1e1713] text-[#f4eee7] transition-opacity disabled:opacity-35"
                >
                  <SendHorizontal className="size-5" />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-[#6e625b]">Amel-IA es una IA y puede equivocarse. Las reservas las confirma el equipo de AMÉ.</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AmeliaChat;
