import { writeFileSync, mkdirSync } from "node:fs";

const USER = process.env.GH_USER || "EDaniel-B";
const TOKEN = process.env.GH_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
};

// kind: "lang" usa la API de lenguajes, "topic" usa los topics del repo
const TECH = [
  { name: "C#", kind: "lang", key: "C#", color: "#512BD4" },
  { name: "ASP.NET Core", kind: "topic", key: "aspnet-core", color: "#5C2D91" },
  { name: "Node.js", kind: "topic", key: "nodejs", color: "#339933" },
  { name: "TypeScript", kind: "lang", key: "TypeScript", color: "#3178C6" },
  { name: "JavaScript", kind: "lang", key: "JavaScript", color: "#F7DF1E" },
  { name: "React", kind: "topic", key: "react", color: "#61DAFB" },
  { name: "SQL Server", kind: "topic", key: "sql-server", color: "#CC2927" },
  { name: "PostgreSQL", kind: "topic", key: "postgresql", color: "#4169E1" },
  { name: "Prisma", kind: "topic", key: "prisma", color: "#0C344B" },
];

const get = async (url) => {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

const repos = (
  await get(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`)
).filter((r) => !r.fork);

const counts = Object.fromEntries(TECH.map((t) => [t.name, 0]));

for (const repo of repos) {
  const langs = Object.keys(await get(repo.languages_url));
  const topics = repo.topics || [];
  for (const t of TECH) {
    const hit = t.kind === "lang" ? langs.includes(t.key) : topics.includes(t.key);
    if (hit) counts[t.name]++;
  }
}

const level = (n) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4);

const rows = TECH.map((t) => ({ ...t, repos: counts[t.name], lvl: level(counts[t.name]) }))
  .filter((r) => r.lvl > 0)
  .sort((a, b) => b.lvl - a.lvl || b.repos - a.repos);

const W = 560, ROW = 36, TOP = 20, TRACK = 280, X0 = 150;
const H = TOP * 2 + rows.length * ROW;

const bars = rows
  .map((r, i) => {
    const y = TOP + i * ROW;
    const w = (r.lvl / 4) * TRACK;
    return `
  <text class="label" x="0" y="${y + 12}">${r.name}</text>
  <rect class="track" x="${X0}" y="${y}" width="${TRACK}" height="14" rx="7"/>
  <rect class="bar" x="${X0}" y="${y}" width="${w}" height="14" rx="7" fill="${r.color}" style="animation-delay:${(i * 0.15).toFixed(2)}s"/>
  <text class="meta" x="${X0 + TRACK + 14}" y="${y + 12}">${r.lvl}/4 · ${r.repos} repo${r.repos > 1 ? "s" : ""}</text>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Experience scale based on GitHub repositories">
<style>
  .label{font:600 13px 'Segoe UI',Arial,sans-serif;fill:#24292f}
  .meta{font:12px 'Segoe UI',Arial,sans-serif;fill:#57606a}
  .track{fill:#d0d7de}
  .bar{transform-box:fill-box;transform-origin:left center;animation:grow 1.2s cubic-bezier(.22,1,.36,1) both}
  @keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  @media (prefers-color-scheme:dark){
    .label{fill:#e6edf3}.meta{fill:#8b949e}.track{fill:#30363d}
  }
</style>
<g transform="translate(10,0)">${bars}
</g>
</svg>`;

mkdirSync("assets", { recursive: true });
writeFileSync("assets/skills.svg", svg);
console.log(`Generado con ${rows.length} tecnologías`);