import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const VERSION = "scrypt-v1";
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

export const DUMMY_PASSWORD_HASH = "scrypt-v1:16384:8:1:YWRtaW4tbG9naW4tZHVtbXktc2FsdA:roI8firdAnIxDyJqU7nRFqK7Ok9KIKfuB8a6bFqqs3Ui6ss2IKieg-J7xfQqY6uT0fbG54Yn7QNDcpOOx-hFZg";

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, {
      N: COST,
      r: BLOCK_SIZE,
      p: PARALLELIZATION,
      maxmem: MAX_MEMORY,
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const digest = await derive(password, salt);
  return [
    VERSION,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    digest.toString("base64url"),
  ].join(":");
}

export async function verifyPassword(password: string, encoded: string) {
  const [version, cost, blockSize, parallelization, saltValue, digestValue, ...extra] = encoded.split(":");
  if (
    version !== VERSION
    || cost !== String(COST)
    || blockSize !== String(BLOCK_SIZE)
    || parallelization !== String(PARALLELIZATION)
    || !saltValue
    || !digestValue
    || extra.length
  ) return false;

  const expected = Buffer.from(digestValue, "base64url");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await derive(password, Buffer.from(saltValue, "base64url"));
  return timingSafeEqual(actual, expected);
}
