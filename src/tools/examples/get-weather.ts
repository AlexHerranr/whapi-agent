import { z } from "zod";
import type { ToolDefinition } from "../types.js";

const schema = z.object({
  location: z.string().describe("City or latitude,longitude pair."),
});

export const getWeatherTool: ToolDefinition<z.infer<typeof schema>> = {
  name: "get_weather",
  description:
    "Return the current weather for a location using the free Open-Meteo API.",
  schema,
  execute: async ({ location }) => {
    const coords = await resolveLocation(location);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(coords.latitude));
    url.searchParams.set("longitude", String(coords.longitude));
    url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo failed: ${res.status}`);
    const data = (await res.json()) as {
      current: {
        temperature_2m: number;
        weather_code: number;
        wind_speed_10m: number;
      };
    };

    return {
      location: coords.label,
      temperature_c: data.current.temperature_2m,
      wind_kmh: data.current.wind_speed_10m,
      code: data.current.weather_code,
    };
  },
};

async function resolveLocation(
  query: string,
): Promise<{ latitude: number; longitude: number; label: string }> {
  const coordMatch = query.match(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/);
  if (coordMatch) {
    const [latStr, lonStr] = query.split(",").map((s) => s.trim());
    return {
      latitude: Number(latStr),
      longitude: Number(lonStr),
      label: query,
    };
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = (await res.json()) as {
    results?: { latitude: number; longitude: number; name: string; country?: string }[];
  };
  const hit = data.results?.[0];
  if (!hit) throw new Error(`Location not found: ${query}`);
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    label: hit.country ? `${hit.name}, ${hit.country}` : hit.name,
  };
}
