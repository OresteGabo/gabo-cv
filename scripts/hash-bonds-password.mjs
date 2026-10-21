import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 15 || password.length > 128) {
  console.error("Usage: node scripts/hash-bonds-password.mjs '<password of 15 to 128 characters>'");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }).toString("hex");
console.log(`scrypt:${salt}:${hash}`);
