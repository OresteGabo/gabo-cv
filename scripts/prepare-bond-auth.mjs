import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// One random key per build, shared by every server function in that deployment.
// Never derive this key from the password hash or commit it to the repository.
const directory = join(process.cwd(), ".data");
await mkdir(directory, { recursive: true });
await writeFile(join(directory, "bonds-deployment-key.json"), JSON.stringify({ key: randomBytes(32).toString("hex") }), { mode: 0o600 });
console.log("Prepared private bond-session key.");
