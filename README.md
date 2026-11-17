# Deepcore

Roguelite d'azione twin-stick nel browser (Phaser 4 + TypeScript). Design completo in
[`docs/GDD.md`](docs/GDD.md).

## Giocare

- Versione di test: GitHub Pages del repo (aggiornata a ogni merge su `main`).
- `?seed=ABCD1234` nell'URL ripete la stessa run.

| Azione | Tastiera | Gamepad |
|---|---|---|
| Muoversi | WASD | Stick sinistro |
| Sparare | Frecce | Stick destro |

## Sviluppo

```bash
npm install
npm run dev        # server locale con hitbox visibili
npm test           # test della logica (vitest)
npm run typecheck
npm run build && npm run smoke   # avvia il gioco in un browser headless, muove e spara
```

La logica di gioco sta in `src/rules/` e non importa Phaser, così si testa senza browser.
Le scene in `src/scenes/` la disegnano e le passano l'input.
