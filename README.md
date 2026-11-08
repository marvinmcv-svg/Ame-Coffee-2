# AMÉ Specialty Coffee — sitio web

Sitio one-page para **AMÉ Specialty Coffee** (Santa Cruz de la Sierra, Bolivia).

- **Hero 3D**: una taza de cappuccino con arte latte, el logo AMÉ, vapor y granos de café flotantes. Todo se genera en código con Three.js, sin modelos externos.
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
