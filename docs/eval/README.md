# FanDrive vs plain AI: 20-city evaluation

_Generated 2026-10-23 by `pnpm eval` (scripts/eval.ts). Raw plain-AI answers: [`raw/`](raw/). Machine-readable results: [`results.json`](results.json)._

## Headline

- **30 of 96 plain-AI picks (31%) have fans who skew older than average** (youth skew below zero).
- **58 of 96 (60%) were not young-skewing or had no Qloo audience data** (41 under +0.30, 17 no data).
- **FanDrive's top 3: 59 of 60 (98%) young-skewing**, average youth skew **+0.75** vs **+0.25** for plain-AI picks with data.
- In **20 of 20 cities**, plain AI never suggested at least one of FanDrive's top 3 (57 missed picks in total).
- **Local picks:** Qloo's local taste gave a young-leaning, city-specific lead fandom in **20 of 20 cities** (20 different fandoms, average youth skew +0.83).

## Method

1. **Plain AI.** For each city, the app's own Gemini chain (gemini-3.1-flash-lite, then gemini-3.5-flash-lite, then gemini-3.5-flash, then gemini-3-flash-preview; the first model to answer is used) is asked once, with the app's own plain-AI prompt and no Qloo data, for up to 5 pop-culture partners for a blood drive aimed at first-time donors aged 16–24. Each pick is looked up in Qloo and its fans' age skew is read from `/v2/insights` (`filter.type=urn:demographics`).
2. **FanDrive.** The live AI agent runs exactly as in the app: it proposes its own candidates, Qloo adds the city's **local taste** (top artists and athletes for young people there, minus names that also top other reference cities), every candidate is scored on youth skew, local love (`signal.location.query` + `signal.demographics.age`) and fan density (heatmap vs a mass-brand baseline), and the agent picks the partners. It never sees plain AI's answers. FanDrive's top 3 are the report's two lead picks (always including a local pick when one is young-leaning) followed by the ranking. One agent answer per city is cached in `raw-agent/`.
3. **Young-skewing** means youth skew ≥ +0.30 for ages 16–24 (Qloo's "24 and under" bucket), the same line the app's plain-AI check uses. Averages pool every pick across cities.

## What this does and doesn't show

- It shows how often an LLM's intuition about "young" fandoms disagrees with Qloo's audience data, and what FanDrive recommends instead.
- FanDrive is scored with the same Qloo data it optimises, so its own share is high by design. The informative numbers are the plain-AI ones.
- It does **not** measure donor turnout. That needs a real drive; see the [method page](https://fandrive-nu.vercel.app/method) for past partners and their published results.
- **Repeats.** The most repeated FanDrive picks are Fortnite (4 cities), Valorant (4 cities), Stranger Things (2 cities). Fandoms that skew young everywhere can still win on score, so every report also leads with a **local pick** (20 of 20 cities, 20 different fandoms). The map and venues are always city-specific.
- **"Local" is Qloo's view, not a hometown check.** Local picks are the artists and athletes young people in the city over-index on compared with the reference cities. Qloo's athlete data can be dated (some are former players) and it can't know who has died; the agent is told to skip such names, and Qloo's birth dates rule out anyone under 18.
- **Many picks are individual public figures.** The app tells organisers to check a person's fit before using their name, and campaign copy only ever says "<name> fans", never implying an endorsement.
- 1 FanDrive picks were under +0.30: Philadelphia 76ers in Philadelphia, PA (+0.13). They ranked on local love and fan density; the score keeps any young-leaning (≥ 0) fandom above older ones, not above +0.30.
- One plain-AI sample and one agent run per city (cached in `raw/` and `raw-agent/`). Qloo data for India is thinner, and some cities are "medium".

## Results by city

| City | Qloo data | Plain AI suggested (youth skew) | FanDrive top 3 (youth skew) | Plain AI missed | Local pick |
|---|---|---|---|---|---|
| New York, NY | strong | Grand Theft Auto VI (no data), Kai Cenat (+0.88), Succession (+0.14), Ice Spice (+0.85), New York Knicks (−0.01) | Stranger Things (+0.71), Amed Rosario (+0.93), Fortnite (+0.72) | Stranger Things, Amed Rosario, Fortnite | Amed Rosario (+0.93) |
| Los Angeles, CA | strong | 100 Thieves (no data), Euphoria (+0.62), Tyler, The Creator (+0.38), Los Angeles FC (+0.00), Emma Chamberlain (+0.88) | Ozomatli (+0.81), H3 Podcast (+0.88), Andrew Heaney (+0.94) | Ozomatli, H3 Podcast, Andrew Heaney | Ozomatli (+0.81) |
| Chicago, IL | strong | Chance the Rapper (+0.30), Chicago Bulls (+0.02), The Bear (−0.23), Lyrical Lemonade (+0.61) | Nico Hoerner (+0.85), Twin Peaks (+0.75), Valorant (+0.57) | Nico Hoerner, Twin Peaks, Valorant | Nico Hoerner (+0.85) |
| Houston, TX | medium | Travis Scott (+0.46), Houston Astros (−0.01), Stranger Things (+0.71), Apex Legends (+0.34) | Jeremy Peña (+0.98), H-e-b (+0.69), Don Toliver (+0.69) | Jeremy Peña, H-e-b, Don Toliver | Jeremy Peña (+0.98) |
| Phoenix, AZ | medium | Valorant (+0.57), Phoenix Suns (+0.57), SZA (+0.32), Euphoria (+0.62) | Jake Lamb (+0.96), UPSAHL (+0.82), Fortnite (+0.72) | Jake Lamb, UPSAHL, Fortnite | Jake Lamb (+0.96) |
| Philadelphia, PA | medium | The Philadelphia Eagles (−0.04), Abbott Elementary (+0.07), Lil Uzi Vert (+0.48), Call of Duty (+0.39), Quinta Brunson (+0.13) | LIL UZI VERT (+0.48), Nothing (+0.70), Philadelphia 76ers (+0.13) | Nothing, Philadelphia 76ers | Nothing (+0.70) |
| San Antonio, TX | medium | San Antonio Spurs (−0.07), Apex Legends (+0.34), Gorillaz (−0.06), Stranger Things (+0.71), JRE MMA Show (no data) | H-e-b (+0.69), Chimezie Metu (+0.91), Fortnite (+0.72) | H-e-b, Chimezie Metu, Fortnite | Chimezie Metu (+0.91) |
| Dallas, TX | medium | Dallas Mavericks (−0.03), Erykah Badu (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Dude Perfect (no data) | Adolis García (+0.97), Flatland Cavalry (+0.75), The Polyphonic Spree (+0.80) | Adolis García, Flatland Cavalry, The Polyphonic Spree | Adolis García (+0.97) |
| Atlanta, GA | strong | Lil Baby (+0.49), Atlanta Falcons (+0.64), Atlanta Dream (−0.15), Kai Cenat (+0.88), Stranger Things (+0.71) | Atlanta Hawks (+0.72), Vaughn Hebron (+0.96), Lil Gotit (+0.78) | Atlanta Hawks, Vaughn Hebron, Lil Gotit | Vaughn Hebron (+0.96) |
| Seattle, WA | medium | Seattle Kraken (+0.55), Macklemore (−0.01), The Last of Us (−0.05), Stranger Things (+0.71), Ludwig (−0.04) | Paolo Banchero (+0.99), TeZATalks (+0.96), Ryan Caraveo (+0.83) | Paolo Banchero, TeZATalks, Ryan Caraveo | Paolo Banchero (+0.99) |
| Miami, FL | strong | Inter Miami CF (no data), DJ Khaled (+0.01), Stranger Things (+0.71), Fortnite (+0.72), Rick Ross (−0.14) | Fortnite (+0.72), Kate McGill (+0.70), Stranger Things (+0.71) | Kate McGill | Kate McGill (+0.70) |
| Denver, CO | medium | Denver Nuggets (−0.08), Stranger Things (+0.71), Fortnite (+0.72), Illenium (−0.02), Red Rocks Amphitheatre (no data) | STS9 (+0.88), The Polish Ambassador (+0.93), Michal Menert (+0.86) | STS9, The Polish Ambassador, Michal Menert | STS9 (+0.88) |
| Boston, MA | medium | Boston Celtics (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Billie Eilish (+0.46) | Matt Turner (+0.98), Chappell Roan (+0.68), Aron Baynes (+0.87) | Matt Turner, Chappell Roan, Aron Baynes | Matt Turner (+0.98) |
| Detroit, MI | thin | Eminem (−0.06), Detroit Lions (+0.00), Fortnite (+0.72), Big Sean (+0.05), Stranger Things (+0.71) | Emoni Bates (+0.98), Griz (+0.57), Cade Cunningham (+0.87) | Emoni Bates, Griz, Cade Cunningham | Emoni Bates (+0.98) |
| Nashville, TN | thin | CMA Fest (−0.37), Nashville SC (−0.03), The Try Guys (no data), Grand Ole Opry (no data), Taylor Swift (−0.05) | Lennon Stella (+0.50), Amie Miriello (+0.84), Mason Ramsey (+0.69) | Lennon Stella, Amie Miriello, Mason Ramsey | Lennon Stella (+0.50) |
| Mumbai | medium | Minecraft (+0.42), Karan Aujla (−0.20), Kota Factory (−0.23), Mumbai Indians (−0.07), BeerBiceps (no data) | Indian Ocean (+0.77), Lost Stories (+0.48), The Local Train (+0.47) | Indian Ocean, Lost Stories, The Local Train | Indian Ocean (+0.77) |
| New Delhi | thin | PUBG Mobile India (+0.01), Prateek Kuhad (−0.21), Kota Factory (−0.23), Delhi Capitals (no data), BeerBiceps (Ranveer Allahbadia) (no data) | Valorant (+0.57), The Local Train (+0.47), Cigarettes After Sex (+0.58) | Valorant, The Local Train, Cigarettes After Sex | The Local Train (+0.47) |
| Bengaluru | medium | Royal Challengers Bengaluru (no data), The Local Train (+0.47), PUBG Mobile India (+0.01), Dice Media (no data), Nikhil Kamath (−0.29) | Valorant (+0.57), Rini (+0.65), Shanti People (+0.62) | Valorant, Rini, Shanti People | Rini (+0.65) |
| Hyderabad | thin | PUBG Mobile India (+0.01), Allu Arjun (−0.37), Sunrisers Hyderabad (no data), MTV Hustle (no data), Nikhil Vijay (no data) | Zaeden (+0.79), Shanti People (+0.62), Valorant (+0.57) | Zaeden, Shanti People, Valorant | Shanti People (+0.62) |
| Chennai | thin | Anirudh Ravichander (−0.23), Chennai Super Kings (−0.04), Biswa Kalyan Rath (−0.36), Valorant (+0.57), The Ranveer Show (no data) | Ayyasamy Dharun (+0.99), Mckenna Grace (+0.95), md (+0.62) | Ayyasamy Dharun, Mckenna Grace, md | Ayyasamy Dharun (+0.99) |
