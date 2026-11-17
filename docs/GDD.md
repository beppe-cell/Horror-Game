# Deepcore — Game Design Document

> Titolo provvisorio. Il titolo definitivo si sceglie prima del rilascio; il repo verrà rinominato allora.

## 1. Visione

Roguelite d'azione twin-stick a stanze (genere alla Binding of Isaac), con tema, personaggi e
oggetti originali. Un astronauta naufragato su un pianeta abbandonato scende attraverso una
struttura aliena sotterranea, piano dopo piano, fino al suo nucleo.

- **Obiettivo:** gioco piccolo e completo da pubblicare, in 2-6 mesi.
- **Piattaforma:** solo browser, 2D.
- **Distribuzione:** itch.io, gratis o "paga quanto vuoi". La pagina dichiara l'uso di grafica generata con AI.
- **Lingue:** italiano e inglese.

## 2. Team e flusso di lavoro

- Claude scrive tutto il codice. L'utente decide, fa playtest e genera la grafica.
- Lavoro su branch di funzionalità con una PR per blocco; il merge su `main` lo fa l'utente.
- Build di test su GitHub Pages, aggiornate da GitHub Actions a ogni push su `main`.
- Feedback del playtest e bug: tutti in chat.

## 3. Tecnologia

- Phaser 4, TypeScript (strict), Vite.
- Test: vitest per la logica (generatore, oggetti, statistiche); Playwright come smoke test (il gioco si avvia senza errori).
- Risoluzione interna 1920×1080, scalata alla finestra mantenendo le proporzioni.
- Salvataggio in `localStorage`: meta-progressione, più "salva ed esci" a metà run tra una stanza e l'altra.

## 4. Struttura della run

- 5 piani; una run dura 20-30 minuti.
- Ogni piano ha almeno una stanza boss, una stanza oggetto e un negozio.
- Tutto deriva da un seed condivisibile.

| Piano | Bioma |
|---|---|
| 1 | Sito dello schianto e caverne superficiali |
| 2 | Alveare organico |
| 3 | Grotte di cristallo |
| 4 | Laboratorio alieno allagato |
| 5 | Nucleo della struttura (boss finale) |

### Generazione delle stanze (interamente procedurale)

- Stanze di dimensione fissa: una schermata, su griglia.
- Ostacoli e rocce piazzati per pattern più rumore.
- Controllo di connettività: tutte le porte e i pickup devono essere raggiungibili.
- Ogni stanza ha un budget di difficoltà che cresce col piano e sceglie quali nemici piazzare.
- I nemici non compaiono mai vicino alla porta d'ingresso.

## 5. Giocatore

- **Controlli:** WASD per muoversi, frecce per sparare in 4 direzioni; gamepad twin-stick.
- **Salute:** celle di integrità della tuta, più celle di scudo temporanee raccolte nei livelli.
- **Statistiche:** danno, cadenza di fuoco, gittata, velocità dei colpi, velocità di movimento, fortuna. Gli oggetti le modificano tramite un sistema di modificatori.

### Personaggi

| Personaggio | Disponibilità | Particolarità |
|---|---|---|
| Astronauta | Iniziale | Base equilibrata |
| Ingegnere | Sbloccabile | Parte con un drone che spara |
| Medico | Sbloccabile | Meno danno; pulire una stanza ripara la tuta |
| Esploratore | Sbloccabile | Veloce e fragile; vede la mappa del piano |

## 6. Oggetti ed economia

- Circa 40 oggetti al lancio.
- Oggetti passivi che si sommano e creano sinergie (per esempio colpi che rimbalzano o perforano).
- Uno slot per l'oggetto attivo, che si ricarica pulendo le stanze.
- Valute e consumabili: monete, chiavi, bombe.

## 7. Nemici e boss

- 15 tipi di nemici, 3 per piano.
- 7 boss: uno per piano, più un'alternativa casuale ai piani 1 e 2.

## 8. Meta-progressione

- Sblocchi di nuovi oggetti e personaggi completando obiettivi.
- Nessun potenziamento permanente delle statistiche.

## 9. Grafica

- **Stile:** cartoon cel-shaded, contorno nero spesso, colori saturi, accenti bioluminescenti su fondi scuri.
- **Prospettiva:** top-down 3/4.
- **Dimensioni:** giocatore circa 128 px, nemici 96-256 px, boss fino a circa 512 px. Le sorgenti si generano ad almeno il doppio.
- **Animazioni:** frame per frame, cicli da 8 o più frame.
  - Giocatore e personaggi: 3 direzioni (giù, su, lato); la sinistra è il lato specchiato.
  - Nemici e boss: 1 vista specchiata.

### Pipeline

1. L'utente genera le immagini con Gemini (piano gratuito), seguendo la guida di stile e i prompt preparati da Claude.
2. Prompt con sfondo a tinta unita magenta `#FF00FF`.
3. L'utente carica i file su GitHub in `art/raw/<nome-entità>/`.
4. Uno script rimuove lo sfondo (chroma key), ritaglia, scala e divide i frame.

**Pilota all'inizio dell'M3:** si genera solo lo sprite sheet del giocatore. Se ci sono watermark
visibili, limiti di generazione troppo bassi o frame troppo incoerenti, si scende a 4 frame oppure
si rivede lo stile.

## 10. Audio

- Effetti CC0 (Kenney, Freesound) più effetti retro generati con jsfxr.
- Musica CC0 o CC-BY, con i crediti nel gioco.
- Nessuna API a pagamento.

## 11. Milestone

| Milestone | Contenuto |
|---|---|
| **M1** (circa 3-4 settimane, grafica segnaposto) | Movimento, sparo, un piano procedurale, 3 nemici, 1 boss, 10 oggetti, test automatici |
| **M2** | Tutti i 5 piani, i 15 nemici, i 7 boss e circa 40 oggetti, sempre con segnaposto |
| **M3** | Pilota della grafica, guida di stile, prompt per Gemini, sostituzione dei segnaposto, audio |
| **M4** | Meta-progressione, personaggi sbloccabili, localizzazione, rifinitura, rilascio su itch.io |
