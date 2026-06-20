import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const outputPath = resolve(rootDir, "public/og-image.png");
const iconPath = resolve(rootDir, "public/pwa-512x512.png");

const titleLineOne = "Метро";
const titleLineTwo = "Екатеринбурга";
const subtitle = "Следующий поезд и время поездки";

const iconDataUri = `data:image/png;base64,${readFileSync(iconPath).toString("base64")}`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${titleLineOne} ${titleLineTwo}</title>
  <desc id="desc">${subtitle}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B0E12" />
      <stop offset="55%" stop-color="#11161D" />
      <stop offset="100%" stop-color="#0B0E12" />
    </linearGradient>
    <radialGradient id="glowLeft" cx="0" cy="0.45" r="0.95">
      <stop offset="0%" stop-color="#C62828" stop-opacity="0.42" />
      <stop offset="48%" stop-color="#A01D1D" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#0B0E12" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowRight" cx="1" cy="0" r="0.7">
      <stop offset="0%" stop-color="#FF7043" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#0B0E12" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#171D26" />
      <stop offset="100%" stop-color="#0D1117" />
    </linearGradient>
    <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="42" />
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glowLeft)" />
  <rect width="1200" height="630" fill="url(#glowRight)" />

  <g opacity="0.22">
    <circle cx="208" cy="310" r="168" fill="#C62828" filter="url(#softBlur)" />
    <circle cx="996" cy="96" r="104" fill="#D84315" filter="url(#softBlur)" />
  </g>

  <g opacity="0.12" stroke="#FFCC80" stroke-width="3" fill="none">
    <path d="M32 128H454" />
    <path d="M64 172H428" />
    <path d="M88 510H474" />
    <path d="M724 514H1134" />
  </g>

  <g opacity="0.2" stroke="#C62828" stroke-width="2" fill="none">
    <path d="M146 118C210 148 236 220 294 248C352 276 412 274 466 314" />
    <path d="M764 174C842 138 920 136 1002 162C1052 178 1090 202 1136 232" />
  </g>

  <rect x="72" y="82" width="430" height="466" rx="46" fill="url(#panel)" opacity="0.96" />
  <rect x="72" y="82" width="430" height="466" rx="46" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" />

  <rect x="116" y="126" width="342" height="342" rx="56" fill="#0B0E12" opacity="0.84" />
  <image x="139" y="149" width="296" height="296" href="${iconDataUri}" preserveAspectRatio="xMidYMid meet" />

  <rect x="116" y="478" width="236" height="12" rx="6" fill="#FFCC80" opacity="0.92" />
  <rect x="116" y="505" width="156" height="12" rx="6" fill="#C62828" opacity="0.92" />

  <g font-family="Verdana, Arial, sans-serif" fill="#F8FAFC">
    <text x="556" y="226" font-size="80" font-weight="700" letter-spacing="0.2">Метро</text>
    <text x="556" y="312" font-size="74" font-weight="700" letter-spacing="0.1">Екатеринбурга</text>
    <text x="556" y="392" font-size="33" font-weight="400" fill="#D7DEE7">Следующий поезд и время поездки</text>
  </g>

  <rect x="556" y="438" width="190" height="10" rx="5" fill="#C62828" />
  <rect x="770" y="438" width="96" height="10" rx="5" fill="#FFCC80" />
</svg>
`;

const tempDir = mkdtempSync(join(tmpdir(), "ekb-metro-og-"));
const tempSvgPath = join(tempDir, "og-image.svg");
const tempPngPath = join(tempDir, "og-image.png");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(tempSvgPath, svg);

try {
  execFileSync("sips", ["-s", "format", "png", tempSvgPath, "--out", tempPngPath], {
    stdio: "ignore",
  });

  try {
    execFileSync(
      "pngquant",
      ["--force", "--output", outputPath, "--quality=75-95", tempPngPath],
      { stdio: "ignore" },
    );
  } catch {
    copyFileSync(tempPngPath, outputPath);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`Generated ${outputPath}`);
