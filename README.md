# Mini App (cuma versi Firebase)

`index.html` = tampilan Mini App. Tombol **Connect** buka chat bot (`?start=connect`) — OTP tetap diproses di bot, jadi aman.

## Cara hosting (gratis, Cloudflare Workers)
1. Install: `npm i -g wrangler`
2. Login: `wrangler login`
3. Deploy: `wrangler deploy` (dari folder ini)
4. Nanti dapat URL `https://ubot-miniapp.xxx.workers.dev`
5. Masukin URL itu ke `.env` bot: `MINIAPP_URL=https://ubot-miniapp.xxx.workers.dev`
6. Restart bot → tombol "Open" muncul di chat bot

> Mau ganti tampilan? Edit `index.html`, deploy ulang. `worker.js` otomatis pakai isi `index.html` (jangan pakai karakter backtick di dalam index.html).

Alternatif hosting: Vercel / Netlify / GitHub Pages (upload `index.html` aja).
