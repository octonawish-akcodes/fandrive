<div align="center">

# FanDrive

### Every fandom is a blood drive waiting to happen.

An AI agent for blood banks and student organisers. It uses **Qloo taste data** to find which fandoms skew young in your city, where those fans live and which venues nearby can host a drive. Then it writes the posters.

![License: MIT](https://img.shields.io/badge/license-MIT-000000?style=flat-square)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![Qloo Taste AI](https://img.shields.io/badge/Qloo-Taste%20AI-FF4949?style=flat-square)
![Gemini](https://img.shields.io/badge/agent-Gemini-90A8FF?style=flat-square)
![Tests](https://img.shields.io/badge/tests-156%20passing-23C78A?style=flat-square)
![Qloo Agentic Hackathon](https://img.shields.io/badge/Qloo%20Agentic%20Hackathon-2026-FFC900?style=flat-square)

### [▶ Try the live demo](https://fandrive-nu.vercel.app) · [Watch Houston](https://fandrive-nu.vercel.app/plan?example=houston) · [Watch Mumbai](https://fandrive-nu.vercel.app/plan?example=mumbai)

<img src="docs/images/hero.png" alt="FanDrive planner: 'Houston's next blood drive is a Kai Cenat party.' with the yellow plan form" width="100%">

</div>

---

## ⚡ Judges: try it in 60 seconds

| | |
|---|---|
| **1. Watch the agent** | Open [the app](https://fandrive-nu.vercel.app) and click **Watch Houston** (or Atlanta, Seattle, Mumbai). A recorded agent run replays in about 8 seconds. |
| **2. Run it live** | Type any city and press **Plan my drives**. The agent tests a dozen fandoms against Qloo and builds the plan live, usually in 25–90 seconds. |
| **3. Check the receipts** | Every partner has a **Qloo evidence** drop-down, and the **Plain AI check** shows what the same model suggests *without* Qloo. |

> **Live demo: https://fandrive-nu.vercel.app** · no sign-up, no API key.

---

## The problem

- 🩸 The American Red Cross declared its **second-ever national blood supply crisis** in August 2026.
- 📉 **Donors under 30 fell 47% in ten years** (Blood Centers of America). Only about **3% of eligible Americans** donate (AABB, 2026).
- 🎸 **Fandoms already fill blood drives:** the Red Cross × NFL partnership brought **150,000+ first-time donors**, and the Peanuts Snoopy shirt sent Red Cross search interest up **600%**.
- 🎯 **But partners are picked by gut feel.** Metallica's drives recruited only **16% first-timers**, and on Qloo their fans skew 45–54.

**FanDrive replaces the gut feel with taste data**, and tells you exactly where to set up.

---

## What you get

### 1 · The fandoms that bring young first-time donors

The agent proposes candidates (artists, teams, shows, games, creators). Qloo scores each one on **how young its fans are**, **how much your city's young people love it** and **how concentrated its fans are**. The agent then makes its picks.

<img src="docs/images/cards.png" alt="Houston report card: Kai Cenat +0.88 (AI pick 1), Travis Scott +0.46 (AI pick 2), and the plain-AI check" width="100%">

### 2 · Where the fans are, and where to host

Qloo heatmaps reveal the neighbourhoods where each fan base beats the city's baseline. FanDrive finds venues nearby and sorts them into **host here** (schools, colleges, halls, gyms, places of worship) and **flyers only** (cafés, restaurants, and bars, which never host).

<img src="docs/images/map.png" alt="Map of Houston with Kai Cenat and Travis Scott fan zones and venue pins, next to a 'Where to host' list" width="100%">

### 3 · The agent shows its work, and the campaign is ready to print

Every step streams live as the agent works. The poster, three social posts, a friend invite and a partnership pitch email come out ready to copy.

<img src="docs/images/agent.png" alt="Red poster card and the green 'What the agent did' checklist, done in 24 seconds" width="100%">

<img src="docs/images/kit.png" alt="Campaign kit with three social posts, a friend invite and a pitch email" width="100%">

### 4 · Every fandom, ranked with evidence

<img src="docs/images/ranking.png" alt="Ranking of every fandom tested, with youth-skew bars and Qloo evidence" width="100%">

---

## 🧪 FanDrive vs plain AI

The same model is asked for partners **without Qloo**, then every pick is fact-checked against Qloo's age data.

| City | Plain AI suggested | What Qloo says |
|---|---|---|
| **Mumbai** | Karan Aujla, Mumbai Indians, College Romance, MostlySane, Valorant India | 3 skew **older** (−0.20, −0.07, −0.23), 2 have no data. It **missed Minecraft (+0.42)**. |
| **Houston** | Travis Scott, Houston Rockets, Euphoria, GTA VI | Reasonable picks, but it **missed Kai Cenat (+0.88)**, Houston's youngest fan base. |

<img src="docs/images/mumbai.png" alt="Mumbai report card: Minecraft as the AI pick, and plain AI got 3 wrong and missed Minecraft" width="100%">

> *"If your submission would work the same without Qloo, you're building the wrong thing."* Without Qloo, FanDrive would recommend famous names. With Qloo, it recommends the fan bases that are actually young, actually local, and actually near a hall that can host.

---

## How it works

```mermaid
flowchart LR
    U([Blood bank or<br/>student organiser]) -->|city, ages, dates| A{{Gemini agent}}
    A -->|score_partners| T1[Search + confirm<br/>each name]
    T1 --> Q1[(Qloo /search)]
    A -->|score_partners| T2[Youth skew<br/>local love<br/>fan density]
    T2 --> Q2[(Qloo insights:<br/>demographics, city affinity,<br/>heatmap vs baseline)]
    A -->|finish: picks + why| M[Map fan zones<br/>+ find venues]
    M --> Q3[(Qloo places near<br/>each fan zone)]
    M --> W[Write campaign copy<br/>+ guards]
    W --> R([Report card])
    A -.->|AI down or slow| P[Autopilot:<br/>same tools, fixed order]
    P --> M
    R --> C[Plain-AI check<br/>fact-checked by Qloo]
```

**Young-Donor Pull** = 0.35 × youth skew + 0.45 × local love + 0.20 × fan density. Any fandom whose fans skew older always ranks below the young ones, and the agent can't override that.

## How Qloo is used

| Endpoint and parameters | Why |
|---|---|
| `GET /search?query=…&types=urn:entity:…` | Resolve and confirm each candidate. Mismatches are excluded with a reason. |
| `GET /v2/insights` `filter.type=urn:demographics` + `signal.interests.entities` | Age skew of each fan base. |
| `GET /v2/insights` `filter.type=urn:entity:<type>` + `signal.location.query` + `signal.demographics.age` + `filter.results.entities` | How much young people in *this* city like each shortlisted fandom, in one call per type. |
| `GET /v2/insights` `filter.type=urn:heatmap` + `filter.location.query` + `signal.interests.entities` | Where the fans are. Lift = fandom affinity rank minus a baseline of mass brands (Coca-Cola, Netflix, McDonald's, NFL, Taylor Swift). |
| `GET /v2/insights` `filter.type=urn:entity:place` + `filter.location=POINT(lon lat)` + `filter.location.radius` | Venues near each fan zone, ranked by affinity, young-crowd tags, event space and opening hours on the drive date. |

## 🛡️ Built to be trusted

- **No invented facts.** Copy with numbers the tools never returned (digits *or* words, like "forty percent") falls back to template text.
- **No fake endorsements.** Public copy may only mention a fandom as fandom ("Kai Cenat fans"), never as if the artist, team or game were involved.
- **Sensible venues.** No drives at bars, shooting ranges, cigar or vape shops, tattoo parlours, children's schools or private homes.
- **Always finishes.** A Gemini fallback chain plus deadlines; if the AI is down, autopilot finishes the plan with the same Qloo tools.
- **Respects the API.** At most 3 Qloo requests/second, a pause on 429s, Redis caching, and a daily budget across all servers.
- **Private by design.** Only public names, cities and coordinates go to Qloo. Results are crowd-level tendencies, never about individuals. Keys stay server-side.
- **Prompt-injection safe.** User text reaches the agent only as data, and the agent can only call read-only tools.

<div align="center">
<img src="docs/images/phone.png" alt="FanDrive on a phone" width="300">
<br><em>Works on phones too.</em>
</div>

## Run locally

```bash
pnpm install
cp .env.example .env.local   # add QLOO_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY
pnpm dev                     # http://localhost:3000
```

| Setting | What it does |
|---|---|
| `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS` | The model chain. The first model to answer is used. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared cache, saved plans, rate limits and the daily budget. **Required in production.** |
| `QLOO_DAILY_BUDGET` | Uncached Qloo calls allowed per day across all servers (default 400). |
| `QLOO_CACHE_DIR` | Disk cache for scripts. `pnpm spike` and `pnpm record` use `.cache/qloo`. |

## Quality

- **156 tests** (Vitest), typecheck and lint on every push (GitHub Actions).
- Reviewed end to end by a separate code-review agent; every critical and important finding was fixed test-first.
- Live data spike and tuning notes: [`docs/spike/2026-10-13.md`](docs/spike/2026-10-13.md). Design spec: [`docs/superpowers/specs`](docs/superpowers/specs).

```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```

## Data limits

1. **City data varies.** Houston and Seattle are "medium"; rankings there are directional.
2. **Local love saturates.** Popular fandoms score 0.92–1.00, so city-specific signal comes from fan density.
3. **Youngest bucket is "24 and under".** It includes people too young to donate; eligibility rules always apply.
4. **India data is thinner.** Global fandoms often out-score local stars on youth skew.
5. **Free-tier AI is flaky.** Gemini's free tier caps requests per model per day; FanDrive switches models, then falls back to autopilot.

## Roadmap

- **Organiser mode** for student groups (NSS, Rotaract, college clubs), with a simpler form and a shareable drive page.
- **MCP endpoint**, so other AI agents can plan drives with FanDrive.
- **Method page:** Qloo youth skew of past blood-drive partners next to their published results.

## Licence

[MIT](LICENSE) © 2026 Abhishek Kumar

Built with Next.js 16, the Vercel AI SDK with Google Gemini, Qloo Taste AI, Upstash Redis and MapLibre. Built with the help of Claude Code (Anthropic).
