# FanDrive vs plain AI: 20-city evaluation

_Generated 2026-10-14 by `pnpm eval` (scripts/eval.ts). Raw plain-AI answers: [`raw/`](raw/). Machine-readable results: [`results.json`](results.json)._

## Headline

- **30 of 96 plain-AI picks (31%) have fans who skew older than average** (youth skew below zero).
- **58 of 96 (60%) were not young-skewing or had no Qloo audience data** (41 under +0.30, 17 no data).
- **FanDrive's top 3: 57 of 60 (95%) young-skewing**, average youth skew **+0.62** vs **+0.25** for plain-AI picks with data.
- In **19 of 20 cities**, plain AI never suggested at least one of FanDrive's top 3 (37 missed picks in total).

## Method

1. **Plain AI.** For each city, the app's own Gemini chain (gemini-3.1-flash-lite, then gemini-3.5-flash-lite, then gemini-3.5-flash, then gemini-3-flash-preview; the first model to answer is used) is asked once, with the app's own plain-AI prompt and no Qloo data, for up to 5 pop-culture partners for a blood drive aimed at first-time donors aged 16–24. Each pick is looked up in Qloo and its fans' age skew is read from `/v2/insights` (`filter.type=urn:demographics`).
2. **FanDrive.** Qloo scores a pool of the app's standard candidates **plus every name plain AI suggested**, on youth skew, local love (`signal.location.query` + `signal.demographics.age`) and fan density (heatmap vs a mass-brand baseline). The top 3 by Young-Donor Pull are kept. Older-skewing fandoms can't rank above young ones.
3. **Young-skewing** means youth skew ≥ +0.30 for ages 16–24 (Qloo's "24 and under" bucket), the same line the app's plain-AI check uses. Averages pool every pick across cities.

## What this does and doesn't show

- It shows how often an LLM's intuition about "young" fandoms disagrees with Qloo's audience data, and what FanDrive recommends instead.
- FanDrive is scored with the same Qloo data it optimises, so its own share is high by design. The informative numbers are the plain-AI ones.
- It does **not** measure donor turnout. That needs a real drive; see the [method page](https://fandrive-nu.vercel.app/method) for past partners and their published results.
- **FanDrive's top 3 repeats global youth fandoms.** Stranger Things (18 cities), Fortnite (18 cities), Minecraft (7 cities). With this fixed candidate pool, games and shows that skew young everywhere beat most local names. In the live app, the AI agent also proposes local candidates (Kai Cenat and the Atlanta Hawks were AI picks in Atlanta, for example), and the map and venues are always city-specific.
- 3 FanDrive picks were under +0.30: Quinta Brunson in Philadelphia, PA (+0.13), Big Sean in Detroit, MI (+0.05), Morgan Wallen in Nashville, TN (+0.21). They ranked on local love and fan density; the score keeps any young-leaning (≥ 0) fandom above older ones, not above +0.30.
- One plain-AI sample per city (cached in `raw/`). Qloo data for India is thinner, and some cities are "medium".

## Results by city

| City | Qloo data | Plain AI suggested (youth skew) | FanDrive top 3 (youth skew) | Plain AI missed |
|---|---|---|---|---|
| New York, NY | strong | Grand Theft Auto VI (no data), Kai Cenat (+0.88), Succession (+0.14), Ice Spice (+0.85), New York Knicks (−0.01) | Stranger Things (+0.71), Fortnite (+0.72), Kai Cenat (+0.88) | Stranger Things, Fortnite |
| Los Angeles, CA | strong | 100 Thieves (no data), Euphoria (+0.62), Tyler, The Creator (+0.38), Los Angeles FC (+0.00), Emma Chamberlain (+0.88) | Emma Chamberlain (+0.88), Stranger Things (+0.71), Fortnite (+0.72) | Stranger Things, Fortnite |
| Chicago, IL | strong | Chance the Rapper (+0.30), Chicago Bulls (+0.02), The Bear (−0.23), Lyrical Lemonade (+0.61) | Chance the Rapper (+0.30), Stranger Things (+0.71), Fortnite (+0.72) | Stranger Things, Fortnite |
| Houston, TX | medium | Travis Scott (+0.46), Houston Astros (−0.01), Stranger Things (+0.71), Apex Legends (+0.34) | Fortnite (+0.72), Houston Rockets (+0.30), Travis Scott (+0.46) | Fortnite, Houston Rockets |
| Phoenix, AZ | medium | Valorant (+0.57), Phoenix Suns (+0.57), SZA (+0.32), Euphoria (+0.62) | Fortnite (+0.72), Phoenix Suns (+0.57), Stranger Things (+0.71) | Fortnite, Stranger Things |
| Philadelphia, PA | medium | The Philadelphia Eagles (−0.04), Abbott Elementary (+0.07), Lil Uzi Vert (+0.48), Call of Duty (+0.39), Quinta Brunson (+0.13) | Fortnite (+0.72), Stranger Things (+0.71), Quinta Brunson (+0.13) | Fortnite, Stranger Things |
| San Antonio, TX | medium | San Antonio Spurs (−0.07), Apex Legends (+0.34), Gorillaz (−0.06), Stranger Things (+0.71), JRE MMA Show (no data) | Stranger Things (+0.71), Fortnite (+0.72), MrBeast (+0.51) | Fortnite, MrBeast |
| Dallas, TX | medium | Dallas Mavericks (−0.03), Erykah Badu (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Dude Perfect (no data) | Fortnite (+0.72), Stranger Things (+0.71), MrBeast (+0.51) | MrBeast |
| Atlanta, GA | strong | Lil Baby (+0.49), Atlanta Falcons (+0.64), Atlanta Dream (−0.15), Kai Cenat (+0.88), Stranger Things (+0.71) | Atlanta Falcons (+0.64), Atlanta Hawks (+0.72), Atlanta Braves (+0.45) | Atlanta Hawks, Atlanta Braves |
| Seattle, WA | medium | Seattle Kraken (+0.55), Macklemore (−0.01), The Last of Us (−0.05), Stranger Things (+0.71), Ludwig (−0.04) | Stranger Things (+0.71), Seattle Kraken (+0.55), Minecraft (+0.42) | Minecraft |
| Miami, FL | strong | Inter Miami CF (no data), DJ Khaled (+0.01), Stranger Things (+0.71), Fortnite (+0.72), Rick Ross (−0.14) | Fortnite (+0.72), Stranger Things (+0.71), MrBeast (+0.51) | MrBeast |
| Denver, CO | medium | Denver Nuggets (−0.08), Stranger Things (+0.71), Fortnite (+0.72), Illenium (−0.02), Red Rocks Amphitheatre (no data) | Stranger Things (+0.71), Fortnite (+0.72), Minecraft (+0.42) | Minecraft |
| Boston, MA | medium | Boston Celtics (−0.04), Stranger Things (+0.71), Fortnite (+0.72), Billie Eilish (+0.46) | Stranger Things (+0.71), Fortnite (+0.72), Minecraft (+0.42) | Minecraft |
| Detroit, MI | thin | Eminem (−0.06), Detroit Lions (+0.00), Fortnite (+0.72), Big Sean (+0.05), Stranger Things (+0.71) | Fortnite (+0.72), Stranger Things (+0.71), Big Sean (+0.05) | — |
| Nashville, TN | thin | CMA Fest (−0.37), Nashville SC (−0.03), The Try Guys (no data), Grand Ole Opry (no data), Taylor Swift (−0.05) | Stranger Things (+0.71), Fortnite (+0.72), Morgan Wallen (+0.21) | Stranger Things, Fortnite, Morgan Wallen |
| Mumbai | medium | Minecraft (+0.42), Karan Aujla (−0.20), Kota Factory (−0.23), Mumbai Indians (−0.07), BeerBiceps (no data) | Fortnite (+0.72), Minecraft (+0.42), Stranger Things (+0.71) | Fortnite, Stranger Things |
| New Delhi | thin | PUBG Mobile India (+0.01), Prateek Kuhad (−0.21), Kota Factory (−0.23), Delhi Capitals (no data), BeerBiceps (Ranveer Allahbadia) (no data) | Fortnite (+0.72), Minecraft (+0.42), Stranger Things (+0.71) | Fortnite, Minecraft, Stranger Things |
| Bengaluru | medium | Royal Challengers Bengaluru (no data), The Local Train (+0.47), PUBG Mobile India (+0.01), Dice Media (no data), Nikhil Kamath (−0.29) | Fortnite (+0.72), Minecraft (+0.42), Stranger Things (+0.71) | Fortnite, Minecraft, Stranger Things |
| Hyderabad | thin | PUBG Mobile India (+0.01), Allu Arjun (−0.37), Sunrisers Hyderabad (no data), MTV Hustle (no data), Nikhil Vijay (no data) | Fortnite (+0.72), Minecraft (+0.42), Stranger Things (+0.71) | Fortnite, Minecraft, Stranger Things |
| Chennai | thin | Anirudh Ravichander (−0.23), Chennai Super Kings (−0.04), Biswa Kalyan Rath (−0.36), Valorant (+0.57), The Ranveer Show (no data) | Fortnite (+0.72), Valorant (+0.57), Stranger Things (+0.71) | Fortnite, Stranger Things |
