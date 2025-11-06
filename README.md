# HenVenn - Ortopedisk Henvisningstriagering

En webapplikasjon for å hjelpe ortopeder på sykehus å triagere henvisninger fra fastleger etter inntaksfrist.

## Funksjonalitet

- **Last opp PDF-henvisninger**: Last opp PDF-filer med flere henvisninger (opptil 10)
- **AI-assistert triagering**: AI trekker ut nøkkelinformasjon og gir tentative diagnoser
- **Automatisk kategorisering**: Henvisningene grupperes etter hastegrad:
  - 🔴 **Rød**: Inntaksfrist ≤ 4 uker
  - 🟠 **Oransje**: Inntaksfrist 5-12 uker
  - 🟢 **Grønn**: Inntaksfrist > 12 uker
  - ⚪ **Vurderes avvist**: Henvisninger som kan håndteres i primærhelsetjenesten
- **Detaljert visning**: Se fullstendig henvisningstekst og AI-vurdering side-om-side
- **Chatbot-assistanse**: Still spørsmål om triageringsvurderingene

## Design

Applikasjonen følger et todelt layout:

### Venstre panel:
- Opplastningsknapp for PDF-filer
- Triageringsgrupper med fargekodede indikatorer
- Nedtrekksmeny for hver henvisning med:
  - Nøkkeloppsummering
  - Tentativ diagnose
  - Differensialdiagnoser
  - Anbefalt inntaksfrist eller avvisningsårsak
- Stasjonær chatbot nederst

### Høyre panel:
- Fullstendig henvisningstekst fra opplastet PDF
- Stasjonær chatbot for spørsmål om spesifikke henvisninger

## Teknologi

- **Frontend**: React 18 med TypeScript
- **Build tool**: Vite
- **Styling**: CSS med custom styling
- **PDF-behandling**: PDF.js (planlagt)
- **AI-integrasjon**: Integrasjon med Helsedirektoratets API (planlagt)

## Installasjon

1. Klon repositoriet:
```bash
git clone <repository-url>
cd HenVenn
```

2. Installer avhengigheter:
```bash
npm install
```

## Kjøring

Start utviklingsserveren:
```bash
npm run dev
```

Applikasjonen vil være tilgjengelig på `http://localhost:5173`

## Bygging for produksjon

Bygg applikasjonen:
```bash
npm run build
```

Forhåndsvis produksjonsbygget:
```bash
npm run preview
```

## Utvikling

### Filstruktur

```
HenVenn/
├── src/
│   ├── components/
│   │   ├── Header.tsx/css
│   │   ├── LeftPanel.tsx/css
│   │   ├── RightPanel.tsx/css
│   │   ├── FileUpload.tsx/css
│   │   ├── TriageGroups.tsx/css
│   │   └── ChatBot.tsx/css
│   ├── types.ts
│   ├── mockData.ts
│   ├── App.tsx/css
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Fargepalett

- **Bakgrunn**: Lyseblå (#E6F3FF)
- **Logo**: Mørkeblå (#003d7a)
- **Chatbot-bokser**: Hvit (#FFFFFF)
- **Nedtrekksmenyer**: Grå (#d3d3d3)
- **Rød gruppe**: #e74c3c
- **Oransje gruppe**: #e67e22
- **Grønn gruppe**: #27ae60
- **Avvist gruppe**: #7f8c8d

## Kommende funksjoner

- [ ] PDF-parsing med faktisk tekstekstraksjon
- [ ] Integrasjon med Helsedirektoratets prioriteringsveileder API
- [ ] AI-modell for vurdering og triagering
- [ ] Eksport av triageringsoversikt
- [ ] Brukerautentisering
- [ ] Historikk og lagring av tidligere triageringer

## Lisens

[Lisens TBD]

## Kontakt

For spørsmål eller tilbakemeldinger, kontakt utviklingsteamet.
