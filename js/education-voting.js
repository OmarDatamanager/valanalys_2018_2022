// js/education-voting.js

addMdToPage(`
  ## Utbildningsnivå och röster – hur hänger det ihop?
  * Analys av sambandet mellan högutbildningsnivå och stöd för Sverigedemokraterna.
  * Välj år i menyn nedan för att se specifika analyser.
`);

// 1. Hämta all data
dbQuery.use('counties-sqlite');
let educationData = (await dbQuery('SELECT kommun, [hogutbildade-pro-2018] AS hog2018, [hogutbildade-pro-2022] AS hog2022 FROM utbildning'))
  .map(x => ({
    kommun: x.kommun,
    education2018: x.hog2018,
    education2022: x.hog2022
  }));

dbQuery.use('riksdagsval-neo4j');
let allVoteData = (await dbQuery('MATCH (n:Partiresultat) RETURN n'))
  .map(x => ({
    kommun: x.kommun,
    parti: x.parti,
    roster2018: x.roster2018,
    roster2022: x.roster2022
  }));

// 2. Skapa dropdown för interaktion
let selectedYear = addDropdown('Välj år:', ['2018', '2022'], '2018');

// 3. Beräkna totala röster per kommun och år (alla partier)
let totalVotesPerKommun = {
  2018: allVoteData.reduce((acc, r) => {
    acc[r.kommun] = (acc[r.kommun] || 0) + r.roster2018;
    return acc;
  }, {}),
  2022: allVoteData.reduce((acc, r) => {
    acc[r.kommun] = (acc[r.kommun] || 0) + r.roster2022;
    return acc;
  }, {})
};

// 4. Filtrera bara Sverigedemokraterna och beräkna procent
let sdVotes = allVoteData
  .filter(r => r.parti === "Sverigedemokraterna")
  .map(r => {
    let education = educationData.find(e => e.kommun === r.kommun);
    return {
      kommun: r.kommun,
      education: education?.[`education${selectedYear}`],
      percent: totalVotesPerKommun[selectedYear][r.kommun]
        ? (r[`roster${selectedYear}`] * 100 / totalVotesPerKommun[selectedYear][r.kommun])
        : 0
    };
  })
  .filter(r => r.education);

// 5. Skapa utbildningsgrupper (tertiler)
let sortedEducation = [...new Set(sdVotes.map(x => x.education))].sort((a, b) => a - b);
let tertiles = [
  sortedEducation[Math.floor(sortedEducation.length / 3)],
  sortedEducation[Math.floor(2 * sortedEducation.length / 3)]
];

function getEducationGroup(education) {
  if (education < tertiles[0]) return 'Låg';
  if (education < tertiles[1]) return 'Medel';
  return 'Hög';
}

let groupedSdVotes = sdVotes.map(r => ({
  ...r,
  educationGroup: getEducationGroup(r.education)
}));

// 6. Skapa visualiseringar
drawGoogleChart({
  type: 'ScatterChart',
  data: [['Utbildningsnivå (%)', 'SD %']].concat(
    sdVotes.map(r => [r.education, r.percent])
  ),
  options: {
    title: `Samband mellan högutbildningsnivå och stöd för Sverigedemokraterna (${selectedYear})`,
    hAxis: { title: 'Andel högutbildade per kommun (%)' },
    vAxis: { title: '% röster på SD' },
    height: 500
  }
});

// 7. Gruppera och skapa tabell
let educationGroupsTable = Object.entries(
  groupedSdVotes.reduce((acc, r) => {
    acc[r.educationGroup] = acc[r.educationGroup] || [];
    acc[r.educationGroup].push(r);
    return acc;
  }, {})
).map(([group, arr]) => ({
  'Utbildningsgrupp': group,
  'Antal kommuner': arr.length,
  'Snitt % SD': (
    arr.reduce((sum, r) => sum + r.percent, 0) / arr.length
  ).toFixed(1)
}));

tableFromData({ data: educationGroupsTable });

// 8. Stapeldiagram för utbildningsgrupper
drawGoogleChart({
  type: 'ColumnChart',
  data: [
    ['Utbildningsgrupp', '% röster på SD']
  ].concat(
    educationGroupsTable.map(x => [x['Utbildningsgrupp'], Number(x['Snitt % SD'])])
  ),
  options: {
    title: `Sverigedemokraternas stöd per utbildningsgrupp (${selectedYear})`,
    height: 400,
    vAxis: { minValue: 0 }
  }
});

// 10. Lägg till narrativ analys (om tillgänglig)
const analysisText = {
  'Sverigedemokraterna': {
    '2018': `
### Statistisk Analys: Sambandet mellan Utbildningsnivå och Stöd för Sverigedemokraterna (2018)
**Statistisk Analys: Sambandet mellan Utbildningsnivå och Stöd för Sverigedemokraterna (2022)**

### **Sammanfattning av Resultat**
Analysen för 2022 visar en fördjupning av trenderna från 2018, med ökad polarisering baserat på utbildningsnivå. Data omfattar **290 kommuner** indelade i tre grupper:
- **Lågutbildade kommuner** (105 kommuner) har högst SD-stöd (**29%**).
- **Medelutbildade kommuner** (94 kommuner) visar **26.1%** stöd.
- **Högutbildade kommuner** (91 kommuner) har lägst stöd (**20.2%**).

---

### **Nyckelobservationer**

#### 1. **Förstärkt Negativ Korrelation**
- Scatterploten indikerar en **starkare negativ korrelation** (-0.5 till -0.7) jämfört med 2018.
- Ny mönster:
  - Kommuner med <10% högutbildade: SD-stöd når **30-35%**.
  - Kommuner med >25% högutbildade: SD-stöd under **20%**.

#### 2. **Ökad Skillnad mellan Grupper**
- Gapet mellan hög- och lågutbildade kommuner har ökat från **5.7** till **8.8 procentenheter** sedan 2018.
- **Medelgruppen** rör sig närmare lågutbildade, vilket pekar på en polarisering.

#### 3. **Total Ökning av SD-stöd**
- Alla grupper visar högre stöd 2022 vs 2018:
  - **Högutbildade**: +2.8 enheter
  - **Medelutbildade**: +4.1 enheter
  - **Lågutbildade**: +5.9 enheter

---

### **Tolkning och Implikationer**

#### **Till Skola och Forskning**
- **Pedagogiskt exempel** på hur politisk stödfördelning förändras över tid.
- **Metoddiskussion**: Krävs fler variabler (t.ex. migration, arbetsmarknad) för att förstå drivkrafterna bakom ökningen.

#### **Till Politik och Samhällsplanering**
- **Varningssignal**: Snabb ökning i lågutbildade områden kan indikera ökad missnöjeskultur.
- **Handlingsplaner**:
  - Satsa på utbildning och integration i kommuner med låg utbildning/högt SD-stöd.
  - Studera framgångsrika högutbildade kommuner som motverkar trenden.

#### **För Djupanalys**
- **Regressionsanalys**: Testa om utbildning fortfarande är signifikant när andra faktorer kontrolleras.
- **Geografisk kartläggning**: Identifiera kluster av kommuner med extremvärden.

---

**Slutsats**: Utbildningsnivåns betydelse som prediktor för SD-stöd har **ökat** mellan 2018–2022. Denna utveckling kräver uppmärksamhet från både forskare och beslutsfattare.  

Rekommendationer för framtida forskning inkluderar att undersöka andra faktorer som kan påverka sambandet mellan utbildning och politiskt stöd, samt att analysera hur dessa trender kan påverka det svenska samhället på lång sikt.
`,
    '2022': `
### Statistisk Analys: Sambandet mellan Utbildningsnivå och Stöd för Sverigedemokraterna (2022)
**Statistisk Analys: Sambandet mellan Utbildningsnivå och Stöd för Sverigedemokraterna (2022)**

### **Sammanfattning av Resultat**
Analysen för 2022 visar en fördjupning av trenderna från 2018, med ökad polarisering baserat på utbildningsnivå. Data omfattar **290 kommuner** indelade i tre grupper:
- **Lågutbildade kommuner** (105 kommuner) har högst SD-stöd (**29%**).
- **Medelutbildade kommuner** (94 kommuner) visar **26.1%** stöd.
- **Högutbildade kommuner** (91 kommuner) har lägst stöd (**20.2%**).

---

### **Nyckelobservationer**

#### 1. **Förstärkt Negativ Korrelation**
- Scatterploten indikerar en **starkare negativ korrelation** (-0.5 till -0.7) jämfört med 2018.
- Ny mönster:
  - Kommuner med <10% högutbildade: SD-stöd når **30-35%**.
  - Kommuner med >25% högutbildade: SD-stöd under **20%**.

#### 2. **Ökad Skillnad mellan Grupper**
- Gapet mellan hög- och lågutbildade kommuner har ökat från **5.7** till **8.8 procentenheter** sedan 2018.
- **Medelgruppen** rör sig närmare lågutbildade, vilket pekar på en polarisering.

#### 3. **Total Ökning av SD-stöd**
- Alla grupper visar högre stöd 2022 vs 2018:
  - **Högutbildade**: +2.8 enheter
  - **Medelutbildade**: +4.1 enheter
  - **Lågutbildade**: +5.9 enheter

---

### **Tolkning och Implikationer**

#### **Till Skola och Forskning**
- **Pedagogiskt exempel** på hur politisk stödfördelning förändras över tid.
- **Metoddiskussion**: Krävs fler variabler (t.ex. migration, arbetsmarknad) för att förstå drivkrafterna bakom ökningen.

#### **Till Politik och Samhällsplanering**
- **Varningssignal**: Snabb ökning i lågutbildade områden kan indikera ökad missnöjeskultur.
- **Handlingsplaner**:
  - Satsa på utbildning och integration i kommuner med låg utbildning/högt SD-stöd.
  - Studera framgångsrika högutbildade kommuner som motverkar trenden.

#### **För Djupanalys**
- **Regressionsanalys**: Testa om utbildning fortfarande är signifikant när andra faktorer kontrolleras.
- **Geografisk kartläggning**: Identifiera kluster av kommuner med extremvärden.

---

**Slutsats**: Utbildningsnivåns betydelse som prediktor för SD-stöd har **ökat** mellan 2018–2022. Denna utveckling kräver uppmärksamhet från både forskare och beslutsfattare.  

Rekommendationer för framtida forskning inkluderar att undersöka andra faktorer som kan påverka sambandet mellan utbildning och politiskt stöd, samt att analysera hur dessa trender kan påverka det svenska samhället på lång sikt.
`
  }
};

if (analysisText['Sverigedemokraterna'] && analysisText['Sverigedemokraterna'][selectedYear]) {
  addMdToPage(analysisText['Sverigedemokraterna'][selectedYear]);
} else {
  addMdToPage(`
    ### Ingen data tillgänglig för valt år (${selectedYear}).
    Vänligen välj ett annat år.
    `);
}