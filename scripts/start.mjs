// One-command local run: installs dependencies, prepares .env files and starts both apps in the
// browser against the hosted Supabase backend. Usage: `npm start` from the repository root.
import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PNPM = ["--yes", "pnpm@10.18.1"];
const APPS = [
  { name: "customer", port: 8081 },
  { name: "restaurant", port: 8082 },
];

const [major] = process.versions.node.split(".").map(Number);
if (major < 20) {
  console.error(`Node 20 or newer is required (found ${process.versions.node}).`);
  process.exit(1);
}

function run(args, options = {}) {
  return spawn("npx", [...PNPM, ...args], { cwd: ROOT, shell: true, ...options });
}

function runToEnd(args) {
  return new Promise((resolve, reject) => {
    run(args, { stdio: "inherit" }).on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`pnpm ${args.join(" ")} exited with ${code}`)),
    );
  });
}

for (const { name } of APPS) {
  const env = join(ROOT, "apps", name, ".env");
  if (!existsSync(env)) {
    copyFileSync(`${env}.example`, env);
    console.log(`Created apps/${name}/.env from .env.example`);
  }
}

console.log("\nInstalling dependencies (the first run takes a few minutes)...\n");
await runToEnd(["install"]);
await runToEnd(["--filter", "@foodiedeals/shared", "build"]);

console.log("\nStarting both apps...\n");
for (const { name, port } of APPS) {
  // stdin is closed so the two Expo CLIs don't fight over the terminal.
  const child = run(["--filter", `@foodiedeals/${name}`, "exec", "expo", "start", "--web", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const prefix = `[${name}]`.padEnd(13);
  const print = (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.trim()) console.log(prefix + line);
    }
    if (/Waiting on http/.test(chunk)) {
      console.log(`\n  ${name} app ready: http://localhost:${port}\n`);
    }
  };
  child.stdout.on("data", print);
  child.stderr.on("data", print);
  child.on("exit", (code) => {
    console.log(`${prefix}stopped (exit code ${code})`);
    process.exitCode = code ?? 0;
  });
}
