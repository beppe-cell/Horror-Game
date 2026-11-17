# Deepcore

Roguelite d'azione twin-stick nel browser (Phaser 4 + TypeScript). Design completo in
[`docs/GDD.md`](docs/GDD.md).

## Giocare

- Versione di test: GitHub Pages del repo (aggiornata a ogni merge su `main`).

| Azione | Tastiera | Gamepad | Touch |
|---|---|---|---|
| Muoversi | WASD | Stick sinistro | Joystick a sinistra |
| Sparare | Frecce | Stick destro | Joystick a destra |

Su telefono funziona sia in orizzontale sia in verticale.

Parametri utili nell'URL: `?seed=ABCD1234` ripete la stessa stanza, `?quality=high` o `?quality=low` forza la qualità degli effetti.

## Sviluppo

```bash
npm install
npm run dev        # server locale con hitbox visibili
npm test           # test della logica (vitest)
npm run typecheck
npm run build && npm run smoke   # avvia il gioco in un browser headless (desktop e telefono), muove e spara
```

La logica di gioco sta in `src/rules/` e non importa Phaser, così si testa senza browser.
Le scene in `src/scenes/` la disegnano e le passano l'input.
