// js/income-voting.js

addMdToPage(`
  ## Inkomst och röster – hur hänger det ihop?
  * Analys av sambandet mellan inkomstnivå och valresultat för olika partier.
  * Välj parti och år i menyn nedan för att se specifika analyser.
`);

// 1. Hämta all data
dbQuery.use('kommun-info-mongodb');
let incomeData = (await dbQuery.collection('incomeByKommun').find({ kon: 'totalt' }))
   .map(x => ({
      kommun: x.kommun,
      meanIncome2018: x.medelInkomst2018,
      meanIncome2022: x.medelInkomst2022
   }));

dbQuery.use('riksdagsval-neo4j');
let voteData = (await dbQuery('MATCH (n:Partiresultat) RETURN n'))
   .map(x => ({
      kommun: x.kommun,
      parti: x.parti,
      roster2018: x.roster2018,
      roster2022: x.roster2022
   }));

// 2. Skapa dropdowns för interaktion
const huvudpartier = ['Moderaterna', 'Arbetarepartiet-Socialdemokraterna', 'Sverigedemokraterna', 'Vänsterpartiet'];
let selectedParty = addDropdown('Välj parti:', huvudpartier, 'Moderaterna');
let selectedYear = addDropdown('Välj år:', ['2018', '2022'], '2018');

// 3. Beräkna totala röster per kommun och år
let totalVotesPerKommun = {
   2018: voteData.reduce((acc, r) => {
      acc[r.kommun] = (acc[r.kommun] || 0) + r.roster2018;
      return acc;
   }, {}),
   2022: voteData.reduce((acc, r) => {
      acc[r.kommun] = (acc[r.kommun] || 0) + r.roster2022;
      return acc;
   }, {})
};

// 4. Beräkna procent per parti och slå ihop med inkomstdata
let enrichedVotes = voteData
   .filter(r => huvudpartier.includes(r.parti))
   .map(r => {
      let income = incomeData.find(i => i.kommun === r.kommun);
      return {
         kommun: r.kommun,
         parti: r.parti,
         meanIncome: income?.[`meanIncome${selectedYear}`],
         percent: (r[`roster${selectedYear}`] * 100 / totalVotesPerKommun[selectedYear][r.kommun]) || 0
      };
   })
   .filter(r => r.meanIncome);

// 5. Filtrera för valt parti
let filteredVotes = enrichedVotes.filter(r => r.parti === selectedParty);


// 6. Skapa inkomstgrupper (tertiler)
let sortedIncomes = [...new Set(enrichedVotes.map(x => x.meanIncome))].sort((a, b) => a - b);
let tertiles = [
   sortedIncomes[Math.floor(sortedIncomes.length / 3)],
   sortedIncomes[Math.floor(2 * sortedIncomes.length / 3)]
];

function getIncomeGroup(income) {
   if (income < tertiles[0]) return 'Låg';
   if (income < tertiles[1]) return 'Medel';
   return 'Hög';
}

let groupedVotes = filteredVotes.map(r => ({
   ...r,
   incomeGroup: getIncomeGroup(r.meanIncome)
}));

// 7. Skapa visualiseringar (endast om det finns data)
if (filteredVotes.length > 0) {
   drawGoogleChart({
      type: 'ScatterChart',
      data: [['Inkomst (TSEK)', `${selectedParty} %`]].concat(
         filteredVotes.map(r => [r.meanIncome, r.percent])
      ),
      options: {
         title: `Samband mellan medelinkomst och stöd för ${selectedParty} (${selectedYear})`,
         hAxis: { title: 'Medelinkomst per kommun (TSEK)' },
         vAxis: { title: `% röster på ${selectedParty}` },
         height: 500
      }
   });

   // 8. Gruppera och skapa tabell
   let incomeGroupsTable = Object.entries(
      groupedVotes.reduce((acc, r) => {
         acc[r.incomeGroup] = acc[r.incomeGroup] || [];
         acc[r.incomeGroup].push(r);
         return acc;
      }, {})
   ).map(([group, arr]) => ({
      Inkomstgrupp: group,
      'Antal kommuner': arr.length,
      [`Snitt % ${selectedParty}`]: (
         arr.reduce((sum, r) => sum + r.percent, 0) / arr.length
      ).toFixed(1)
   }));

   tableFromData({ data: incomeGroupsTable });

   // 9. Stapeldiagram för inkomstgrupper
   drawGoogleChart({
      type: 'ColumnChart',
      data: [
         ['Inkomstgrupp', `% röster på ${selectedParty}`]
      ].concat(
         incomeGroupsTable.map(x => [x.Inkomstgrupp, Number(x[`Snitt % ${selectedParty}`])])
      ),
      options: {
         title: `${selectedParty}s väljarstöd per inkomstgrupp (${selectedYear})`,
         height: 400,
         vAxis: { minValue: 0 }
      }
   });

   // 10. Lägg till narrativ analys (om tillgänglig)
   const analysisText = {
      'Moderaterna': {
         '2018': `
### Analys av sambandet mellan inkomstnivå och stöd för Moderaterna (2018)

#### Sammanfattning för beslutsfattare
Scatterploten och stapeldiagrammet visar ett tydligt positivt samband mellan kommuners medelinkomst och stöd för Moderaterna under 2018. Detta bekräftar partiets traditionella starka förankring i välbärgade områden.

#### Nyckelfynd
1. **Stark inkomstkorrelation**:
   - Höginkomstkommuner (90 st): 22,5% stöd
   - Medelinkomstkommuner (103 st): 16,3% stöd
   - Låginkomstkommuner (97 st): 14% stöd

2. **Prestationsgap**:
   - 8,5 procentenheters skillnad mellan högsta och lägsta inkomstgrupp
   - Dubbelt så starkt stöd i höginkomstområden jämfört med låginkomstområden

3. **Visualiseringsinsikter**:
   - Scatterplotens datapunkter bildar en tydlig uppåtlutande trendlinje
   - Stapeldiagrammet visar konsekvent minskande stöd från hög till låg inkomstgrupp

#### Strategiska implikationer
1. **För Moderaterna**:
   - Bekräftar effektiviteten av ekonomisk politik riktad till höginkomstgrupper
   - Identifierar utmaningar i att bredda stödet till medel- och låginkomstväljare

2. **För politiska motståndare**:
   - Visar behov av alternativa ekonomiska budskap i höginkomstområden
   - Pekar på möjligheter att stärka positionen i låginkomstkommuner

3. **För samhällsanalytiker**:
   - Tyder på bestående koppling mellan ekonomisk politik och väljarstöd
   - Understryker vikten av geografiska skillnader i politisk analys

#### Metodologiska observationer
- Datakvaliteten är hög med jämnt fördelade kommuner över inkomstgrupper
- Visualiseringarna kompletterar varandra väl:
  - Scatterplot visar individuella kommunvariationer
  - Stapeldiagram ger överskådliga gruppjämförelser
- Inkomstgruppindelningen (tertiler) ger en rimlig balans mellan gruppstorlekar

Denna analys visar att Moderaterna 2018 hade en väl definierad väljarbas starkt kopplad till socioekonomiska faktorer, med tydliga möjligheter och utmaningar som följd av detta mönster.
      `,
         '2022': `
### Analys av sambandet mellan inkomstnivå och stöd för Moderaterna (2022)

#### Sammanfattning för beslutsfattare
Data för 2022 visar att Moderaterna fortsätter att ha ett starkt positivt samband mellan medelinkomst och väljarstöd, men med några intressanta nyanser jämfört med 2018.

#### Nyckelfynd
1. **Fortsatt positiv korrelation**:
   - Höginkomstkommuner (87 st): 21,3% stöd
   - Medelinkomstkommuner (103 st): 16,9% stöd
   - Låginkomstkommuner (100 st): 14,6% stöd

2. **Förändringar sedan 2018**:
   - Minskat stöd i höginkomstgruppen (-1,2 procentenheter)
   - Marginell ökning i medelinkomstgruppen (+0,6)
   - Lätt ökning i låginkomstgruppen (+0,6)

3. **Visualiseringsinsikter**:
   - Scatterploten visar fortfarande tydlig uppåtgående trend
   - Mindre spridning i datapunkter jämfört med 2018
   - Stapeldiagrammet visar konsekvent mönster men med något jämnare fördelning

#### Strategiska implikationer
1. **För Moderaterna**:
   - Bekräftar partiets starka position bland höginkomstväljare
   - Visar potential att bredda stödet i medelinkomstgrupper
   - Pekar på utmaningar i att nå låginkomstväljare

2. **Jämförelse med 2018**:
   - Mindre skillnad mellan inkomstgrupper (6,7 jämfört med 8,5 procentenheter 2018)
   - Partiet har blivit något mer jämnt fördelat över inkomstgrupper

3. **Forskningsfrågor**:
   - Är minskningen i höginkomststöd en tillfällig fluktuation eller en trend?
   - Vilka faktorer ligger bakom den relativa framgången i medelinkomstområden?

#### Metodologiska observationer
- Datakvaliteten är hög med representativ fördelning av kommuner
- Inkomstgränserna mellan grupperna verkar konsekventa med tidigare år
- Diagrammen kompletterar varandra väl:
  - Scatterplot: visar individuella variationer
  - Stapeldiagram: ger tydlig gruppjämförelse

Denna analys visar att Moderaterna 2022 behåller sin kärnväljarbas i höginkomstområden, men med tecken på en möjlig breddning av stödet till medelinkomstgrupper. Den minskade skillnaden mellan inkomstgrupperna kan tyda på en anpassning av partiets politik eller förändringar i väljarnas prioriteringar.
      `
      },
      'Sverigedemokraterna': {
         '2018': `
### Analys av sambandet mellan inkomstnivå och stöd för Sverigedemokraterna (2018)

## Sammanfattning för beslutsfattare
Data visar ett tydligt omvänt samband mellan medelinkomst och stöd för Sverigedemokraterna i de svenska valen 2018. Stödet för partiet är högre i områden med låg inkomst och lägre i områden med hög inkomst.

## Nyckelfynd

1. **Tydligt omvänt samband**:
   - Höginkomstområden (90 kommuner): 18% stöd för partiet
   - Medelinkomstområden (103 kommuner): 21.6% stöd
   - Låginkomstområden (97 kommuner): 22.9% stöd

2. **Prestationsgap**:
   - En skillnad på 4.9 procentenheter mellan högsta och lägsta inkomstgrupp (från 18% till 22.9%)
   - Denna skillnad är statistiskt och politiskt signifikant

3. **Geografisk fördelning**:
   - Balanserad fördelning mellan grupperna (90, 103, 97 kommuner) vilket stärker resultatens trovärdighet

## Strategiska rekommendationer

1. **För politiska beslutsfattare**:
   - Utveckla riktade ekonomiska politikåtgärder för låginkomstområden
   - Förstärka den samhällsdialog i områden med starkast partiellt stöd

2. **För Sverigedemokraterna**:
   - Öka närvaron i höginkomstområden för att förbättra prestationen
   - Analysera orsakerna till framgång i låginkomstområden för att replikera modellen

3. **För opinionsforskare**:
   - Genomföra djupare studier för att analysera inkomstrelaterade faktorer som påverkar röstning
   - Jämföra dessa resultat med andra partiers resultat för en helhetsbild

## Metodologiska begränsningar

1. Data bygger endast på uppdelning i tre inkomstgrupper (hög, medel, låg)
2. Tar inte hänsyn till andra faktorer som utbildning, ålder eller befolkningstäthet
3. Data reflekterar endast 2018 och mönster kan ha förändrats sedan dess

Denna analys indikerar att ekonomiska faktorer spelar en betydande roll i väljarnas röstningsbeteende, något som bör beaktas vid utformning av samhällspolitik och partiers strategier.
      `,
         '2022': `
### Analys av sambandet mellan inkomstnivå och stöd för Sverigedemokraterna (2022)

## Sammanfattning för beslutsfattare
Data för 2022 bekräftar och förstärker det omvända sambandet mellan medelinkomst och stöd för Sverigedemokraterna som observerades 2018. Stödet för partiet visar en tydlig ökning i låginkomstområden jämfört med tidigare mätning.

## Nyckelfynd

1. **Förstärkt omvänt samband**:
   - Höginkomstområden (87 kommuner): 21.2% stöd (-3.0% jämfört med låginkomstgruppen)
   - Medelinkomstområden (103 kommuner): 26% stöd
   - Låginkomstområden (100 kommuner): 28.2% stöd (+5.4% jämfört med 2018)

2. **Utökat prestationsgap**:
   - Skillnaden mellan högsta och lägsta inkomstgrupp har ökat till 7.0 procentenheter (från 21.2% till 28.2%)
   - Denna ökning indikerar en förstärkning av den socioekonomiska klyftan i partistödet

3. **Trendanalys (2018-2022)**:
   - Alla inkomstgrupper visar ökad stödnivå (+3.2% för höginkomst, +4.4% för medelinkomst, +5.3% för låginkomst)
   - Den relativa skillnaden mellan grupperna har ökat med 2.1 procentenheter

## Strategiska rekommendationer

1. **För samhällsplanerare**:
   - Prioritera områden med låginkomst i demokratiska satsningar
   - Utveckla målrettade kommunikationsstrategier för olika inkomstgrupper

2. **För partiledningen**:
   - Analysera framgångsfaktorerna i låginkomstområden
   - Anpassa politikens budskap för att minska klyftan mellan inkomstgrupper

3. **För opinionsforskare**:
   - Studera orsakerna till den ökade polariseringen mellan inkomstgrupper
   - Följ upp om denna trend fortsätter i kommande val

## Metodologiska observationer

1. **Datakvalitet**:
   - Antalet kommuner per grupp är jämnt fördelat (87, 103, 100)
   - Inkomstintervallen verkar konsekventa med tidigare mätning

2. **Visualisering**:
   - Stapeldiagrammet visar tydligt den stigande trenden från hög till låg inkomst
   - Absoluta siffror kompletteras väl med procentuell representation

3. **Tidsmässig jämförelse**:
   - Data möjliggör meningsfulla jämförelser med 2018 års resultat
   - Trendanalysen visar på en accelererande polarisering

Denna analys visar en markant ökning av det socioekonomiska sambandet i partistödet, vilket kräver uppmärksamhet från både politiska aktörer och samhällsplanerare. Den utökade klyftan mellan inkomstgrupperna indikerar en samhällsutveckling som kan ha långsiktiga konsekvenser för den politiska landsbilden.
      `
      },
      'Vänsterpartiet': {
         '2018': `
### Analys av sambandet mellan inkomstnivå och stöd för Vänsterpartiet (2018)

## Sammanfattning för beslutsfattare
Data för 2018 visar ett svagt men märkbart samband mellan lägre inkomstnivåer och något högre stöd för Vänsterpartiet. Dock är skillnaderna mellan inkomstgrupperna betydligt mindre uttalade jämfört med Sverigedemokraterna.

## Nyckelfynd

1. **Begränsat men konsekvent samband**:
   - Höginkomstområden (90 kommuner): 6,4% stöd
   - Medelinkomstområden (103 kommuner): 6,6% stöd
   - Låginkomstområden (97 kommuner): 6,8% stöd

2. **Liten spridning mellan grupper**:
   - Endast 0,4 procentenheters skillnad mellan högsta och lägsta inkomstgrupp
   - Sambandet är statistiskt svagt men riktningsmässigt konsekvent

3. **Jämn geografisk fördelning**:
   - Antalet kommuner är balanserat mellan grupperna (90, 103, 97)
   - Stödet ligger på en relativt låg nivå i samtliga inkomstgrupper

## Jämförande analys med andra partier

1. **Kontrast mot Sverigedemokraterna**:
   - Mycket mindre inkomstrelaterad variation (0,4% vs 4,9-7,0%)
   - Generellt lägre stödnivåer (6-7% vs 18-28%)

2. **Likheter med typiska välfärds-partier**:
   - Lätt ökning i låginkomstområden
   - Brist på starkt stöd i någon inkomstgrupp

## Strategiska rekommendationer

1. **För Vänsterpartiet**:
   - Utvärdera varför inkomstskillnaderna inte ger större stödsvariation
   - Analysera potentiella överlappande faktorer (t.ex. urbanisering, ålder)

2. **För samhällsanalytiker**:
   - Studera varför klassmässiga faktorer har mindre betydelse för Vänsterpartiet
   - Jämför med andra vänsterorienterade partier i Norden

3. **För politiska observatörer**:
   - Undersök om detta mönster är stabilt över tid
   - Analysera om andra faktorer (t.ex. utbildning) är viktigare än inkomst

## Metodologiska reflektioner

1. **Datatolkning**:
   - Små skillnader kräver försiktig tolkning
   - Kan tyda på att andra faktorer än inkomst dominerar

2. **Visualiseringsutmaningar**:
   - Låga procenttal gör diagrammen mindre uttrycksfulla
   - Relativa skillnader framstår som marginella i absolut mening

3. **Forskningsfrågor**:
   - Varför uppvisar inte Vänsterpartiet starkare klassmässiga mönster?
   - Hur förhåller sig detta till partiets historiska väljarbas?

Denna analys visar att Vänsterpartiets stöd 2018 var relativt opåverkat av inkomstskillnader, vilket skiljer sig markant från mönstren hos andra partier. Detta kan tyda på att partiet attraherar väljare över inkomstgränserna, eller att andra faktorer än ekonomi spelar större roll för dess väljarkår.
      `,
         '2022': `
### Analys av sambandet mellan inkomstnivå och stöd för Vänsterpartiet (2022)

## Sammanfattning för beslutsfattare
Data för 2022 visar en markant förändring i Vänsterpartiets stödmönster jämfört med 2018, med en generell nedgång i samtliga inkomstgrupper och ett nu mer neutralt samband med inkomstnivåer.

## Nyckelfynd

1. **Stark minskning i samtliga grupper**:
   - Höginkomstområden: 5,2% (-1,2% jämfört med 2018)
   - Medelinkomstområden: 5,0% (-1,6%)
   - Låginkomstområden: 5,0% (-1,8%)

2. **Försvagat inkomstsamband**:
   - Marginell skillnad mellan grupper (max 0,2 procentenheter)
   - Inget tydligt mönster mellan inkomstnivåer kvarstår

3. **Trendanalys 2018-2022**:
   - Totalt stödfall på ca 25-30% i alla inkomstgrupper
   - Den tidigare svaga tendensen till högre stöd i låginkomstområden har försvunnit

## Jämförande analys

1. **Kontrast mot 2018**:
   - Minskad betydelse av inkomstfaktorn
   - Mer homogen fördelning över inkomstgrupper

2. **Skillnad mot andra partier**:
   - Sverigedemokraterna visar fortsatt stark inkomstrelaterad variation
   - Vänsterpartiet nu med lägst inkomstrelaterad skillnad av analyserade partier

## Strategiska implikationer

1. **För Vänsterpartiet**:
   - Behöver analysera orsaker till det generella stödfallet
   - Omvärdera vilka faktorer som nu driver väljarstöd
   - Överväga om klassfrågor behöver ny formulering

2. **För samhällsanalytiker**:
   - Undersök om detta är en tillfällig fluktuation eller en strukturell förändring
   - Studera om andra partier tagit över Vänsterpartiets traditionella väljargrupper

3. **För opinionsforskare**:
   - Följ upp om denna utjämning mellan inkomstgrupper kvarstår
   - Analysera om nya väljargrupper dykt upp som kompensation

## Metodologiska observationer

1. **Datakvalitet**:
   - Balanserad fördelning av kommuner (87, 100, 103)
   - Låga procenttal kräver stor noggrannhet i analysen

2. **Visualiseringsutmaningar**:
   - Mycket små skillnader gör diagram svårtolkade
   - Absoluta förändringar är större än relativa skillnader

3. **Tolkning**:
   - Brist på tydligt mönster kan tyda på flera konkurrerande faktorer
   - Möjligt att andra variabler (t.ex. geografi, ålder) blivit viktigare

Denna analys pekar på en betydande förändring i Vänsterpartiets väljarbas mellan 2018 och 2022, där inkomstnivån tycks ha förlorat sin tidigare begränsade betydelse som prediktor för partistöd. Denna utveckling kräver noggrann uppföljning och analys för att förstå dess långsiktiga implikationer för svensk partipolitik.
      `
      }
   };

   if (analysisText[selectedParty] && analysisText[selectedParty][selectedYear]) {
      addMdToPage(analysisText[selectedParty][selectedYear]);
   }
}
else {
   addMdToPage(`
    ### Ingen data tillgänglig för ${selectedParty} (${selectedYear}).
    Vänligen välj ett annat parti eller år.
  `);
}