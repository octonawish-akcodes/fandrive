# Devpost submission draft

Copy each section into the matching Devpost field. Numbers are from the live app, the [20-city evaluation](eval/README.md) and the sources on the [method page](https://fandrive-nu.vercel.app/method).

**Project name:** FanDrive

**Tagline (≤ 200 characters):** An AI agent that uses Qloo taste data to find the fandoms that bring young first-time blood donors, where those fans live, and which venues nearby can host the drive.

**Links**
- Live demo: https://fandrive-nu.vercel.app
- For judges (2-minute tour): https://fandrive-nu.vercel.app/judges
- Recorded runs: https://fandrive-nu.vercel.app/plan?example=houston · https://fandrive-nu.vercel.app/plan?example=mumbai
- Method and evaluation: https://fandrive-nu.vercel.app/method
- Code (MIT): https://github.com/octonawish-akcodes/fandrive
- MCP endpoint: https://fandrive-nu.vercel.app/api/mcp

---

## Inspiration

On 27 July 2026 the American Red Cross declared its second-ever national blood supply crisis, and donors under 30 are down about 39% since 2015 (Blood Centers of America). Fandoms already fill blood drives: the Red Cross × NFL partnership brought in 150,000+ first-time donors. But partners are chosen by gut feel, and famous isn't the same as young. Metallica's drives recruited only 16% first-timers, and on Qloo its fans skew 45–54.

We asked: what if a blood bank could see which fan bases in *its* city are young, where they live and which hall nearby can host, before it picks a partner?

## What it does

You type a city. An AI agent then:

1. **Finds candidates.** It proposes artists, teams, shows, games and creators. Qloo adds its own **local taste**: the artists and athletes young people in that city over-index on compared with 10 reference cities.
2. **Scores each one with Qloo.** It measures how young the fans are, how much the city's young people love it, and how concentrated its fans are (heatmap lift over a baseline of mass brands).
3. **Picks the partners.** Older-skewing fan bases can't outrank young ones, and every report leads with one local pick. In Houston it chose Astros star Jeremy Peña (+0.98) and rapper Don Toliver; in Seattle, Seattle-born Paolo Banchero (+0.99); in Detroit, Cade Cunningham (+0.87).
4. **Maps the fans and finds venues.** It shows the neighbourhoods where those fans live and venues nearby that can host (schools, colleges, halls, gyms, places of worship). Bars only get flyers.
5. **Writes the campaign.** A poster, three social posts, a friend invite and a partnership pitch email, all guarded against invented numbers and fake endorsements.
6. **Checks itself.** The same model is asked *without* Qloo, and every one of its picks is fact-checked against Qloo's age data.

Every Qloo request is listed as a receipt you can re-run with curl. FanDrive is also an MCP server, so any agent can call `plan_blood_drive`, `score_fandoms` or `city_strength`.

## How we built it

- **App:** Next.js 16 on Vercel, Vercel AI SDK 7 with Google Gemini (a fallback chain across four models), Upstash Redis and MapLibre.
- **Qloo calls:**
  - `/search` to resolve and confirm names.
  - `/v2/insights` with five filter types: `urn:demographics` for age skew; `urn:entity:<type>` with location and age for local love, and without an entity filter for local taste; `urn:heatmap` for fan zones; `urn:entity:place` with `filter.tags` for host venues; and `urn:tag` for what the fans also love.
  - `/v2/tags` to look up venue tags, and `/v2/trending` for momentum.
- **Agent tools:** score partners, map a partner, finish. The app always adds the user's own names and Qloo's local taste. If the AI is down, autopilot finishes the plan with the same Qloo tools.
- **Quality:** 203 tests (Vitest), CI typecheck and lint, and a 20-city evaluation script (`pnpm eval`).

## Challenges we ran into

- **Making "local" mean local.** Qloo's city lists for young people are full of national teen stars (one actor topped five US cities). We filter names that top more than one other reference city, keep athletes and artists, and compare Indian cities only with US ones because Qloo's Indian city data is national.
- **Safety on a public health campaign.** Live Qloo data surfaced identity and religion tags, a children's museum as a "host venue", and band names with profanity. Each now has a filter and a test.
- **Free-tier AI.** Gemini's free tier allows about 20 requests per model per day. A fallback chain, deadlines and an autopilot path mean a plan always finishes.

## Accomplishments that we're proud of

- **Qloo's age signal checked against the real world.** Across 8 leagues, Qloo's young-vs-old lean matches Nielsen's ages of TV viewers with a rank correlation of **−0.71**. Golf, NASCAR and baseball, the three oldest audiences, are the only three Qloo scores as older-leaning.
- **A 20-city evaluation.** Of 96 partners a plain LLM suggested, **31% have fans who skew older** than average and **60% were not young-skewing or had no Qloo data**. FanDrive's top 3 averaged youth skew **+0.74 vs +0.25**, and every city got a local pick (18 different fandoms).
- **Every plan shows its work:** the agent's steps, the evidence for each score and every Qloo request.
- **Private by design.** Only public names, cities and coordinates go to Qloo, and results describe crowds, never individuals.

## What we learned

Taste data changes the answer. An LLM suggests famous names; Qloo shows which fan bases are actually young, actually local and actually near a hall that can host. The most useful signal wasn't a single score but Qloo's local taste: hometown athletes and artists an LLM rarely thinks of.

## What's next

- **Organiser mode** for student groups (NSS units, Rotaract, college clubs), with a simpler form and a shareable drive page.
- **A pilot with a blood centre,** to measure first-time donors from a fandom-themed drive against its usual drives.

## Built with

nextjs, typescript, react, tailwindcss, vercel, vercel-ai-sdk, google-gemini, qloo, upstash-redis, maplibre, mcp, vitest
