import type { NameRef } from "./tools";

const DEFAULT: NameRef[] = [
  { name: "Sabrina Carpenter", type: "artist" }, { name: "Olivia Rodrigo", type: "artist" }, { name: "Taylor Swift", type: "artist" },
  { name: "Bad Bunny", type: "artist" }, { name: "Kendrick Lamar", type: "artist" }, { name: "Billie Eilish", type: "artist" },
  { name: "Morgan Wallen", type: "artist" }, { name: "Travis Scott", type: "artist" }, { name: "SZA", type: "artist" },
  { name: "Karol G", type: "artist" }, { name: "Stranger Things", type: "tv_show" }, { name: "Fortnite", type: "videogame" },
  { name: "Minecraft", type: "videogame" }, { name: "MrBeast", type: "person" }, { name: "National Football League", type: "brand" },
  { name: "WWE", type: "brand" },
];
const LOCAL: Record<string, NameRef[]> = {
  houston: [{ name: "Houston Astros", type: "brand" }, { name: "Houston Texans", type: "brand" }, { name: "Houston Rockets", type: "brand" }],
  atlanta: [{ name: "Atlanta Hawks", type: "brand" }, { name: "Atlanta Braves", type: "brand" }, { name: "Atlanta United FC", type: "brand" }],
  seattle: [{ name: "Seattle Seahawks", type: "brand" }, { name: "Seattle Kraken", type: "brand" }, { name: "Seattle Sounders FC", type: "brand" }],
  mumbai: [{ name: "Mumbai Indians", type: "brand" }, { name: "Arijit Singh", type: "artist" }, { name: "Diljit Dosanjh", type: "artist" },
    { name: "Anirudh Ravichander", type: "artist" }, { name: "Virat Kohli", type: "person" }],
};

export function seedPartners(city: string): NameRef[] {
  const key = Object.keys(LOCAL).find((k) => city.toLowerCase().includes(k));
  return [...(key ? LOCAL[key] : []), ...DEFAULT];
}
