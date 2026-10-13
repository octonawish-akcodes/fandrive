# FanDrive

**Every fandom is a blood drive waiting to happen.** FanDrive is an AI agent for blood banks and student organisers. It uses Qloo taste data to find which fan bases skew young in a city, where those fans live, and which venues nearby can host a drive. Then it writes the plan.

**Live demo:** coming with the first deploy.

## The problem

- The American Red Cross declared its second-ever national blood supply crisis in August 2026 and launched a $300M "LifeBlood Fund" in October 2026.
- Donors under 30 fell 47% in ten years (Blood Centers of America). Most donations now come from donors over 50, and only about 3% of eligible Americans donate (AABB, January 2026).
- Pop-culture partnerships already work: Game of Thrones' "Bleed for the Throne" brought 60,000 new donors, and the NFL partnership 150,000+ first-time donors over seven years.
- Partners are still picked by gut feel. Metallica's drive (25,000+ donations since April 2025) recruited only 16% first-timers. On Qloo, Metallica's fans skew 45–54.

FanDrive replaces the gut feel with measured taste data.

## How it works

1. **City check.** Qloo resolves the city ("Bombay" → Mumbai) and FanDrive grades how much data exists (strong / medium / thin).
2. **The agent picks candidates.** A Gemini agent proposes 10–16 partners: artists, teams, shows, games and creators, plus any the user names. It calls the `score_partners` tool, reads the results and recommends 1–3 partners with `finish`.
3. **Scoring (all Qloo).** For each candidate:
   - **Youth skew:** how much the fan base skews 24-and-under.
   - **Local love:** how much young people in this city like it.
   - **Fan density:** how concentrated its fans are in the city compared with a baseline of mass brands.

   Young-Donor Pull = 0.35 × youth + 0.45 × local + 0.20 × density.
4. **Fan zones and venues.** Heatmap cells where the partner beats the baseline are clustered into up to three fan zones. Venues near each zone are sorted into *host here* (schools, colleges, community centres, gyms, places of worship, event halls) and *promote here* (cafes, restaurants, bars — bars are never hosts). Venues unsuitable for a youth health campaign are never suggested.
5. **Campaign copy.** Theme, poster, three social posts, a friend invite and a partnership pitch email. Copy that invents numbers, implies the celebrity endorses the drive, or leaks instructions is replaced field by field with template text.
6. **FanDrive vs plain AI.** The same model is asked for picks *without* Qloo, then each pick is fact-checked against Qloo's age data.

If the AI is unavailable, **autopilot** runs the same Qloo tools in a fixed order with template copy, so every plan finishes. The agent log on the left of the screen shows every step as it happens.

## How Qloo is used

| Endpoint and parameters | Why |
|---|---|
| `GET /search?query=…&types=urn:entity:…` | Resolve and confirm each candidate name; mismatches are excluded with a reason. |
| `GET /v2/insights` `filter.type=urn:demographics` + `signal.interests.entities` | Age skew of each fan base (youth skew). |
| `GET /v2/insights` `filter.type=urn:entity:<type>` + `signal.location.query` + `signal.demographics.age` + `filter.results.entities` | How much young people in this city like each shortlisted partner, in one call per type. |
| `GET /v2/insights` `filter.type=urn:heatmap` + `filter.location.query` + `signal.interests.entities` | Where the partner's fans are. Lift = partner affinity rank minus the mean of a baseline set (Coca-Cola, Netflix, McDonald's, NFL, Taylor Swift). The anchor heatmap's cell count sets the city's data badge. |
| `GET /v2/insights` `filter.type=urn:entity:place` + `filter.location=POINT(lon lat)` + `filter.location.radius` + `signal.interests.entities` | Venues near each fan zone, ranked by affinity, young-crowd tags, event space and opening hours on the drive date. |

The client stays under the key's limits (5 requests/second, 10,000/month): it sends at most 3 requests/second, pauses everyone after a 429, and caches every response (Upstash Redis in production; disk for local scripts).

## FanDrive vs plain AI

Plain AI suggests famous names. Qloo shows who their fans actually are. In a live Houston run, plain AI suggested Megan Thee Stallion, Travis Scott, MrBeast, Fortnite and Stranger Things. Qloo confirmed four skew young but showed Megan Thee Stallion's fans are "not especially young" (+0.22). Meanwhile the agent, using Qloo scores, found Roblox (+0.93) and Kai Cenat.

## Safety and privacy

- Only public cultural names, city names and coordinates go to Qloo. No personal data is collected or sent.
- Results describe crowd-level tendencies ("fans skew younger"), never individuals.
- No medical advice: copy asks people to check their eligibility with their blood service.
- Public copy treats a fandom as a theme ("Kai Cenat fans"), never as an endorser; the pitch email proposes an official partnership.
- User text is passed to the agent as data inside `<user_input>` and is never followed as instructions.
- Keys live only in environment variables and a git-ignored `.env.local`, never in client code, fixtures, logs or recordings.
- The free Gemini tier may use prompts to improve Google's products. FanDrive's prompts contain no personal data.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # add QLOO_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY
pnpm dev                     # http://localhost:3000
pnpm test                    # unit tests (Vitest)
pnpm typecheck && pnpm lint
```

Optional settings:
- `GEMINI_MODEL` and `GEMINI_FALLBACK_MODELS`: the model chain. The first model to answer is used.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: shared cache, saved plans and rate limits.
- `QLOO_CACHE_DIR`: a disk cache for scripts. `pnpm spike` and `pnpm record` set it to `.cache/qloo`.

## Data limits

From the live data spike (`docs/spike/2026-10-13.md`):

1. **City data badge.** Houston and Seattle show "medium" because their anchor heatmaps have fewer than 1,000 cells. Cell count is only a rough measure: Mumbai (999) beats Houston (644).
2. **Local love saturates.** Every partner that passes Qloo's threshold scores 0.92–1.00, so it acts as a presence check. City-specific signal comes from fan density.
3. **Youth-wide fandoms often lead.** Fortnite, Stranger Things, MrBeast and Minecraft top many cities. Local icons (Bad Bunny, Travis Scott, the Rockets, the Kraken, the Hawks) land in the top five. Qloo's youngest age bucket is "24 and younger", which includes people too young to donate.
4. **Some zones have few host venues.** For example, places near Atlanta Hawks fan clusters are mostly restaurants.
5. **India.** Qloo's youth signal is thinner. Arijit Singh and Virat Kohli skew older than global fandoms.
6. **AI availability.** Gemini's free tier allows about 20 requests per model per day and often answers "high demand". FanDrive switches models, then falls back to autopilot.

## Licence

MIT, see [LICENSE](LICENSE).

## Built with

Next.js 16, Vercel AI SDK 7 with Google Gemini, Qloo Taste AI, Upstash Redis and MapLibre. Built with the help of Claude Code (Anthropic).
