# MyM for LilibetSP. courtesy of geeskit.com 2026

Mi ciclo, mi ritmo - App de seguimiento menstrual con watermark logo transparente 90% y tema oscuro/claro.

## Estructura requerida
```
mym-app/
├── dist/          -> Build producción listo para deploy estático (sin npm)
├── src/           -> Código fuente React
├── public/        -> Assets públicos + PWA
├── package.json
├── vite.config.ts
├── index.html
└── README.md
```

## Deploy estático (sin npm)
La carpeta `dist/` es 100% standalone y PWA-ready:
- Sube `dist/` a Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3, etc.
- Ya incluye: index.html, manifest.json, sw.js, icons
- No necesita `npm install` ni build

Ejemplo Netlify: drag & drop carpeta `dist/`
Ejemplo Vercel: `vercel --prod dist`

## Desarrollo local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ con PWA
npm run preview
```

## PWA
- manifest.json con theme_color #72C8D0
- Service worker sw.js con cache offline
- Icons 192 y 512 desde logo MyM
- Instalable en móvil/desktop

## Diseño preservado
- Grid 90% transparente rgba(255,255,255,0.10) + blur 12px
- Logo watermark 380px desktop / 240px mobile al 18%/12% opacity
- Overlay 20% claro / 40% oscuro
- Colores #72C8D0 #DDF3F4 #F7FBFA #243638
- Footer 9px: MyM for LilibetSP. courtesy of geeskit.com 2026
- Toggle tema oscuro 🌙/☀️ con localStorage

Versión final estable v1.0
