# Gruppinlämning/projektarbete: En berättelse om Sverige och våra senaste två riksdagsval



##  **Teknisk rapport: Inkomst och röster – Interaktiv visualisering**

###  **Syfte**
Syftet med uppgiften var att analysera sambandet mellan medelinkomst och röstandel för fyra huvudpartier i Sverige:  
**Moderaterna, Socialdemokraterna, Sverigedemokraterna och Vänsterpartiet**,  
för riksdagsvalen **2018** och **2022**, samt möjliggöra **interaktiv analys** genom val av år och parti på en och samma sida.

---

##  **Problemidentifiering och lösningar**

###  1. **Begränsad interaktivitet – Ingen möjlighet att välja år/parti**
####  Problem
Ett av de största problemen i de tidigare försöken var att den interaktiva visningen misslyckades på grund av användningen av chooseOne(), en funktion som inte var definierad eller stödd i miljön. Detta ledde till att användaren inte kunde välja år eller parti dynamiskt, och visningen bröts med felmeddelanden i konsolen.
####  Lösning
Införa två interaktiva dropdown-menyer:
```js
let selectedParty = addDropdown('Välj parti:', huvudpartier, 'Moderaterna');
let selectedYear = addDropdown('Välj år:', ['2018', '2022'], '2018');
```

####  Resultat
Användaren kan nu **välja valfritt parti och år direkt i gränssnittet**, och visualiseringarna uppdateras dynamiskt baserat på valen.

---

###  2. **Fel vid användning av `groupBy` – Funktion inte definierad**
####  Problem
Den tidigare koden försökte använda `s.groupBy`, vilket orsakade ett körfel eftersom `groupBy` inte är en definierad funktion i det aktuella JavaScript-miljön.

####  Lösning
Ersätta `groupBy` med `reduce()`:
```js
let totalVotesPerKommun = {
  2018: voteData.reduce((acc, r) => { ... }, {}),
  2022: voteData.reduce((acc, r) => { ... }, {})
};
```

####  Resultat
Beräkningen av totala röster per kommun per år fungerar nu stabilt utan externa beroenden.

---

###  4. **Felaktig sammanslagning av inkomst- och röstdata**
####  Problem
Vid sammanfogning av inkomst- och röstdata kunde vissa kommuner orsaka `undefined`-fel om informationen saknades i någon av datakällorna.

####  Lösning
Införa en `?.`-kontroll för att säkert hämta inkomstvärdet:
```js
meanIncome: income?.[`meanIncome${selectedYear}`]
```

####  Resultat
Ingen krasch uppstår vid ofullständig data – problemet hanteras diskret och datavisualiseringen fungerar korrekt.


##  **Slutresultat**

### Funktioner som nu stöds:
-  Dynamiskt val av **parti och år** i samma vy.
-  Robust hantering av **ofullständig data**.
-  Flera **diagram och tabeller** som uppdateras automatiskt.
-  Ingen behov av att kopiera kodblock manuellt.

### Använda tekniker:
- `addDropdown` för interaktivitet.
- `reduce()` för dataaggregering.
- Google Charts för visualisering.
- Ternär logik och `?.` för säker datatillgång.

---

### **Dokumentation: Analys och Integration av Partidata i Inkomst-Röstningssystemet**

#### **1. Bakgrund och Mål**  
Under de senaste uppdragen har vi genomfört en omfattande analys av sambandet mellan **medelinkomst och väljarstöd** för tre svenska partier:  
- **Moderaterna**  
- **Sverigedemokraterna**  
- **Vänsterpartiet**  

Målet var att:  
1. **Visualisera sambandet** mellan inkomstnivå och röstfördelning per kommun.  
2. **Skapa en interaktiv webbapplikation** där användare kan välja parti och år för att se analyser.  
3. **Integrera professionella analyser** direkt i systemet baserat på användarval.  

---

#### **2. Metod och Arbetsprocess**  

##### **A. Datainsamling och Bearbetning**  
- **Datakällor**:  
  - **MongoDB** för inkomstdata (`medelInkomst2018`, `medelInkomst2022`).  
  - **Neo4j** för valresultat (`roster2018`, `roster2022`).  
- **Databearbetning**:  
  - Beräkning av **procentuellt stöd** per kommun.  
  - Gruppering av kommuner i **inkomsttertiler** (Låg/Medel/Hög).  

##### **B. Visualisering**  
- **Scatterplot-diagram**:  
  - Visar förhållandet mellan **medelinkomst (X-axel)** och **partistöd (Y-axel)**.  
  - Implementerad med **Google Charts**.  
- **Stapeldiagram**:  
  - Jämför **snittstöd** mellan inkomstgrupper.  

##### **C. Interaktivitet**  
- **Dropdown-menyer** för val av:  
  - Parti (`Moderaterna`, `Sverigedemokraterna`, `Vänsterpartiet`).  
  - Årtal (`2018`, `2022`).  
- **Dynamisk uppdatering** av diagram och analyser vid användarval.  

##### **D. Integrering av Professionella Analyser**  
- **Analyserna** skrevs på svenska och strukturerades som **Markdown-text**.  
- **Textdatabas**: Lagrad i ett **JavaScript-objekt** (`analysisText`) med nycklar för parti och år.  
- **Renderingsfunktion**:  
  ```javascript
  if (analysisText[selectedParty] && analysisText[selectedParty][selectedYear]) {
      addMdToPage(analysisText[selectedParty][selectedYear]);
  }
  ```  

---

#### **3. Utmaningar och Lösningar**  

##### **A. Datakvalitet och Komplettering**  
- **Problem**: Vissa kommuner saknade inkomstdata.  
- **Lösning**: Filtrering av ofullständiga datapunkter med:  
  ```javascript
  .filter(r => r.meanIncome)
  ```  

##### **B. Dynamisk Analysvisning**  
- **Problem**: Analyserna behövde uppdateras utan att påverka diagrammen.  
- **Lösning**: Separata funktioner för visualisering och textrenderering.  

##### **C. Prestanda**  
- **Problem**: Långsamma databasfrågor vid flera användarval.  
- **Lösning**: Caching av data i minnet efter första hämtningen.  

Caching-lösningen implementerades genom att:  

1. **Hämta all data en gång** vid start:  
   ```javascript
   let incomeData = await dbQuery.collection('incomeByKommun').find({ kon: 'totalt' });
   let voteData = await dbQuery('MATCH (n:Partiresultat) RETURN n');
   ```  

2. **Lagra datan i variabler** (`incomeData`, `voteData`) som återanvänds vid varje användarval, istället för att köra nya databasfrågor.  

3. **Filtrera lokalt** i klienten:  
   ```javascript
   let filteredVotes = enrichedVotes.filter(r => r.parti === selectedParty);
   ```  

Ingen explicit cache-mekanism behövdes – data hämtas bara en gång och bearbetas sedan i minnet.

---

#### **4. Slutresultat**  
Systemet ger nu:  
1. **Interaktiva diagram** som uppdateras i realtid.  
2. **Djupanalyser** anpassade efter användarval.  
3. **Tydliga socioekonomiska mönster** för varje parti.  

---

#### **5. Förbättringspotential**  
- **Utökad datakälla**: Inkludera fler partier och valår.  
- **Avancerad statistik**: Regression för att kvantifiera sambandsstyrka.  
- **Mobiloptimering**: Responsiv design för små skärmar.  


### **Sammanfattning**  
Genom **strukturerad databehandling**, **tydlig visualisering** och **användarvänlig interaktivitet** har vi skapat ett robust system för politisk analys. Lösningarna på utmaningarna säkerställde **tillförlitlighet** och **prestanda**, med fokus på **språklig precision** för svenska användare.  

---  

# **Dokumentation: Integrering av Utbildningsdata**

## **Syfte**  
Dokumenterar insamling, bearbetning och integration av utbildningsdata från SCB:s Statistikdatabas för analys av sambandet mellan utbildningsnivå och valbeteende i svenska kommuner. Målet är att skapa en gemensam databas för tvärvetenskapliga analyser.

---

## **Datakällor**  
1. **SCB Statistikdatabasen**  
   - **Befolkning efter utbildningsnivå**  
     - Använt filter: `Eftergymnasial utbildning, 3 år eller mer`  
     - Årtal: 2018 och 2022  
     - Könsaggregering: Sammanlagda värden för män och kvinnor  

   - **Folkmängd per kommun** 
     - Använda variabler: `Folkmängd`  


## **Databearbetning**  

### Datainsamling**  
- Extraherade rådata för högutbildade (≥3 års eftergymnasial utbildning) och total befolkning per kommun.  

*"Data sammanställdes manuellt i Excel genom att kombinera relevanta dataset från SCB:s webbgränssnitt. Den slutliga datan exporterades sedan som CSV-filer för import till SQLite. En framtida automatisering av detta steg är möjlig genom direkt API-anslutning till SCB:s system."*  

### Förtydligande:
1. **Manuell bearbetning**:  
   - Kombination av dataset gjordes i Excel (ex: högutbildade + folkmängd)  
   - Rensning och beräkning av procentsatser utfördes manuellt  

2. **Export till CSV**:  
   - Excel-filerna sparades som CSV för kompatibilitet med SQLiteStudio  
### **2. Datarensning**  
- Sammanfogade könsdata till en gemensam kolumn (`hogutbildade-2018`, `hogutbildade-2022`).  
- Beräknade andel högutbildade:  
  ```  

- Kontrollerade saknade värden och felaktiga kommunkoder.  

### **3. Integration i SQLite**  
- Skapade tabellen `utbildning` i `counties.sqlite3` med följande struktur:  

  | Kolumn               | Datatyp | Beskrivning                     |  
  |----------------------|---------|---------------------------------|  
  | `kommun-n`           | TEXT    | Kommunens numeriska kod         |  
  | `kommun`             | TEXT    | Kommunens namn                  |  
  | `hogutbildade-2018`  | INTEGER | Antal högutbildade 2018         |  
  | `hogutbildade-2022`  | INTEGER | Antal högutbildade 2022         |  
  | `befolkning-2018`    | INTEGER | Total befolkning 2018           |  
  | `befolkning-2022`    | INTEGER | Total befolkning 2022           |  
  | `hogutbildade-pro-2018` | REAL | Andel högutbildade 2018 (%)     |  
  | `hogutbildade-pro-2022` | REAL | Andel högutbildade 2022 (%)     |  

- Importerade data via SQLiteStudio med validering av datatyper.  

---

## **Analysmöjligheter**  
Den integrerade databasen möjliggör:  

1. **Korrelationer**  
   - Samband mellan utbildningsnivå och valresultat för specifika partier.  
   - Jämförelser mellan kommuner över tid (2018 vs 2022).  

2. **Visualiseringar**  
   - Kartor över utbildningsnivåer vs. politisk lutning.  
   - Trendanalyser för utvecklingen av högutbildade.  

3. **Avancerade modeller**  
   - Multivariata analyser med andra socioekonomiska faktorer (ex. inkomst, arbetslöshet).  

---

## **Dataqualitet & Begränsningar**  
- **Täckning**: Data inkluderar alla 290 kommuner.  
- **Noggrannhet**: SCB-data är officiell statistik med hög tillförlitlighet.  
- **Begränsningar**:  
  - Saknar indelning efter åldersgrupper.  
  - Ingen uppdelning mellan inhemsk/utländsk bakgrund.  


## **Nästa Steg**  
1. Koppla `utbildning`-tabellen till befintliga valdatabaser via `kommun`.  
2. Utveckla interaktiva dashboards för jämförelser.  
3. Testa statistiska signifikanser i sambanden.  



**Statistisk Analys: Sambandet mellan Utbildningsnivå och Stöd för Sverigedemokraterna (2018)**  

### **Sammanfattning av Resultat**  
Analysen visar ett tydligt samband mellan utbildningsnivå och stöd för Sverigedemokraterna (SD) i svenska kommuner år 2018. Data baseras på **290 kommuner** indelade i tre utbildningsgrupper (Låg, Medel, Hög), där:  
- **Lågutbildade kommuner** (101 kommuner) visade högst stöd för SD (**23.1%**).  
- **Medelutbildade kommuner** (97 kommuner) följde med **22%** stöd.  
- **Högutbildade kommuner** (92 kommuner) hade lägst stöd (**17.4%**).  

---

### **Nyckelobservationer**  

#### 1. **Negativ Korrelation mellan Utbildning och SD-stöd**  
- Scatterploten visar ett **måttligt negativt samband** (≈ -0.4 till -0.6 baserat på dataspridningen).  
- Tendens: Ju högre andel högutbildade, desto lägre andel SD-röster. Exempel:  
  - Kommuner med <10% högutbildade: SD-stöd kring **25-30%**.  
  - Kommuner med >20% högutbildade: SD-stöd under **15%**.  

#### 2. **Skillnader mellan Utbildningsgrupper**  
- **Lågutbildade kommuner** hade **5.7 procentenheter** högre SD-stöd jämfört med högutbildade.  
- Stödet i **medelgruppen** låg nära lågutbildade, vilket tyder på att utbildning har störst effekt i extremgrupperna.  

#### 3. **Statistisk Signifikans**  
- En **t-test** mellan hög- och lågutbildade grupper visar sannolikt en signifikant skillnad (*p < 0.01*), men detta kräver ytterligare tester med rådata.  

---

### **Tolkning och Rekommendationer**  

#### **Till Lärare/Studenter**  
- **Pedagogisk Poäng**: Analysen kan diskuteras i samhällskunskap/statistik för att illustrera hur socioekonomiska faktorer påverkar politiska trender.  
- **Metodkritik**: Korrelation innebär inte kausalitet. Andra faktorer (t.ex. arbetslöshet, urbanisering) kan vara confounders.  

#### **Till Beslutstagare**  
- **Policyimplikationer**: Satsningar på utbildning i lågutbildade regioner kan indirekt påverka politiska mönster.  
- **Kommunanalys**: Identifiera kommuner med låg utbildning/högt SD-stöd för riktade insatser.  

#### **För Forskningsdjup**  
- **Multivariat analys**: Inkludera fler variabler (medianinkomst, invandring) för att isolera utbildningens effekt.  
- **Tidsserieanalys**: Jämför med 2022-data för att se trender över tid.  


### **Grafisk Sammanfattning**  
```plaintext
SD-stöd (2018) per utbildningsgrupp:
Hög    [███████████] 17.4%  
Medel  [█████████████] 22%  
Låg    [██████████████] 23.1%  
```

**Slutsats**: Utbildningsnivå är en **viktig prediktor** för SD-stöd, men andra faktorer bör undersökas för en helhetsförståelse.  

---

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


### **Grafisk Sammanfattning**  
```plaintext
SD-stöd (2022) per utbildningsgrupp:  
Hög    [████████████] 20.2%  
Medel  [████████████████] 26.1%  
Låg    [██████████████████] 29%  
```

**Slutsats**: Utbildningsnivåns betydelse som prediktor för SD-stöd har **ökat** mellan 2018–2022. Denna utveckling kräver uppmärksamhet från både forskare och beslutsfattare.  


# Statistics Template JS
© ironboy/NodeHill 2025
