# FanDrive vs plain AI: 20-city evaluation

_Generated 2026-10-15 by `pnpm eval` (scripts/eval.ts). Raw plain-AI answers: [`raw/`](raw/). Machine-readable results: [`results.json`](results.json)._

## Headline

- **30 of 96 plain-AI picks (31%) have fans who skew older than average** (youth skew below zero).
- **58 of 96 (60%) were not young-skewing or had no Qloo audience data** (41 under +0.30, 17 no data).
- **FanDrive's top 3: 60 of 60 (100%) young-skewing**, average youth skew **+0.74** vs **+0.25** for plain-AI picks with data.
- In **20 of 20 cities**, plain AI never suggested at least one of FanDrive's top 3 (51 missed picks in total).
- **Local picks:** Qloo's local taste gave a young-leaning, city-specific lead fandom in **20 of 20 cities** (18 different fandoms, average youth skew +0.82).

## Method

1. **Plain AI.** For each city, the app's own Gemini chain (gemini-3.1-flash-lite, then gemini-3.5-flash-lite, then gemini-3.5-flash, then gemini-3-flash-preview; the first model to answer is used) is asked once, with the app's own plain-AI prompt and no Qloo data, for up to 5 pop-culture partners for a blood drive aimed at first-time donors aged 16–24. Each pick is looked up in Qloo and its fans' age skew is read from `/v2/insights` (`filter.type=urn:demographics`).
2. **FanDrive.** Qloo scores a pool of the app's standard candidates, **every name plain AI suggested**, and Qloo's own **local taste** for the city (its top artists and athletes for young people there, in Qloo's order, minus names that also top more than one of 10 reference cities; Indian cities are compared with US ones only, because Qloo's Indian city data is national), on youth skew, local love (`signal.location.query` + `signal.demographics.age`) and fan density (heatmap vs a mass-brand baseline). The top 3 by Young-Donor Pull are kept. Older-skewing fandoms can't rank above young ones. The **local pick** is the local-taste fandom the report leads with next to the top pick (young-leaning, best ranked).
3. **Young-skewing** means youth skew ≥ +0.30 for ages 16–24 (Qloo's "24 and under" bucket), the same line the app's plain-AI check uses. Averages pool every pick across cities.

## What this does and doesn't show

- It shows how often an LLM's intuition about "young" fandoms disagrees with Qloo's audience data, and what FanDrive recommends instead.
- FanDrive is scored with the same Qloo data it optimises, so its own share is high by design. The informative numbers are the plain-AI ones.
- It does **not** measure donor turnout. That needs a real drive; see the [method page](https://fandrive-nu.vercel.app/method) for past partners and their published results.
- **Repeats.** The most repeated FanDrive picks are Fortnite (11 cities), Stranger Things (9 cities), Minecraft (4 cities). Fandoms that skew young everywhere can still win on score, so every report also leads with a **local pick** (20 of 20 cities, 18 different fandoms). The map and venues are always city-specific.
- **"Local" is Qloo's view, not a hometown check.** Local picks are the artists and athletes young people in the city over-index on compared with the reference cities. Qloo's athlete data can be dated (some are former players) and it can't know who has died; the live agent is told to skip such names, this ranking isn't.
- **Many picks are individual public figures.** The app tells organisers to check a person's fit before using their name, and campaign copy only ever says "<name> fans", never implying an endorsement.
- Every FanDrive pick was young-skewing.
- One plain-AI sample per city (cached in `raw/`). Qloo data for India is thinner, and some cities are "medium".

## Results by city

| City | Qloo data | Plain AI suggested (youth skew) | FanDrive top 3 (youth skew) | Plain AI missed | Local pick |
|---|---|---|---|---|---|
| New York, NY | strong | Grand Theft Auto VI (no data), Kai Cenat (+0.88), Succession (+0.14), Ice Spice (+0.85), New York Knicks (−0.01) | Amed Rosario (+0.93), Stranger Things (+0.71), Fortnite (+0.72) | Amed Rosario, Stranger Things, Fortnite | Amed Rosario (+0.93) |
| Los Angeles, CA | strong | 100 Thieves (no data), Euphoria (+0.62), Tyler, The Creator (+0.38), Los Angeles FC (+0.00), Emma Chamberlain (+0.88) | Ozomatli (+0.81), Emma Chamberlain (+0.88), Stranger Things (+0.71) | Ozomatli, Stranger Things | Ozomatli (+0.81) |
| Chicago, IL | strong | Chance the Rapper (+0.30), Chicago Bulls (+0.02), The Bear (−0.23), Lyrical Lemonade (+0.61) | Jorge Soler (+0.81), Chance the Rapper (+0.30), Stranger Things (+0.71) | Jorge Soler, Stranger Things | Jorge Soler (+0.81) |
| Houston, TX | medium | Travis Scott (+0.46), Houston Astros (−0.01), Stranger Things (+0.71), Apex Legends (+0.34) | Big Pokey (+0.60), Fortnite (+0.72), Houston Rockets (+0.30) | Big Pokey, Fortnite, Houston Rockets | Big Pokey (+0.60) |
| Phoenix, AZ | medium | Valorant (+0.57), Phoenix Suns (+0.57), SZA (+0.32), Euphoria (+0.62) | Jake Lamb (+0.96), Nico Mannion (+0.89), Fortnite (+0.72) | Jake Lamb, Nico Mannion, Fortnite | Jake Lamb (+0.96) |
| Philadelphia, PA | medium | The Philadelphia Eagles (−0.04), Abbott Elementary (+0.07), Lil Uzi Vert (+0.48), Call of Duty (+0.39), Quinta Brunson (+0.13) | Carter Hart (+0.93), Fortnite (+0.72), Shawn Smith (+0.56) | Carter Hart, Fortnite, Shawn Smith | Carter Hart (+0.93) |
| San Antonio, TX | medium | San Antonio Spurs (−0.07), Apex Legends (+0.34), Gorillaz (−0.06), Stranger Things (+0.71), JRE MMA Show (no data) | Aron Baynes (+0.87), Chimezie Metu (+0.91), Stranger Things (+0.71) | Aron Baynes, Chimezie Metu | Aron Baynes (+0.87) |
| Dallas, TX | medium | Dallas Mavericks (−0.03), Erykah Badu (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Dude Perfect (no data) | The Polyphonic Spree (+0.80), Fortnite (+0.72), Adolis García (+0.97) | The Polyphonic Spree, Adolis García | The Polyphonic Spree (+0.80) |
| Atlanta, GA | strong | Lil Baby (+0.49), Atlanta Falcons (+0.64), Atlanta Dream (−0.15), Kai Cenat (+0.88), Stranger Things (+0.71) | Atlanta Falcons (+0.64), Atlanta Hawks (+0.72), Atlanta Braves (+0.45) | Atlanta Hawks, Atlanta Braves | Jody Breeze (+0.76) |
| Seattle, WA | medium | Seattle Kraken (+0.55), Macklemore (−0.01), The Last of Us (−0.05), Stranger Things (+0.71), Ludwig (−0.04) | Paolo Banchero (+0.99), Marco Gonzales (+0.90), TeZATalks (+0.96) | Paolo Banchero, Marco Gonzales, TeZATalks | Paolo Banchero (+0.99) |
| Miami, FL | strong | Inter Miami CF (no data), DJ Khaled (+0.01), Stranger Things (+0.71), Fortnite (+0.72), Rick Ross (−0.14) | Fortnite (+0.72), Stranger Things (+0.71), Ariel Torres (+0.98) | Ariel Torres | Ariel Torres (+0.98) |
| Denver, CO | medium | Denver Nuggets (−0.08), Stranger Things (+0.71), Fortnite (+0.72), Illenium (−0.02), Red Rocks Amphitheatre (no data) | STS9 (+0.88), The Polish Ambassador (+0.93), Michal Menert (+0.86) | STS9, The Polish Ambassador, Michal Menert | STS9 (+0.88) |
| Boston, MA | medium | Boston Celtics (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Billie Eilish (+0.46) | Aron Baynes (+0.87), Stranger Things (+0.71), Matt Turner (+0.98) | Aron Baynes, Matt Turner | Aron Baynes (+0.87) |
| Detroit, MI | thin | Eminem (−0.06), Detroit Lions (+0.00), Fortnite (+0.72), Big Sean (+0.05), Stranger Things (+0.71) | Cade Cunningham (+0.87), Emoni Bates (+0.98), 42 Dugg (+0.67) | Cade Cunningham, Emoni Bates, 42 Dugg | Cade Cunningham (+0.87) |
| Nashville, TN | thin | CMA Fest (−0.37), Nashville SC (−0.03), The Try Guys (no data), Grand Ole Opry (no data), Taylor Swift (−0.05) | Jeffery Simmons (+0.84), Stranger Things (+0.71), Lennon Stella (+0.50) | Jeffery Simmons, Stranger Things, Lennon Stella | Jeffery Simmons (+0.84) |
| Mumbai | medium | Minecraft (+0.42), Karan Aujla (−0.20), Kota Factory (−0.23), Mumbai Indians (−0.07), BeerBiceps (no data) | Fortnite (+0.72), Minecraft (+0.42), Stranger Things (+0.71) | Fortnite, Stranger Things | Indian Ocean (+0.77) |
| New Delhi | thin | PUBG Mobile India (+0.01), Prateek Kuhad (−0.21), Kota Factory (−0.23), Delhi Capitals (no data), BeerBiceps (Ranveer Allahbadia) (no data) | Fortnite (+0.72), Minecraft (+0.42), Indian Ocean (+0.77) | Fortnite, Minecraft, Indian Ocean | Indian Ocean (+0.77) |
| Bengaluru | medium | Royal Challengers Bengaluru (no data), The Local Train (+0.47), PUBG Mobile India (+0.01), Dice Media (no data), Nikhil Kamath (−0.29) | Fortnite (+0.72), Minecraft (+0.42), Stranger Things (+0.71) | Fortnite, Minecraft, Stranger Things | Shanti People (+0.62) |
| Hyderabad | thin | PUBG Mobile India (+0.01), Allu Arjun (−0.37), Sunrisers Hyderabad (no data), MTV Hustle (no data), Nikhil Vijay (no data) | Fortnite (+0.72), Minecraft (+0.42), Marshmello (+0.45) | Fortnite, Minecraft, Marshmello | Marshmello (+0.45) |
| Chennai | thin | Anirudh Ravichander (−0.23), Chennai Super Kings (−0.04), Biswa Kalyan Rath (−0.36), Valorant (+0.57), The Ranveer Show (no data) | Fortnite (+0.72), Mckenna Grace (+0.95), Ayyasamy Dharun (+0.99) | Fortnite, Mckenna Grace, Ayyasamy Dharun | Mckenna Grace (+0.95) |
