# 🚌 ANM Deposito

Gestione uscite mezzi — Deposito Cavalleggeri d'Aosta · ANM Napoli

## Funzionalità

- **Giornata**: registra schede turno con riprese multiple, più mezzi per ripresa (sostituzione in caso di guasto), tipo rientro (deposito / smonto in linea)
- **Anagrafica**: lista completa dei mezzi del deposito con stato (Buono / Guasto / Manutenzione / Fuori servizio), aggiornabile in qualsiasi momento
- **Storico**: archivio giornaliero con ricerca per mezzo, data e linea

## Come usare

Apri direttamente `index.html` nel browser oppure vai su:

👉 **https://chicco81.github.io/ANM-Deposito**

## Tecnologie

- React 18 UMD (no build, no Node required)
- Babel Standalone per JSX
- localStorage per persistenza dati
- PWA-ready (installabile su mobile)

## Struttura file

```
index.html   → entry point
app.jsx      → tutta l'applicazione React
manifest.json → PWA manifest
icon-192.png  → icona app
icon-512.png  → icona app
```

---

*Progetto interno — Operatore d'Esercizio ANM, matricola 50270*
