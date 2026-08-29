import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["run", "build"], {
  env: { ...process.env, VITE_E2E: "true" },
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
