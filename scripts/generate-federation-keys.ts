import { generateKeyPairSync } from "node:crypto";

const pair = generateKeyPairSync("ed25519");
console.log(`FEDERATION_PUBLIC_KEY=${pair.publicKey.export({ type: "spki", format: "der" }).toString("base64")}`);
console.log(`FEDERATION_PRIVATE_KEY=${pair.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64")}`);
