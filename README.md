# AMÉ Specialty Coffee — sitio web

Sitio one-page para **AMÉ Specialty Coffee** (Santa Cruz de la Sierra, Bolivia).

- **Hero cinematográfico**: al hacer scroll se prepara un cappuccino en 3D: los granos caen en la taza, cae el espresso, luego la leche y aparece el arte latte; termina en una toma de producto con el logo AMÉ. Todo se genera en código con Three.js (`public/js/scene.js`) y el avance del scroll lo controla `public/js/main.js`.
- **Reservas por WhatsApp** (`#reservar`): flujo de 4 pasos con vista previa de WhatsApp en vivo (`src/components/blocks/whatsapp-reservation.tsx`).
- **Amel-IA**: recepcionista virtual con IA (Claude). El chat está en `src/components/blocks/amelia-chat.tsx` y el endpoint en `api/amelia.ts`.
- **Movimiento**: GSAP + ScrollTrigger y scroll suave con Lenis.
- **Contenido real**: fotos, reels y textos tomados de [@ame.specialtycoffee](https://www.instagram.com/ame.specialtycoffee/) (con Firecrawl), optimizados en `public/img` y `public/video`.
- **La barra** (`#barra`): componente React interactivo (`CoffeePourMenu`) donde cada bebida se sirve con física de líquidos y el logo AMÉ impreso en cada taza y vaso.

## Stack

- Sitio principal: HTML + CSS + JS en `index.html` y `public/` (las librerías están en `public/vendor`).
- Islas React: **Vite + React 18 + TypeScript + Tailwind CSS v4**, con estructura **shadcn**:
  - `src/components/ui/`: componentes de UI reutilizables (alias `@/components/ui`)
  - `src/components/blocks/`: composiciones con contenido de AMÉ
  - `src/lib/utils.ts`: helper `cn()` de shadcn
  - `components.json`: config de shadcn, para que `npx shadcn add <componente>` instale en `src/components/ui`
- El preflight de Tailwind **no** se carga globalmente, para no alterar el sitio; las islas usan la clase `.tw-island` como reset local.

## Amel-IA (IA)

1. En Vercel → Project → Settings → Environment Variables, agrega `ANTHROPIC_API_KEY` (de console.anthropic.com).
2. Vuelve a publicar el sitio.

Sin la clave, Amel-IA igual funciona en "modo básico": responde con datos fijos de `src/lib/amelia-faq.ts`. La información que usa la IA (horarios, sucursales, menú) está en el prompt de `api/amelia.ts`; actualízala si cambia algo. El endpoint limita la longitud de los mensajes y la cantidad de pedidos por visitante.

## Correr localmente

```bash
npm install
npm run dev
```

## Publicar

Vercel compila con `npm run build` y publica `dist/` (ya configurado en `vercel.json`). Cada push a la rama de producción vuelve a publicar el sitio.

## Editar contenido

| Qué | Dónde |
| --- | --- |
| Textos, menú, sucursales, WhatsApp | `public/index.html` |
| Colores y tipografías | variables en `:root` de `public/css/style.css` |
| Fotos | `public/img/*.webp` |
| Reels | `public/video/*.mp4` (+ póster `.jpg`) |
| Escena 3D | `public/js/scene.js` |
| Bebidas de la barra y logo en las tazas | `src/components/blocks/ame-coffee-bar.tsx` |

Fuentes originales descargadas de Instagram: `assets/ig/` (las fotos; los reels sin comprimir están excluidos del repo).

> Antes de publicar: confirma los precios y promociones vigentes (el menú no muestra precios a propósito), y considera subir el logo en vector. En el sitio el logo está recreado en SVG a partir de la foto de perfil.
