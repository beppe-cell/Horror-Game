# Deepcore — Game Design Document

> Titolo provvisorio. Il titolo definitivo si sceglie prima del rilascio; il repo verrà rinominato allora.

## 1. Visione

Roguelite d'azione twin-stick a stanze (genere alla Binding of Isaac), con tema, personaggi e
oggetti originali. Un astronauta naufragato su un pianeta abbandonato scende attraverso una
struttura aliena sotterranea, piano dopo piano, fino al suo nucleo.

- **Obiettivo:** gioco piccolo e completo da pubblicare, in 2-6 mesi.
- **Piattaforma:** browser, 2D, su desktop e su mobile, sia in orizzontale sia in verticale, sempre a tutto schermo.
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
- Il canvas riempie sempre tutto lo schermo, senza bande nere:
  - **orizzontale:** la stanza è sempre intera e centrata, con 1,75 tile di muro visibili attorno. Su 16:9 l'interno occupa circa il 70% della larghezza e i due terzi dell'altezza, e il personaggio è alto circa un ottavo dello schermo: le proporzioni classiche dei roguelite a stanze. Lo spazio in più (schermi più larghi) si riempie con la roccia della caverna;
  - **verticale (es. 9:16):** la telecamera segue il giocatore, con circa 8,5 tile in larghezza e l'intera altezza della stanza.
- Qualità degli effetti automatica: alta su desktop, bassa su telefoni e tablet. `?quality=high` o `?quality=low` nell'URL la forza.
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

- Stanze di dimensione fissa: interno 13×7 tile, muri spessi 2 tile; una schermata.
- Ostacoli e rocce piazzati per pattern più rumore.
- Controllo di connettività: tutte le porte e i pickup devono essere raggiungibili.
- Ogni stanza ha un budget di difficoltà che cresce col piano e sceglie quali nemici piazzare.
- I nemici non compaiono mai vicino alla porta d'ingresso.

## 5. Giocatore

- **Controlli:**
  - Tastiera: WASD per muoversi, frecce per sparare in 4 direzioni.
  - Gamepad: twin-stick.
  - Touch: due joystick virtuali che compaiono dove appoggi il dito. Metà sinistra dello schermo per muoversi, metà destra per sparare (direzione arrotondata alla più vicina delle 4).
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

- **Stile:** pixel art con effetti visivi realistici. Il contrasto tra pixel netti e luce, acqua e atmosfera morbide è l'identità visiva del gioco.
- **Prospettiva:** top-down 3/4.
- **Dimensioni:** tile 32×32 px. Personaggi in riquadri 48×48 px: l'astronauta è circa 29×41 px, con la testa grande (circa 1,3 tile di altezza).
- **Animazioni:** 6 frame per ciclo.
  - Giocatore e personaggi: 3 direzioni (giù, su, lato); la sinistra è il lato specchiato.
  - Nemici e boss: 1 vista specchiata.

### Protagonista: Vega-7

Tecnica di manutenzione di una nave mineraria, unica sopravvissuta allo schianto. Prudente e testarda, non una soldatessa. Dettagli fissi: casco grande con visiera ciano graffiata e antenna dalla punta arancione, striscia arancione sulla spalla, "7" sul petto, toppa sul ginocchio, zaino con tubi e spia verde, torcia alla cintura, display da polso, blaster ricavato da un attrezzo da miniera. Prompt in `docs/art/prompt-astronauta.md`.

### Effetti

| Effetto | Qualità alta | Qualità bassa |
|---|---|---|
| Luci dinamiche (lampada della tuta, colpi, cristalli bioluminescenti) con mappe di rilievo calcolate dagli sprite | Sì | Sì |
| Acqua: onde in movimento, rifrazione del fondo, assorbimento del colore con la profondità, riflessi capovolti di personaggio, rocce e cristalli, riflessi e scintillii delle luci, caustiche dove arriva la luce, increspature da passi e colpi, riva bagnata e schiuma | Completa | Onde semplificate, meno schiuma |
| Bloom | Sì | No |
| Nebbia a strati | Sì | No |
| Particelle (scintille, pulviscolo) | Tutte | Solo scintille |
| Ombre: ogni oggetto a terra (astronauta, rocce, cristalli) ha una macchia di contatto (niente effetto "levitazione") e proietta un'ombra da ciascuna delle 2 luci più forti vicine (proiettili in volo e cristalli), larga quanto l'oggetto, più lunga per oggetti alti e luci lontane, che ruota in tempo reale al passaggio dei colpi; i proiettili volano a mezz'aria con una piccola ombra a terra | Sì | Sì |

Il piano 4 (laboratorio allagato) è la vetrina dell'acqua.

### Pipeline

1. L'utente genera le immagini con Gemini (piano gratuito), seguendo la guida di stile e i prompt preparati da Claude. In alternativa, o in aggiunta, si usano pacchetti di pixel art CC0.
2. Prompt con sfondo a tinta unita magenta `#FF00FF`.
3. L'utente carica i file su GitHub in `art/raw/<nome-entità>/`.
4. `npm run sprites` (script `tools/clean_sprites.py`) ripulisce la pixel art generata: trova la dimensione dei pixel, li riporta su una griglia vera, riduce i colori a una palette comune a tutti i fogli del personaggio, rimuove il magenta e allinea i frame (piedi sulla stessa riga, casco centrato). Risultato in `public/sprites/<entità>/`.
5. Il gioco calcola da solo le mappe di rilievo per le luci.

6. Per le stanze, `npm run rooms` (script `tools/extract_sprites.py`) non usa una griglia fissa, perché Gemini spesso non la rispetta: trova ogni tile e ogni oggetto come regione separata dal magenta, li pulisce allo stesso modo e li numera in un foglio indice (`art/processed/rooms/<foglio>-index.png`). Per i fogli di tile la dimensione dei pixel è scelta in modo che le tile quadrate risultino 32×32. In `src/render/biome.ts` si assegna a mano quali pezzi sono pavimento, muro, porta, ostacolo, decorazione o luce.

**Regole di composizione delle stanze:** pavimento quasi uniforme (circa 85% lastre semplici, varianti rare, 0-2 macchie); al massimo 7 oggetti per stanza tra ostacoli (2-3), cristalli luminosi (1-2) e piccoli oggetti (0-2, metà dei quali luminosi). Gli oggetti luminosi hanno ognuno il suo ritmo: i cristalli pulsano, i bengala sfarfallano e a tratti si smorzano, la capsula bruciata cova come una brace, la visiera rotta si accende e si spegne come un circuito guasto (`src/rules/glow.ts`). Altre animazioni sono fatte dal gioco senza frame disegnati (`src/render/PropEffects.ts`): scintille che salgono dai cristalli, fumo dalla capsula bruciata, scintille e fumo dal bengala, sbuffi di vapore dai tubi rotti, luce rossa lampeggiante in cima alle antenne. Animazioni disegnate con Gemini (`docs/art/prompt-animazioni-piano1.md`): la fiamma del bengala (4 frame) è nel gioco; l'apertura della porta frontale è estratta in `art/processed/rooms/1-crash-door-open-strip.png` ma va usata solo con i frame 1, 2, 3 e 5 (il 4 e il 6 sono sbagliati), quando collegheremo le stanze. La porta del muro in alto usa la tile frontale; le porte laterali e quella in basso sono disegnate viste dall'alto in 3/4 (passaggio scuro, stipiti, battente di taglio con strisce di pericolo).

**Stato delle stanze:** piano 1 (sito dello schianto) nel gioco. Piani 2-5 estratti in `art/processed/rooms/`, da verificare quando si costruiscono quei piani: per gli oggetti dei piani 4 e 5 la stima dei pixel va controllata.

**Pilota (fatto):** i 5 fogli dell'astronauta generati con Gemini reggono la pulizia, quindi la pipeline Gemini è confermata. I pacchetti CC0 restano un ripiego.

### Feedback dei colpi

| Evento | Risposta |
|---|---|
| Sparo | Dardo al plasma allungato e orientato nella direzione di volo, che nasce "stirato" e si assesta con un rimbalzo; lampo a stella alla canna; guizzo di luce; piccolo contraccolpo della telecamera opposto al colpo |
| In volo | Scia luminosa che si assottiglia, leggero tremolio del plasma, luce che illumina e proietta ombre, ombra a terra |
| Impatto su muro o roccia | Scintille che rimbalzano dalla superficie, anello d'urto, flash di luce, leggera scossa dello schermo |
| Fine gittata | Il dardo cade sulla sua ombra e si spegne in qualche scintilla, oppure fa uno spruzzo e un'increspatura se cade in acqua |

Lo scuotimento dello schermo usa il "trauma" che decade nel tempo (morbido, mai a scatti casuali) ed è regolabile con `?shake=0` … `?shake=100` (percentuale).

## 10. Audio

- Effetti CC0 (Kenney, Freesound) più effetti retro generati con jsfxr.
- Musica CC0 o CC-BY, con i crediti nel gioco.
- Nessuna API a pagamento.

## 11. Milestone

| Milestone | Contenuto |
|---|---|
| **M1** (circa 3-4 settimane, grafica segnaposto) | Movimento, sparo, un piano procedurale, 3 nemici, 1 boss, 10 oggetti, test automatici |
| **M2** | Tutti i 5 piani, i 15 nemici, i 7 boss e circa 40 oggetti, sempre con segnaposto |
| **M3** | Pilota della grafica, guida di stile, prompt per Gemini, sostituzione dei segnaposto, audio. Il motore degli effetti (luci, acqua, bloom, nebbia) è già fatto nell'M1. |
| **M4** | Meta-progressione, personaggi sbloccabili, localizzazione, rifinitura, rilascio su itch.io |
