# FanDrive vs plain AI: 20-city evaluation

_Generated 2026-10-15 by `pnpm eval` (scripts/eval.ts). Raw plain-AI answers: [`raw/`](raw/). Machine-readable results: [`results.json`](results.json)._

## Headline

- **30 of 96 plain-AI picks (31%) have fans who skew older than average** (youth skew below zero).
- **58 of 96 (60%) were not young-skewing or had no Qloo audience data** (41 under +0.30, 17 no data).
- **FanDrive's top 3: 60 of 60 (100%) young-skewing**, average youth skew **+0.83** vs **+0.25** for plain-AI picks with data.
- In **20 of 20 cities**, plain AI never suggested at least one of FanDrive's top 3 (55 missed picks in total).
- **Local picks:** Qloo's local taste gave a young-leaning, city-specific lead fandom in **20 of 20 cities** (19 different fandoms, average youth skew +0.86).

## Method

1. **Plain AI.** For each city, the app's own Gemini chain (gemini-3.1-flash-lite, then gemini-3.5-flash-lite, then gemini-3.5-flash, then gemini-3-flash-preview; the first model to answer is used) is asked once, with the app's own plain-AI prompt and no Qloo data, for up to 5 pop-culture partners for a blood drive aimed at first-time donors aged 16–24. Each pick is looked up in Qloo and its fans' age skew is read from `/v2/insights` (`filter.type=urn:demographics`).
2. **FanDrive.** Qloo scores a pool of the app's standard candidates, **every name plain AI suggested**, and Qloo's own **local taste** for the city (its top artists and people for young people there, popularity ≥ 0.75, minus names that also top more than one of 10 reference cities), on youth skew, local love (`signal.location.query` + `signal.demographics.age`) and fan density (heatmap vs a mass-brand baseline). The top 3 by Young-Donor Pull are kept. Older-skewing fandoms can't rank above young ones. The **local pick** is the local-taste fandom the report leads with next to the top pick (young-leaning, best ranked).
3. **Young-skewing** means youth skew ≥ +0.30 for ages 16–24 (Qloo's "24 and under" bucket), the same line the app's plain-AI check uses. Averages pool every pick across cities.

## What this does and doesn't show

- It shows how often an LLM's intuition about "young" fandoms disagrees with Qloo's audience data, and what FanDrive recommends instead.
- FanDrive is scored with the same Qloo data it optimises, so its own share is high by design. The informative numbers are the plain-AI ones.
- It does **not** measure donor turnout. That needs a real drive; see the [method page](https://fandrive-nu.vercel.app/method) for past partners and their published results.
- **Repeats.** The most repeated FanDrive picks are Fortnite (8 cities), Stranger Things (5 cities), HeadKrack (4 cities). Fandoms that skew young everywhere can still win on score, so every report also leads with a **local pick** (20 of 20 cities, 19 different fandoms). The map and venues are always city-specific.
- **"Local" is Qloo's view, not a hometown check.** Local picks are what young people in the city over-index on compared with the reference cities. Many are hometown artists and athletes; some are stars who are simply more loved there.
- **Many picks are individual public figures.** The app tells organisers to check a person's fit before using their name, and campaign copy only ever says "<name> fans", never implying an endorsement.
- Every FanDrive pick was young-skewing.
- One plain-AI sample per city (cached in `raw/`). Qloo data for India is thinner, and some cities are "medium".

## Results by city

| City | Qloo data | Plain AI suggested (youth skew) | FanDrive top 3 (youth skew) | Plain AI missed | Local pick |
|---|---|---|---|---|---|
| New York, NY | strong | Grand Theft Auto VI (no data), Kai Cenat (+0.88), Succession (+0.14), Ice Spice (+0.85), New York Knicks (−0.01) | Joshua Bassett (+0.97), Stranger Things (+0.71), Fortnite (+0.72) | Joshua Bassett, Stranger Things, Fortnite | Joshua Bassett (+0.97) |
| Los Angeles, CA | strong | 100 Thieves (no data), Euphoria (+0.62), Tyler, The Creator (+0.38), Los Angeles FC (+0.00), Emma Chamberlain (+0.88) | Alabama Barker (+0.94), Jessica Marie Garcia (+0.88), Auliʻi Cravalho (+0.89) | Alabama Barker, Jessica Marie Garcia, Auliʻi Cravalho | Alabama Barker (+0.94) |
| Chicago, IL | strong | Chance the Rapper (+0.30), Chicago Bulls (+0.02), The Bear (−0.23), Lyrical Lemonade (+0.61) | Calboy (+0.84), Jorge Soler (+0.81), Chance the Rapper (+0.30) | Calboy, Jorge Soler | Calboy (+0.84) |
| Houston, TX | medium | Travis Scott (+0.46), Houston Astros (−0.01), Stranger Things (+0.71), Apex Legends (+0.34) | Big Pokey (+0.60), Fortnite (+0.72), Jessica Marie Garcia (+0.88) | Big Pokey, Fortnite, Jessica Marie Garcia | Big Pokey (+0.60) |
| Phoenix, AZ | medium | Valorant (+0.57), Phoenix Suns (+0.57), SZA (+0.32), Euphoria (+0.62) | Nico Mannion (+0.89), Savannah LaBrant (+0.91), MyKayla Skinner (+0.87) | Nico Mannion, Savannah LaBrant, MyKayla Skinner | Nico Mannion (+0.89) |
| Philadelphia, PA | medium | The Philadelphia Eagles (−0.04), Abbott Elementary (+0.07), Lil Uzi Vert (+0.48), Call of Duty (+0.39), Quinta Brunson (+0.13) | Popp Hunna (+0.89), Fortnite (+0.72), Brooke Hyland (+0.94) | Popp Hunna, Fortnite, Brooke Hyland | Popp Hunna (+0.89) |
| San Antonio, TX | medium | San Antonio Spurs (−0.07), Apex Legends (+0.34), Gorillaz (−0.06), Stranger Things (+0.71), JRE MMA Show (no data) | Jenna Ortega (+0.93), Stranger Things (+0.71), Savannah LaBrant (+0.91) | Jenna Ortega, Savannah LaBrant | Jenna Ortega (+0.93) |
| Dallas, TX | medium | Dallas Mavericks (−0.03), Erykah Badu (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Dude Perfect (no data) | HeadKrack (+0.87), R. J. Hampton (+0.91), The Polyphonic Spree (+0.80) | HeadKrack, R. J. Hampton, The Polyphonic Spree | HeadKrack (+0.87) |
| Atlanta, GA | strong | Lil Baby (+0.49), Atlanta Falcons (+0.64), Atlanta Dream (−0.15), Kai Cenat (+0.88), Stranger Things (+0.71) | HeadKrack (+0.87), Atlanta Falcons (+0.64), Atlanta Hawks (+0.72) | HeadKrack, Atlanta Hawks | HeadKrack (+0.87) |
| Seattle, WA | medium | Seattle Kraken (+0.55), Macklemore (−0.01), The Last of Us (−0.05), Stranger Things (+0.71), Ludwig (−0.04) | TeZATalks (+0.96), Cataldo (+0.80), Auliʻi Cravalho (+0.89) | TeZATalks, Cataldo, Auliʻi Cravalho | TeZATalks (+0.96) |
| Miami, FL | strong | Inter Miami CF (no data), DJ Khaled (+0.01), Stranger Things (+0.71), Fortnite (+0.72), Rick Ross (−0.14) | Malu Trevejo (+0.87), HeadKrack (+0.87), Fortnite (+0.72) | Malu Trevejo, HeadKrack | Malu Trevejo (+0.87) |
| Denver, CO | medium | Denver Nuggets (−0.08), Stranger Things (+0.71), Fortnite (+0.72), Illenium (−0.02), Red Rocks Amphitheatre (no data) | STS9 (+0.88), The Polish Ambassador (+0.93), Michal Menert (+0.86) | STS9, The Polish Ambassador, Michal Menert | STS9 (+0.88) |
| Boston, MA | medium | Boston Celtics (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Billie Eilish (+0.46) | Chase Stokes (+0.87), Brooke Hyland (+0.94), Stranger Things (+0.71) | Chase Stokes, Brooke Hyland | Chase Stokes (+0.87) |
| Detroit, MI | thin | Eminem (−0.06), Detroit Lions (+0.00), Fortnite (+0.72), Big Sean (+0.05), Stranger Things (+0.71) | Cade Cunningham (+0.87), 42 Dugg (+0.67), HeadKrack (+0.87) | Cade Cunningham, 42 Dugg, HeadKrack | Cade Cunningham (+0.87) |
| Nashville, TN | thin | CMA Fest (−0.37), Nashville SC (−0.03), The Try Guys (no data), Grand Ole Opry (no data), Taylor Swift (−0.05) | Maisy Stella (+0.88), Savannah LaBrant (+0.91), Stranger Things (+0.71) | Maisy Stella, Savannah LaBrant, Stranger Things | Maisy Stella (+0.88) |
| Mumbai | medium | Minecraft (+0.42), Karan Aujla (−0.20), Kota Factory (−0.23), Mumbai Indians (−0.07), BeerBiceps (no data) | Bhavya Gandhi (+0.97), Nikk (+0.98), Dev Joshi (+0.97) | Bhavya Gandhi, Nikk, Dev Joshi | Bhavya Gandhi (+0.97) |
| New Delhi | thin | PUBG Mobile India (+0.01), Prateek Kuhad (−0.21), Kota Factory (−0.23), Delhi Capitals (no data), BeerBiceps (Ranveer Allahbadia) (no data) | Nikk (+0.98), Fortnite (+0.72), Bhavya Gandhi (+0.97) | Nikk, Fortnite, Bhavya Gandhi | Nikk (+0.98) |
| Bengaluru | medium | Royal Challengers Bengaluru (no data), The Local Train (+0.47), PUBG Mobile India (+0.01), Dice Media (no data), Nikhil Kamath (−0.29) | Jannat Zubair Rahmani (+0.85), Aranthangi Nisha (+0.97), Fortnite (+0.72) | Jannat Zubair Rahmani, Aranthangi Nisha, Fortnite | Jannat Zubair Rahmani (+0.85) |
| Hyderabad | thin | PUBG Mobile India (+0.01), Allu Arjun (−0.37), Sunrisers Hyderabad (no data), MTV Hustle (no data), Nikhil Vijay (no data) | Fortnite (+0.72), Minecraft (+0.42), Stranger Things (+0.71) | Fortnite, Minecraft, Stranger Things | Alan Walker (+0.32) |
| Chennai | thin | Anirudh Ravichander (−0.23), Chennai Super Kings (−0.04), Biswa Kalyan Rath (−0.36), Valorant (+0.57), The Ranveer Show (no data) | Aranthangi Nisha (+0.97), Santesh (+0.98), Fortnite (+0.72) | Aranthangi Nisha, Santesh, Fortnite | Aranthangi Nisha (+0.97) |
