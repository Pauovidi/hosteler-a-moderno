import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/admin-password-hash.mjs <password>");
  process.exit(1);
}

const salt = randomBytes(16);
const derivedKey = scryptSync(password, salt, 64);
const hash = `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;

console.log(hash);
