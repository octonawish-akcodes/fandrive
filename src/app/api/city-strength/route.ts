import { CityNotFoundError, createTools } from "@/lib/engine/tools";
import { getQlooApi } from "@/lib/qloo";
import { limitByIp } from "@/lib/ratelimit";


export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get("city")?.trim() ?? "";
  if (city.length < 2 || city.length > 80) return Response.json({ error: "Enter a city" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await limitByIp(ip, "city"))) return Response.json({ error: "Slow down" }, { status: 429 });
  try {
    const s = await createTools(getQlooApi()).cityStrength(city);
    return Response.json({ name: s.locality.name, disambiguation: s.locality.disambiguation, badge: s.badge, cells: s.cells });
  } catch (e) {
    if (e instanceof CityNotFoundError) return Response.json({ error: "City not found" }, { status: 404 });
    return Response.json({ error: "Lookup failed" }, { status: 502 });
  }
}
