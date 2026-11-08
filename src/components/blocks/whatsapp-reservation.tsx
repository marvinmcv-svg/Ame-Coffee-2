import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Minus, MoreVertical, Plus, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

export const AME_WHATSAPP = "59175026695";

type Kind = "mesa" | "acustico" | "evento" | "pregunta";
type Branch = "Equipetrol" | "Banzer";

const KINDS: { id: Kind; title: string; text: string }[] = [
  { id: "mesa", title: "Reservar una mesa", text: "Desayuno, almuerzo, café de la tarde o cena" },
  { id: "acustico", title: "Viernes acústico", text: "Música en vivo en la terraza de Equipetrol, 21:00" },
  { id: "evento", title: "Cumpleaños o evento", text: "Familia, amigos o empresa: armamos la mesa para tu grupo" },
  { id: "pregunta", title: "Tengo una pregunta", text: "Menú, horarios, menú ejecutivo o lo que necesites" },
];
const STEPS = ["Qué necesitas", "Detalles", "Tus datos", "Enviar"];
const BRANCHES: { id: Branch; text: string }[] = [
  { id: "Equipetrol", text: "Av. San Martín · Shopping Fidalga" },
  { id: "Banzer", text: "Av. Banzer · Shopping Fidalga" },
];
const ZONES = ["Terraza", "Salón", "Sin preferencia"];
const EVENT_TYPES = ["Cumpleaños", "Empresa", "Familia", "Otro"];
const TOPICS = ["Menú", "Horarios", "Menú ejecutivo", "Para llevar", "Otro"];
const HOURS = Array.from({ length: 32 }, (_, i) => {
  const m = 7 * 60 + i * 30; // 07:00 → 22:30
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

type Form = {
  kind: Kind | null;
  branch: Branch | null;
  date: string;
  time: string;
  people: number;
  zone: string;
  eventType: string;
  topic: string;
  question: string;
  name: string;
  note: string;
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nextFriday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  return isoDate(d);
};
const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const longDate = (s: string) =>
  s ? new Intl.DateTimeFormat("es-BO", { weekday: "long", day: "numeric", month: "long" }).format(parseISO(s)) : "";
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function buildMessage(f: Form): string {
  const L: string[] = ["¡Hola AMÉ! 👋"];
  const when = () => {
    if (f.date) L.push(`📅 Fecha: ${longDate(f.date)}`);
    if (f.time) L.push(`🕗 Hora: ${f.time}`);
    if (f.people) L.push(`👥 Personas: ${f.people}`);
  };
  switch (f.kind) {
    case "mesa":
      L.push("Quiero reservar una mesa ☕");
      if (f.branch) L.push(`📍 Sucursal: AMÉ ${f.branch}`);
      when();
      if (f.zone && f.zone !== "Sin preferencia") L.push(`🪑 Zona: ${f.zone}`);
      break;
    case "acustico":
      L.push("Quiero reservar para el Viernes Acústico 🎶");
      L.push("📍 Sucursal: AMÉ Equipetrol");
      if (f.date) L.push(`📅 Fecha: ${longDate(f.date)}`);
      L.push("🕘 Hora: 21:00");
      if (f.people) L.push(`👥 Personas: ${f.people}`);
      break;
    case "evento":
      L.push(`Quiero organizar un evento${f.eventType ? ` (${f.eventType.toLowerCase()})` : ""} 🎉`);
      if (f.branch) L.push(`📍 Sucursal: AMÉ ${f.branch}`);
      when();
      break;
    case "pregunta":
      L.push(`Tengo una consulta${f.topic ? ` sobre ${f.topic.toLowerCase()}` : ""}:`);
      if (f.question.trim()) L.push(f.question.trim());
      break;
    default:
      return "¡Hola AMÉ! 👋";
  }
  if (f.name.trim()) L.push(`🙋 Nombre: ${f.name.trim()}`);
  if (f.note.trim()) L.push(`📝 Nota: ${f.note.trim()}`);
  return L.join("\n");
}

function stepValid(step: number, f: Form) {
  if (step === 0) return !!f.kind;
  if (step === 1) {
    switch (f.kind) {
      case "mesa":
        return !!(f.branch && f.date && f.time && f.people);
      case "acustico":
        return !!(f.date && f.people);
      case "evento":
        return !!(f.branch && f.date && f.time && f.people && f.eventType);
      case "pregunta":
        return !!(f.topic && f.question.trim());
      default:
        return false;
    }
  }
  if (step === 2) return f.name.trim().length > 1;
  return true;
}

/* -------------------------------------------------------------------------- */
/*                                 Small parts                                */
/* -------------------------------------------------------------------------- */

const label = "mb-3 block font-[family-name:Montserrat,sans-serif] text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c8935a]";
const field =
  "w-full rounded-none border border-[#f4eee7]/15 bg-[#f4eee7]/[0.03] px-4 py-3.5 text-[15px] text-[#f4eee7] outline-none transition-colors placeholder:text-[#f4eee7]/35 focus:border-[#c8935a]/70 [color-scheme:dark]";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "border px-4 py-2.5 text-left text-[14px] transition-colors",
        active
          ? "border-[#c8935a] bg-[#c8935a]/15 text-[#f4eee7]"
          : "border-[#f4eee7]/15 text-[#f4eee7]/70 hover:border-[#f4eee7]/40 hover:text-[#f4eee7]",
      )}
    >
      {children}
    </button>
  );
}

function Stepper({ value, onChange, min = 1, max = 20 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center border border-[#f4eee7]/15">
      <button type="button" aria-label="Menos personas" onClick={() => onChange(Math.max(min, value - 1))} className="grid size-12 place-items-center text-[#f4eee7]/80 hover:bg-[#f4eee7]/5">
        <Minus className="size-4" />
      </button>
      <span className="w-14 text-center text-lg tabular-nums text-[#f4eee7]" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="Más personas" onClick={() => onChange(Math.min(max, value + 1))} className="grid size-12 place-items-center text-[#f4eee7]/80 hover:bg-[#f4eee7]/5">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function AmeAvatar({ className }: { className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-[#6e625b] text-[#f4eee7]", className)} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="size-[70%]">
        <rect x="6" y="20" width="52" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" />
        <text x="33.5" y="33.5" textAnchor="middle" dominantBaseline="central" fontFamily="Montserrat, sans-serif" fontWeight="600" fontSize="15" letterSpacing="3" fill="currentColor">
          AMÉ
        </text>
      </svg>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Phone preview                              */
/* -------------------------------------------------------------------------- */

function PhonePreview({ message, href, time }: { message: string; href: string; time: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[360px] rounded-[46px] border border-[#f4eee7]/10 bg-[#120d0a] p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[36px] bg-[#0b141a]">
          <div className="absolute left-1/2 top-2.5 z-10 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
          {/* header */}
          <div className="flex items-center gap-2.5 bg-[#1f2c34] px-3 pb-3 pt-12 text-[#e9edef]">
            <ChevronLeft className="size-5 text-[#e9edef]/80" />
            <AmeAvatar className="size-10" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[16px] font-semibold">AMÉ Specialty Coffee</p>
              <p className="text-[12.5px] text-[#e9edef]/60">en línea</p>
            </div>
            <MoreVertical className="size-5 text-[#e9edef]/70" />
          </div>
          {/* chat */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:18px_18px] px-3 py-4">
            <p className="mx-auto w-fit rounded-md bg-[#1f2c34] px-3 py-1 text-[11px] uppercase tracking-wide text-[#e9edef]/70">Hoy</p>
            <div className="max-w-[85%] rounded-lg rounded-tl-none bg-[#1f2c34] px-3 py-2 text-[14px] leading-snug text-[#e9edef] shadow">
              ¡Hola! 👋 Somos AMÉ Specialty Coffee. Cuéntanos qué necesitas y te respondemos enseguida ☕
              <span className="mt-1 block text-right text-[10.5px] text-[#e9edef]/50">07:00</span>
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={message.length > 14 ? "full" : "short"}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="ml-auto max-w-[88%] whitespace-pre-line rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 text-[14px] leading-snug text-[#e9edef] shadow"
              >
                {message}
                <span className="mt-1 flex items-center justify-end gap-1 text-[10.5px] text-[#e9edef]/60">
                  {time}
                  <Check className="size-3.5 text-[#53bdeb]" strokeWidth={3} />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          {/* composer */}
          <div className="flex items-center gap-2 bg-[#0b141a] px-2.5 pb-5 pt-2">
            <div className="flex-1 rounded-full bg-[#1f2c34] px-4 py-3 text-[14px] text-[#e9edef]/45">Mensaje</div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir WhatsApp con este mensaje"
              className="grid size-12 place-items-center rounded-full bg-[#00a884] text-[#0b141a] transition-transform hover:scale-105"
            >
              <SendHorizontal className="size-5" />
            </a>
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-[13px] text-[#f4eee7]/55">WhatsApp se abre con este mensaje listo. Solo tocas enviar.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function WhatsAppReservation() {
  const reduce = useReducedMotion() ?? false;
  const [step, setStep] = React.useState(0);
  const [time, setTime] = React.useState(nowTime);
  const [f, setF] = React.useState<Form>({
    kind: null,
    branch: null,
    date: isoDate(new Date()),
    time: "",
    people: 2,
    zone: "Sin preferencia",
    eventType: "",
    topic: "",
    question: "",
    name: "",
    note: "",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  const message = buildMessage(f);
  const href = `https://wa.me/${AME_WHATSAPP}?text=${encodeURIComponent(message)}`;
  const today = isoDate(new Date());

  React.useEffect(() => {
    const id = setInterval(() => setTime(nowTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const pick = React.useCallback((kind: Kind) => {
    setF((s) => ({
      ...s,
      kind,
      date: kind === "acustico" ? nextFriday() : s.date,
      branch: kind === "acustico" ? "Equipetrol" : s.branch,
      people: kind === "evento" ? Math.max(s.people, 8) : s.people,
    }));
  }, []);

  // Links elsewhere on the page (e.g. "Reservar mesa" on the acoustic section) preselect a type.
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-reserve]");
      const kind = el?.dataset.reserve as Kind | undefined;
      if (kind && KINDS.some((k) => k.id === kind)) {
        pick(kind);
        setStep(1);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pick]);

  const canNext = stepValid(step, f);
  const go = (n: number) => setStep(Math.max(0, Math.min(3, n)));
  const isFriday = f.date ? parseISO(f.date).getDay() === 5 : true;

  const details = (() => {
    switch (f.kind) {
      case "mesa":
      case "evento":
        return (
          <div className="grid gap-8">
            {f.kind === "evento" && (
              <div>
                <span className={label}>Tipo de evento</span>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((t) => (
                    <Chip key={t} active={f.eventType === t} onClick={() => set("eventType", t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className={label}>Sucursal</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {BRANCHES.map((b) => (
                  <Chip key={b.id} active={f.branch === b.id} onClick={() => set("branch", b.id)}>
                    <span className="block text-[15px]">AMÉ {b.id}</span>
                    <span className="block text-[12.5px] opacity-60">{b.text}</span>
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <label>
                <span className={label}>Fecha</span>
                <input type="date" min={today} value={f.date} onChange={(e) => set("date", e.target.value)} className={field} />
              </label>
              <label>
                <span className={label}>Hora</span>
                <select value={f.time} onChange={(e) => set("time", e.target.value)} className={field}>
                  <option value="" disabled>
                    Elige una hora
                  </option>
                  {HOURS.map((h) => (
                    <option key={h} value={h} className="bg-[#1e1713]">
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-8">
              <div>
                <span className={label}>Personas</span>
                <Stepper value={f.people} onChange={(n) => set("people", n)} max={f.kind === "evento" ? 80 : 20} />
              </div>
              {f.kind === "mesa" && (
                <div>
                  <span className={label}>Zona</span>
                  <div className="flex flex-wrap gap-2">
                    {ZONES.map((z) => (
                      <Chip key={z} active={f.zone === z} onClick={() => set("zone", z)}>
                        {z}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "acustico":
        return (
          <div className="grid gap-8">
            <p className="border-l-2 border-[#c8935a] pl-4 text-[15px] text-[#f4eee7]/75">
              Música en vivo en la terraza de <strong className="text-[#f4eee7]">AMÉ Equipetrol</strong>, los viernes desde las 21:00. La agenda de artistas sale en Instagram.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <label>
                <span className={label}>Viernes</span>
                <input type="date" min={today} value={f.date} onChange={(e) => set("date", e.target.value)} className={field} />
                {!isFriday && <span className="mt-2 block text-[12.5px] text-[#e7a46a]">Ojo: el acústico es los viernes.</span>}
              </label>
              <div>
                <span className={label}>Personas</span>
                <Stepper value={f.people} onChange={(n) => set("people", n)} />
              </div>
            </div>
          </div>
        );
      case "pregunta":
        return (
          <div className="grid gap-8">
            <div>
              <span className={label}>Tema</span>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <Chip key={t} active={f.topic === t} onClick={() => set("topic", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <label>
              <span className={label}>Tu pregunta</span>
              <textarea
                rows={4}
                maxLength={400}
                value={f.question}
                onChange={(e) => set("question", e.target.value)}
                placeholder="Escribe tu consulta…"
                className={cn(field, "resize-none")}
              />
            </label>
          </div>
        );
      default:
        return null;
    }
  })();

  const panels = [
    <div key="0" role="radiogroup" aria-label="¿Qué necesitas?" className="grid gap-3 sm:grid-cols-2">
      {KINDS.map((k, i) => {
        const active = f.kind === k.id;
        return (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => pick(k.id)}
            onDoubleClick={() => {
              pick(k.id);
              go(1);
            }}
            className={cn(
              "group relative min-h-[170px] border p-7 text-left transition-colors duration-300",
              active ? "border-[#c8935a] bg-[#c8935a]/[0.08]" : "border-[#f4eee7]/12 hover:border-[#f4eee7]/35 hover:bg-[#f4eee7]/[0.02]",
            )}
          >
            <span className="font-[family-name:Fraunces,serif] text-[15px] text-[#c8935a]">{String(i + 1).padStart(2, "0")}</span>
            <span className="mt-4 block font-[family-name:Fraunces,serif] text-[clamp(1.5rem,2.4vw,2rem)] uppercase leading-tight tracking-[0.02em] text-[#f4eee7]">
              {k.title}
            </span>
            <span className="mt-2 block text-[15px] leading-snug text-[#f4eee7]/60">{k.text}</span>
            {active && (
              <span className="absolute right-5 top-5 grid size-7 place-items-center rounded-full bg-[#c8935a] text-[#1e1713]">
                <Check className="size-4" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>,
    <div key="1">{details}</div>,
    <div key="2" className="grid gap-6">
      <label>
        <span className={label}>Tu nombre</span>
        <input autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="¿A nombre de quién?" maxLength={60} className={field} />
      </label>
      <label>
        <span className={label}>Nota (opcional)</span>
        <textarea
          rows={3}
          maxLength={240}
          value={f.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Cumpleaños, silla para bebé, alergias, mesa cerca del escenario…"
          className={cn(field, "resize-none")}
        />
      </label>
    </div>,
    <div key="3" className="grid gap-6">
      <p className="text-[15px] text-[#f4eee7]/70">Revisa tu mensaje. Al tocar el botón se abre WhatsApp con todo listo; nuestro equipo te confirma por ahí.</p>
      <pre className="whitespace-pre-wrap border border-[#f4eee7]/12 bg-[#f4eee7]/[0.03] p-5 font-[family-name:Manrope,sans-serif] text-[15px] leading-relaxed text-[#f4eee7]">
        {message}
      </pre>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-3 bg-[#00a884] px-7 py-4 font-[family-name:Montserrat,sans-serif] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0b141a] transition-transform hover:-translate-y-0.5"
      >
        <SendHorizontal className="size-5" /> Enviar por WhatsApp
      </a>
    </div>,
  ];

  return (
    <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)] lg:gap-20">
      <div>
        {/* step tabs */}
        <ol className="mb-10 grid list-none grid-cols-4 gap-3">
          {STEPS.map((s, i) => {
            const reachable = i <= step || Array.from({ length: i }, (_, j) => stepValid(j, f)).every(Boolean);
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => go(i)}
                  aria-current={i === step ? "step" : undefined}
                  className="group w-full text-left disabled:cursor-not-allowed"
                >
                  <span className={cn("block h-px w-full transition-colors", i <= step ? "bg-[#c8935a]" : "bg-[#f4eee7]/15")} />
                  <span
                    className={cn(
                      "mt-3 block font-[family-name:Montserrat,sans-serif] text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors sm:text-[11px]",
                      i === step ? "text-[#f4eee7]" : "text-[#f4eee7]/40",
                    )}
                  >
                    {pad(i + 1)}
                    <span className="hidden sm:inline"> · {s}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="min-h-[380px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.1, 1] }}
            >
              {panels[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#f4eee7]/10 pt-7">
          <button
            type="button"
            onClick={() => go(step - 1)}
            className={cn(
              "inline-flex items-center gap-2 font-[family-name:Montserrat,sans-serif] text-[12px] font-semibold uppercase tracking-[0.2em] text-[#f4eee7]/60 hover:text-[#f4eee7]",
              step === 0 && "invisible",
            )}
          >
            <ArrowLeft className="size-4" /> Atrás
          </button>
          {step < 3 && (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => go(step + 1)}
              className="inline-flex items-center gap-3 bg-[#c8935a] px-8 py-4 font-[family-name:Montserrat,sans-serif] text-[12px] font-semibold uppercase tracking-[0.22em] text-[#1e1713] transition-all hover:bg-[#d9a56c] disabled:cursor-not-allowed disabled:bg-[#c8935a]/25 disabled:text-[#f4eee7]/40"
            >
              Siguiente <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <PhonePreview message={message} href={href} time={time} />
      </div>
    </div>
  );
}

export default WhatsAppReservation;
