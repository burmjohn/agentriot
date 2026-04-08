import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const routesShim = [
  'export type {',
  '  AppRoutes,',
  '  AppRouteHandlerRoutes,',
  '  LayoutRoutes,',
  '  ParamMap,',
  '} from "./routes";',
  "",
].join("\n");

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureRoutesShim(directory: string) {
  const routesFile = path.join(directory, "routes.d.ts");

  if (!(await fileExists(routesFile))) {
    return;
  }

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "routes.js.d.ts"), routesShim, "utf8");
}

async function run(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `${command} exited with signal ${signal}`
            : `${command} exited with code ${code ?? "unknown"}`,
        ),
      );
    });
  });
}

async function main() {
  await run("pnpm", ["exec", "next", "typegen"]);

  await Promise.all([
    ensureRoutesShim(path.join(rootDir, ".next", "types")),
    ensureRoutesShim(path.join(rootDir, ".next", "dev", "types")),
  ]);

  await run("pnpm", ["exec", "tsc", "--noEmit"]);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
