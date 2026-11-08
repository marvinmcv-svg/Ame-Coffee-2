# AMÉ Specialty Coffee — sitio web

Sitio one-page para **AMÉ Specialty Coffee** (Santa Cruz de la Sierra, Bolivia).

- **Hero 3D**: una taza de cappuccino con arte latte, el logo AMÉ, vapor y granos de café flotantes. Todo se genera en código con Three.js, sin modelos externos.
- **Movimiento**: GSAP + ScrollTrigger y scroll suave con Lenis.
- **Contenido real**: fotos, reels y textos tomados de [@ame.specialtycoffee](https://www.instagram.com/ame.specialtycoffee/) (con Firecrawl), optimizados en `public/img` y `public/video`.
- Sin paso de build: es HTML/CSS/JS estático y las librerías están en `public/vendor`.

## Correr localmente

```bash
cd public && python3 -m http.server 4173
```

Luego abre http://localhost:4173

## Publicar

Importa el repositorio en Vercel: `vercel.json` ya apunta a `public/`. También funciona en Netlify o cualquier hosting estático, con `public/` como carpeta raíz.

## Editar contenido

| Qué | Dónde |
| --- | --- |
| Textos, menú, sucursales, WhatsApp | `public/index.html` |
| Colores y tipografías | variables en `:root` de `public/css/style.css` |
| Fotos | `public/img/*.webp` |
| Reels | `public/video/*.mp4` (+ póster `.jpg`) |
| Escena 3D | `public/js/scene.js` |

Fuentes originales descargadas de Instagram: `assets/ig/` (las fotos; los reels sin comprimir están excluidos del repo).

> Antes de publicar: confirma los precios y promociones vigentes (el menú no muestra precios a propósito), y considera subir el logo en vector. En el sitio el logo está recreado en SVG a partir de la foto de perfil.
