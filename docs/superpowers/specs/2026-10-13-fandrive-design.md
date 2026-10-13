# FanDrive — design spec

Date: 2026-10-13 · Event: Qloo Agentic Hackathon (deadline 2026-10-30 23:45 EDT = 2026-10-31 09:15 IST) · Status: draft for review

> **Every fandom is a blood drive waiting to happen.**
> FanDrive is an AI agent that helps blood banks and student organisers win back young blood donors. It measures which fandom to build a drive around, where those fans live in a city, and which nearby venues fit, then writes the drive plan.

## 1. Problem (evidence)

- The American Red Cross declared its second-ever national blood supply crisis in August 2026 and launched a $300M "LifeBlood Fund" in October 2026.
- Donors under 30 fell 47% in ten years (Blood Centers of America). Most donations now come from donors over 50, and only about 3% of eligible Americans donate (AABB, January 2026).
- Blood banks already use pop-culture partnerships to recruit young donors:
  - Game of Thrones "Bleed for the Throne": 60,000 new donors.
  - Peanuts/Snoopy: +40% donations week over week.
  - NFL: 150,000+ first-time donors over seven years.
  - Metallica: 25,000+ donations since April 2025; 16% first-time, about half of those aged 16–24.
- Partners and sites are chosen by gut feel. Metallica's fans skew 45–54 on Qloo, which fits the small young-first-timer share.
- Performance-based donor recruitment is priced at roughly $30 per donation, so recruitment is a paid problem.

## 2. Users and modes

| Mode | User | Input | Output |
|---|---|---|---|
| **Staff** (main) | Donor-recruitment and partnership staff at blood banks (Red Cross regions, independent blood centres) | City, goal (e.g. "300 first-time donors aged 16–24"), date range, optional partners to test | Live agent run, then the full drive plan (report layout C) |
| **Organiser** | Student or volunteer running a campus or community drive | Where (campus or area), 2–5 things their crowd loves or "suggest for me", date | One phone-friendly drive card |
| **MCP clients** | Anyone using Claude, ChatGPT or another MCP client | Tool calls | The same Qloo-backed tools |

Real-user plan:
1. Share organiser mode with Indian college blood-donation clubs (NSS, Rotaract).
2. Email donor-recruitment staff at a few US blood centres; the user sends, from a drafted email.
3. Collect answers through the in-app feedback form.

Report what comes back honestly in the README and the Devpost write-up.

## 3. Scope

**In:**
- staff mode
- organiser mode
- live agent view
- report with map
- shared plan links and feedback form
- plain-AI comparison
- data-strength badge
- recorded example runs (Houston, Atlanta, Seattle, Mumbai)
- autopilot fallback
- MCP endpoint
- method and evidence page
- consistency check against public Red Cross campaign results
- tests and CI

**Out (YAGNI):**
- user accounts and logins
- donor databases, or any personal data
- booking or scheduling integrations with blood banks
- payments
- native mobile apps
- non-English UI
- live trend data (Qloo's trending endpoint returns nothing)
- brand-new releases as core signals (Qloo has no taste data for them)

## 4. Screens and flow (approved layout C)

1. **Home.**
   - Hook line, two entry buttons ("I work at a blood bank" / "I'm organising a drive").
   - Example-city chips that replay recorded runs instantly; each is labelled "Recorded run, <date>" with a "Run live" button.
2. **Staff input:** city (with a data-strength badge once typed), goal (target donors, age band 16–24 or 18–29, first-timers yes/no), date range, optional partner names.
3. **Staff run (live).** Left column: agent steps streaming ("Checking how young Sabrina Carpenter's fans are…"). Right column: plan sections appear as they finish. When done, the page becomes a report with these sections:
   1. Ranked partners: Young-Donor Pull score, youth-skew bar, local-love value, confidence, Qloo evidence drawer.
   2. Fan map: up to 3 drive zones per top partner, with venue pins.
   3. Venues and dates: 2–3 suitable venues per zone, why each fits, open on the chosen date.
   4. Creative: drive theme, poster copy, 3 social posts, SMS/WhatsApp invite, partner pitch email.
   5. FanDrive vs plain AI: the plain-AI picks, each fact-checked against Qloo.
   6. Data limits for this run.
4. **Organiser wizard (3 steps, phone-first):** where, crowd loves (Qloo-search autocomplete, or "suggest for me"), when.
   - "Where" is resolved through Qloo `/search` (a place such as a campus, or a locality) to get coordinates. No external geocoder is needed.
   - "Suggest for me" scores the city's curated seed list with `city_fit` and `fan_age`, then preselects the top 5.
5. **Organiser drive card:** theme, best 2 venues nearby with reasons, poster text, Instagram caption, WhatsApp message, checklist (contact the local blood bank or bloodmobile, permissions, eligibility link). Buttons: share, "Did this help?".
6. **Shared plan `/p/[id]`:** read-only plan plus a feedback form (role, did you run it, donors registered or collected, usefulness 1–5, comment, and a "don't include personal info" note).
7. **Method page:**
   - how scores are computed
   - Qloo calls used
   - known data limits
   - the consistency check against public campaigns
   - privacy note

## 5. Architecture

- **App:** Next.js (App Router, TypeScript) on Vercel Hobby with Fluid compute. The planning route allows up to 300 s.
- **Agent:**
  - Built with the Vercel AI SDK (current major version, pinned at build time) and the Google provider.
  - Model set by the env var `GEMINI_MODEL`. The default is a Flash-Lite model, because measured free-tier limits are about 500 requests/day for Flash-Lite versus about 20/day for current Flash models. Verify in AI Studio on day 1.
  - The tool loop stops at a step limit. **Hard budget: 5 model calls per plan**, plus 1 for the plain-AI comparison.
- **Tools** are typed server functions. The agent and the MCP endpoint share them:

| Tool | Qloo calls | Returns |
|---|---|---|
| `find_and_confirm(names[], types?)` | `/search` (take ≤ 5) | id, matched name, type, popularity, match confidence; flags mismatches (e.g., "Alex Warren → Alex Clare") |
| `fan_age(ids[])` | `/v2/insights` `filter.type=urn:demographics` per id | age-band skews (-1…1) and gender skew |
| `city_fit(city, ids[], ageBand)` | `/v2/insights` with `signal.location.query`, `signal.demographics.age`, `filter.results.entities` | young-audience affinity per id in that city, or "below Qloo threshold" |
| `fan_zones(city, id)` | `/v2/insights` `filter.type=urn:heatmap` for the partner and for a fixed per-city baseline set | up to 3 zones: centroid, radius, lift, sample cells |
| `venues_near(zone, id, date)` | `/v2/insights` `filter.type=urn:entity:place`, `filter.location=POINT(lon lat)`, `filter.location.radius` (~2.5 km), partner as signal | candidate venues with suitability verdict and reasons |
| `why(ids, target)` | `feature.explainability=true` on the final picks | contribution evidence |
| `city_strength(city)` | heatmap cell count for the baseline set; places depth | badge: strong / medium / thin |

- **Scoring** happens in code (`lib/scoring.ts`), never in the model:
  - Youth skew Y: the `24_and_younger` skew for band 16–24, or the mean of `24_and_younger` and `25_to_29` for band 18–29.
  - Local love L: `city_fit` affinity. Missing values are treated as low, with the note "not a top young-audience signal here".
  - Fan density D: concentration of the partner's high-lift heatmap cells in the city, normalised across candidates.
  - **Young-Donor Pull** = 0.45·Y′ + 0.35·L′ + 0.20·D′. Y′ = (Y+1)/2 and L′ = L (absolute, so an all-old shortlist can't look young). D′ is min-max normalised across this run's candidates.
  - Confidence: high / medium / low, from match confidence, data presence and the city badge.
  - The weights and the exact D normalisation are tuned in the day-1 data spike (§12), against sanity checks.
- **Lift zones:**
  - Lift = partner `affinity_rank` minus the mean `affinity_rank` of the city baseline set, computed over cells present in both.
  - Take the top 30 lift cells and greedily cluster them (≤ 2.5 km) into ≤ 3 zones.
  - Zone name: the most common `neighborhood` property of the zone's venues, falling back to "near <top venue>".
  - The baseline set is fixed broad entities (e.g., Coca-Cola, Netflix, McDonald's, NFL, Taylor Swift) and is cached per city.
- **Venue suitability rules** (domain knowledge, in code):
  - **Prefer** community centres, campuses, gyms and sports facilities, malls and retail, cafés, daytime music or event venues; places with event space, parking, or open on the drive date.
  - **Boost** venues tagged with an 18–24 crowd.
  - **Bars and nightclubs** are labelled "promote here, don't host here": no alcohol around donors, and under-18 donors can't attend.
  - Exclude closed venues.
- **Creative:** the final model step returns a schema-validated object (theme, poster, posts[3], invite, pitch email, checklist). It may only cite numbers present in tool results. Organiser mode uses fan-*themed* wording and adds a reminder not to use official logos or names commercially without permission.
- **Plain-AI comparison:** one Gemini call with no tools (same city and goal). Its partner picks are then run through `find_and_confirm` and `fan_age` and annotated, e.g. "Plain AI picked Metallica — Qloo: fans skew 45–54".
- **Autopilot:**
  - When Gemini errors, rate-limits (429) or exceeds budget, a deterministic planner runs the same tools in a fixed order.
  - Candidates come from a curated per-city seed list plus the user's names.
  - Creative comes from templates.
  - Clearly labelled "Autopilot (AI writer unavailable)".
- **Storage (Upstash Redis via Vercel Marketplace, free tier):**
  - Qloo response cache, keyed by URL, TTL 7 days.
  - Plans, keyed by a random id, TTL 120 days.
  - Feedback entries.
  - Per-IP rate-limit counters.
- **Map:** MapLibre GL with free OpenStreetMap/CARTO tiles; zones drawn as circles, venues as pins.
- **MCP endpoint:**
  - `/api/mcp` via Vercel's `mcp-handler` (2.x, MCP SDK v2, streamable HTTP).
  - Tools: `fandrive_find`, `fandrive_fan_age`, `fandrive_city_fit`, `fandrive_fan_zones`, `fandrive_venues`, `fandrive_plan_drive` (autopilot pipeline, so no Gemini quota is used).
  - Read-only and rate-limited; the README shows how to connect Claude and ChatGPT.
- **Recorded example runs:** JSON fixtures of full runs (steps and plan) committed under `fixtures/runs/`, replayed with step timing in the UI, labelled with the recording date.

## 6. Plan data shape (summary)

`Plan { id, mode, createdAt, city, cityStrength, goal, dates, engine: "agent" | "autopilot" | "recorded", partners[], zones[], venues[], creative, plainAi, steps[], limits[] }`

Each partner carries:
- `{ entityId, name, type, matchConfidence, youthSkew, localLove, density, pull, confidence, evidence[] }`

Each evidence item names the Qloo endpoint and parameters used, and the value returned.

## 7. Error handling

| Situation | Behaviour |
|---|---|
| Qloo 4xx (e.g., invalid signal) | Mark that candidate "no Qloo data" and continue |
| Qloo 5xx or timeout | One retry with backoff, then mark as missing |
| Run with < 3 usable partners | Stop with a clear message and suggestions |
| Unknown or ambiguous city | Ask the user to pick from Qloo's locality match |
| Thin city | Badge shows "thin"; plan still produced with a warning |
| Gemini 429, quota or error | Autopilot |
| Model cites a number not in tool output | Validator strips it; fall back to the template sentence |
| Rate-limit hit on public endpoints | HTTP 429 with a friendly message and a link to the example runs |

## 8. Safety, privacy, IP

- Only public cultural names, city names and coordinates go to Qloo. No personal data. The feedback form asks people not to include personal info.
- Results are worded as crowd-level tendencies ("fans skew younger"), never claims about individuals.
- No medical advice: eligibility and health questions link to official blood-service pages (Red Cross / NHSBT / local).
- Organiser mode warns about logo and trademark use. Staff mode's pitch email proposes an official partnership.
- Keys live only in Vercel env vars and a git-ignored `.env.local`, never in client code, fixtures, logs or recordings.
- Disclose that the free Gemini tier may use prompts for training. Prompts contain no personal data.

## 9. Testing

- **Unit (Vitest):** scoring and normalisation, lift and zone clustering, venue suitability rules, match confidence, plan validation, number-citation validator, autopilot ordering.
- **Contract:** Qloo client against recorded JSON fixtures (no network), including error shapes (400 invalid signal, empty results).
- **Agent:** AI SDK mock model drives the tool loop. Check the budget is enforced and autopilot triggers on 429.
- **E2E (Playwright):** home, then an example run replay, then the report sections render; organiser flow on fixtures; shared plan page; feedback submit (mock storage).
- **CI (GitHub Actions):** typecheck, lint, unit, e2e on fixtures. No live API calls or secrets in CI.

## 10. Proof for judges

1. FanDrive vs plain AI, side by side, in every run.
2. Consistency check on the method page: Qloo youth skew of Red Cross's past partners (Metallica, Game of Thrones, NFL, Peanuts if resolvable) next to their published first-timer results. Framed as "consistent with", not "predicts".
3. Real-user feedback summary (counts and quotes, with permission) in the README and Devpost.
4. A "How Qloo is used" table in the README: each endpoint and why.

## 11. Deployment and config

- Vercel project from a public GitHub repo (`octonawish-akcodes/fandrive`, MIT licence shown in the repo's About box). The user approves repo creation and the first push.
- Env vars: `QLOO_API_KEY`, `QLOO_BASE_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- `/api/plan` is a streaming route with `maxDuration` 300. Independent Qloo calls run in parallel, with a concurrency cap of 6.

## 12. Milestones

| Dates | Work |
|---|---|
| Oct 13–14 | Data spike: validate scoring, lift and venues on Houston, Miami, Nashville, Seattle, Mumbai; fix weights. Scaffold; Qloo client, cache and tools with tests. |
| Oct 15–17 | Agent loop, budget, autopilot, plan schema; staff live view and report; map |
| Oct 18–19 | Organiser mode, shared plans, feedback, plain-AI comparison |
| Oct 20 | **Deploy v1**, record example runs, send to real users |
| Oct 21–23 | MCP endpoint, method page, consistency check, polish |
| Oct 24–26 | Apply feedback; tests and CI hardening; mobile and accessibility pass |
| Oct 27 | Buffer (the user's other hackathon deadlines) |
| Oct 28–29 | README, Devpost write-up, screenshots, final QA |
| Oct 30 (IST evening) | Submit, with ~12 h margin |

## 13. Risks

| Risk | Mitigation |
|---|---|
| Gemini free quota far lower than expected | Flash-Lite default, 5-call budget, recorded runs, autopilot, cache identical requests |
| Qloo latency (multi-second calls, large heatmaps) | Parallel calls, Redis cache, warm example cities, stream progress |
| Brand-new artists or games have no data | Confirm step plus "not enough data" label; seed lists favour established fandoms |
| Thin data outside US/EU (India) | City badge; Mumbai example shows honest limits |
| Judges doubt impact without donor outcomes | Plain-AI comparison, consistency check, real-user feedback, clear decision-support framing |
| Heatmap and city-fit semantics differ from assumptions | Day-1 spike with sanity checks before UI work |

## 14. Open items for the user

- Create a Gemini API key in Google AI Studio, put it in `.env.local` (never in chat), and note the free-tier limits shown there.
- Create a free Upstash Redis database (Vercel Marketplace) when we deploy.
- Approve creation of the public GitHub repo and the first push.
- Ask Qloo (Discord #api-help) to rotate the hackathon key that was pasted in chat earlier.
