// js/data-sources.js
addMdToPage(`

### Teoretisk utgångspunkt och Hypoteser

Den rådande uppfattningen: Traditionellt har man antagit att:
- Höginkomstgrupper tenderar att rösta på högerpopulistiska/högerextrema partier
- Låginkomstgrupper tenderar mot vänsterpartier/vänsterextrema partier.

I detta projekt har jag valt att analysera den ekonomiska effekten genom:
- Genomsnittlig inkomst för kommuner indelade i tre kategorier: låg, medel och hög
- Studera dess inverkan på fyra partier som representerar:
  - Högerkanten: SD (Sverigedemokraterna)
  - Mitten-höger: Moderaterna
  - Mitten-vänster: Socialdemokraterna
  - Vänsterkanten: Vänsterpartiet

- Undersöka om det finns tydliga trender i dessa samband

Därefter fokuserade jag på det mest trendande partiet bland dessa (SD) för att:
- Studera förhållandet mellan utbildningsnivån i kommunerna och stödet för detta parti
- Undersöka om resultaten stämmer överens med de rådande teorierna i samhället eller om det finns några överraskningar

Detta projekt kan naturligtvis utvidgas i framtiden för att omfatta alla partier.

 Kan vi verifiera eller falsifiera dessa hypoteser genom denna analys?

---
## Källor till våra dataset

### Länsinformation
- **Källa**: [Wikipedia - Sveriges län](https://sv.wikipedia.org/wiki/Sveriges_län)
- **Databas**: SQLite
- **Innehåll**: Grundläggande fakta om Sveriges län (befolkning, yta, residensstad etc.)
- **Användning**: Analys av regionala skillnader i valresultat

### Inkomst- och åldersstatistik
- **Källa**: [SCB - Kommunstatistik](https://www.scb.se/hitta-statistik/sverige-i-siffror/djupdykning-i-statistik-om-sveriges-kommuner)
- **Databas**: MongoDB
- **Innehåll**: 
  - Medel- och medianinkomst per kommun (2018-2022)
  - Medelålder per kommun (2018-2022)
- **Användning**: Korrelationsanalys mellan socioekonomiska faktorer och valbeteende

### Utbildningsinformation
- **Källa**: [Statistikdatabasen - Utbildningsnivåer](https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START__UF__UF0506/Utbildning/)
- **Databas**: SQLite
- **Innehåll**: 
  - Andel högutbildade per kommun och åldersgrupp
  - Utbildningsnivåer över tid
- **Användning**: Analys av sambandet mellan utbildningsnivå och valbeteende

### Befolkningsinformation
- **Källa**: [Statistikdatabasen - Befolkningsdata](https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START__BE__BE0101__BE0101A/BefolkningNy/)
- **Databas**: SQLite
- **Innehåll**:
  - Befolkningsstorlek per kommun
  - Åldersfördelning och demografiska data
- **Användning**: Normalisering av valdata och analys av demografiska mönster

### Valresultat
- **Källa**: [Valmyndigheten](https://www.val.se/valresultat/riksdag-region-och-kommun/2022/valresultat.html)
- **Databas**: Neo4j
- **Innehåll**: Riksdagsvalsresultat per kommun för 2018 och 2022
- **Användning**: Jämförelse av valförändringar och partisympatier

### Geografisk data
- **Källa**: [Lantmäteriet (troligtvis)](https://www.lantmateriet.se/sv/geodata/Geodataportalen)
- **Databas**: MySQL
- **Innehåll**: Geografisk placering av tätorter och kommuner
- **Användning**: Geospatial analys av valresultat
`);

// Skapa en tabell för datakällor
tableFromData({
  data: [
    {
      Datakälla: 'Wikipedia - Länsinfo',
      Databas: 'SQLite',
      Användning: 'Regional analys'
    },
    {
      Datakälla: 'SCB - Inkomst/ålder',
      Databas: 'MongoDB',
      Användning: 'Socioekonomisk analys'
    },
    {
      Datakälla: 'SCB - Utbildning',
      Databas: 'SQLite',
      Användning: 'Utbildningsanalys'
    },
    {
      Datakälla: 'SCB - Befolkning',
      Databas: 'SQLite',
      Användning: 'Demografisk analys'
    },
    {
      Datakälla: 'Valmyndigheten',
      Databas: 'Neo4j',
      Användning: 'Valresultatanalys'
    },
    {
      Datakälla: 'Lantmäteriet',
      Databas: 'MySQL',
      Användning: 'Geospatial analys'
    }
  ],
  columnNames: ['Datakälla', 'Databas', 'Användning']
});

// Diagram över källfördelning
drawGoogleChart({
  type: 'PieChart',
  data: makeChartFriendly([
    {
      source: 'SCB (Inkomst, Utbildning & Befolkning)',
      percentage: 50
    },
    {
      source: 'Valmyndighetens valdata',
      percentage: 20
    },
    {
      source: 'Wikipedia (Länsdata)',
      percentage: 15
    },
    {
      source: 'Lantmäteriets geodata',
      percentage: 15
    }
  ], 'source', 'percentage'),
  options: {
    title: 'Fördelning av våra primära datakällor',
    height: 400,
    pieSliceText: 'percentage',
    slices: {
      0: { color: '#005F73' },  // SCB - Mörkblå
      1: { color: '#AE2012' },   // Valmyndigheten - Mörkröd
      2: { color: '#0A9396' },   // Wikipedia - Turkos
      3: { color: '#E9D8A6' }    // Lantmäteriet - Ljusbeige
    },
    pieHole: 0.2,
    legend: {
      position: 'labeled',
      textStyle: { fontSize: 12 }
    },
    chartArea: { width: '90%', height: '90%' },
    tooltip: {
      showColorCode: true,
      text: 'percentage'
    }
  }
});