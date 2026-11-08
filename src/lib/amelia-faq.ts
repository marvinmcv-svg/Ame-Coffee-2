/**
 * Offline answers for Amel-IA, used when the AI endpoint is unavailable
 * (no API key configured, rate limited, or no network). Only facts that are
 * published on the site — never invents prices or availability.
 */
const WA = "+591 750 26695";

const RULES: { keys: RegExp; reply: string; reserve?: boolean }[] = [
  {
    keys: /horario|hora|abre|abren|cierra|cierran|abiert|open|close|hours/,
    reply: "Abrimos todos los días de 07:00 a 23:00, en nuestras dos sucursales ☕",
  },
  {
    keys: /donde|dirección|direccion|ubica|sucursal|llegar|mapa|equipetrol|banzer|address|where/,
    reply:
      "Tenemos dos casas 🤎\n· AMÉ Equipetrol: Av. San Martín, Shopping Fidalga\n· AMÉ Banzer: Av. Banzer, Shopping Fidalga\nEn la sección Sucursales tienes el enlace a Google Maps.",
  },
  {
    keys: /acustic|acústic|musica|música|vivo|viernes|live|music/,
    reply:
      "Los viernes a las 21:00 hay música en vivo en la terraza de AMÉ Equipetrol 🎶 Te recomendamos reservar; la agenda de artistas sale en nuestro Instagram @ame.specialtycoffee.",
    reserve: true,
  },
  {
    keys: /reserv|mesa|book|table/,
    reply: "¡Con gusto! Arma tu reserva en 30 segundos con el formulario de Reservas y te dejamos el mensaje listo para WhatsApp. El equipo te confirma por ahí.",
    reserve: true,
  },
  {
    keys: /evento|cumple|empresa|grupo|fiesta|celebr|event|birthday/,
    reply: `¡Nos encanta celebrar! 🎉 Para cumpleaños, reuniones de empresa o familia coordinamos todo por WhatsApp (${WA}). Puedes empezar con el formulario de Reservas → "Cumpleaños o evento".`,
    reserve: true,
  },
  {
    keys: /ejecutivo|almuerzo|lunch|sopa/,
    reply: "Tenemos menú ejecutivo de almuerzo que cambia cada semana, en las dos sucursales. En Banzer incluye sopa 🥣 El menú de la semana lo publicamos en Instagram.",
  },
  {
    keys: /coctel|cóctel|trago|sour|mojito|bar|drink|cocktail/,
    reply: "En la barra tenemos coctelería de autor con frutas cruceñas: Sour de Achachairú, Mojito de Mocochinchi y cócteles de café 🍸",
  },
  {
    keys: /soda/,
    reply: "Nuestras sodas artesanales: mora, mocochinchi, maracuyá, jengibre y limón, y frutilla 🍓",
  },
  {
    keys: /precio|cuesta|cuánto|cuanto|costo|price|cost/,
    reply: `Los precios están en la carta de cada sucursal y las promos de la semana en Instagram. Si quieres un dato puntual, escríbenos al WhatsApp ${WA}.`,
  },
  {
    keys: /menu|menú|carta|comer|comida|sandwich|sándwich|keperi|patrimonio|panini|cesar|césar|food|eat/,
    reply:
      "En cocina te recomendamos el Sándwich de Keperi, el Sándwich Patrimonio (homenaje al sándwich de chola), el Panini AMÉ y la César. Y para picar: cuñapé, sonso y empanada de queso 🥪",
  },
  {
    keys: /cafe|café|cappuccino|latte|espresso|americano|mocca|affogato|coffee/,
    reply: "Nuestra barra de café de especialidad: espresso, americano, cappuccino, latte, mocca, chocolate caliente y affogato ☕ ¡Pruébalos en la sección La barra!",
  },
  {
    keys: /hola|buenas|buenos|hi\b|hello|hey/,
    reply: "¡Hola! 🤎 ¿En qué te ayudo? Puedo contarte horarios, sucursales, el menú, el viernes acústico o ayudarte a reservar.",
  },
  {
    keys: /gracias|thank/,
    reply: "¡Con gusto! Te esperamos en AMÉ ☕🤎",
  },
];

export function faqReply(input: string): { reply: string; reserve?: boolean } {
  // case- and accent-insensitive matching ("Dónde" → "donde")
  const q = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const r of RULES) if (r.keys.test(q)) return { reply: r.reply, reserve: r.reserve };
  return {
    reply: `Mmm, ese dato no lo tengo a mano 😅 Escríbenos al WhatsApp ${WA} y el equipo te responde enseguida.`,
  };
}
