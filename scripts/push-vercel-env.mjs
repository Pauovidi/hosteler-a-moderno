import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();

function printUsage() {
  console.log(`
Uso:
  node scripts/push-vercel-env.mjs --preview-file .env.preview.local --production-file .env.production.local

Opciones:
  --common-file <ruta>       Variables comunes para preview y production
  --preview-file <ruta>      Variables para preview
  --production-file <ruta>   Variables para production
  --token <token>            Token opcional de Vercel CLI
  --scope <scope>            Scope opcional de Vercel CLI
  --dry-run                  Muestra acciones sin llamar a Vercel

Requisitos:
  - Proyecto enlazado con \`vercel link\`, o bien \`VERCEL_ORG_ID\` y \`VERCEL_PROJECT_ID\` en entorno.
  - Los archivos usados por este script deben ser locales y no versionados.
  `);
}

function parseArgs(argv) {
  const result = {
    commonFile: null,
    previewFile: null,
    productionFile: null,
    token: null,
    scope: null,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--common-file":
        result.commonFile = next || null;
        index += 1;
        break;
      case "--preview-file":
        result.previewFile = next || null;
        index += 1;
        break;
      case "--production-file":
        result.productionFile = next || null;
        index += 1;
        break;
      case "--token":
        result.token = next || null;
        index += 1;
        break;
      case "--scope":
        result.scope = next || null;
        index += 1;
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--help":
      case "-h":
        result.help = true;
        break;
      default:
        throw new Error(`Argumento no reconocido: ${arg}`);
    }
  }

  return result;
}

function resolveFile(input) {
  return input ? path.resolve(cwd, input) : null;
}

function parseEnvFile(filePath) {
  if (!filePath) {
    return {};
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo de entorno: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    entries[key] = value.replace(/^['"]|['"]$/g, "");
  }

  return entries;
}

function runVercel(commandArgs, stdinValue, options) {
  const args = [...commandArgs];
  if (options.token) {
    args.push("--token", options.token);
  }
  if (options.scope) {
    args.push("--scope", options.scope);
  }

  if (options.dryRun) {
    console.log(`[dry-run] vercel ${args.join(" ")} <= ${stdinValue.length} bytes`);
    return { status: 0 };
  }

  return spawnSync("vercel", args, {
    cwd,
    encoding: "utf8",
    input: stdinValue,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function upsertEnvVar(key, value, target, options) {
  const updateResult = runVercel(["env", "update", key, target], `${value}\n`, options);
  if (updateResult.status === 0) {
    console.log(`updated ${key} -> ${target}`);
    return;
  }

  const addResult = runVercel(["env", "add", key, target], `${value}\n`, options);
  if (addResult.status !== 0) {
    throw new Error(
      `No se ha podido enviar ${key} a ${target}\n${updateResult.stderr || ""}\n${addResult.stderr || ""}`.trim(),
    );
  }

  console.log(`added ${key} -> ${target}`);
}

function pushTarget(target, filePath, commonEntries, options) {
  if (!filePath) {
    return;
  }

  const targetEntries = parseEnvFile(filePath);
  const entries = { ...commonEntries, ...targetEntries };
  const keys = Object.keys(entries).sort();

  if (keys.length === 0) {
    console.log(`No hay variables para ${target} en ${filePath}`);
    return;
  }

  console.log(`\n== ${target.toUpperCase()} ==`);
  console.log(`Archivo: ${filePath}`);

  for (const key of keys) {
    upsertEnvVar(key, entries[key], target, options);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.previewFile && !options.productionFile) {
    printUsage();
    throw new Error("Debes indicar al menos --preview-file o --production-file.");
  }

  const commonEntries = parseEnvFile(resolveFile(options.commonFile));

  pushTarget("preview", resolveFile(options.previewFile), commonEntries, options);
  pushTarget("production", resolveFile(options.productionFile), commonEntries, options);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
