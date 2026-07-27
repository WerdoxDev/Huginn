import Bun from "bun";
import { generateKeyPairSync } from "node:crypto";
import * as fs from "node:fs/promises";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
   modulusLength: 2048,
   publicKeyEncoding: { type: "spki", format: "pem" },
   privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

await fs.mkdir("update-keys", { recursive: true });
await Bun.file("./update-keys/private.pem").write(privateKey);
await Bun.file("./update-keys/public.pem").write(publicKey);

console.log("Generated key pair");
