const G = 7n;
const N = BigInt("0x894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7");

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  let b = base % modulus;
  let e = exponent;

  while (e > 0n) {
    if (e % 2n === 1n) result = (result * b) % modulus;
    e >>= 1n;
    b = (b * b) % modulus;
  }

  return result;
}

function bufferToLittleEndianBigInt(bytes: Buffer): bigint {
  const hex = Buffer.from(bytes).reverse().toString("hex");
  return hex ? BigInt(`0x${hex}`) : 0n;
}

function bigIntToLittleEndianBuffer(value: bigint, length: number): Buffer {
  if (value === 0n) return Buffer.alloc(length);

  let hex = value.toString(16);
  if (hex.length % 2 === 1) hex = `0${hex}`;

  const littleEndian = Buffer.from(hex, "hex").reverse();
  if (littleEndian.length === length) return littleEndian;
  if (littleEndian.length > length) return littleEndian.subarray(0, length);

  return Buffer.concat([littleEndian, Buffer.alloc(length - littleEndian.length)]);
}

async function sha1(input: Buffer | string): Promise<Buffer> {
  const { createHash } = await import("node:crypto");
  return createHash("sha1").update(input).digest();
}

export async function computeSrp6Verifier(username: string, password: string, salt: Buffer | string): Promise<Buffer> {
  const saltBytes = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, "binary");
  const h1 = await sha1(`${username.toUpperCase()}:${password.toUpperCase()}`);
  const h2 = await sha1(Buffer.concat([saltBytes, h1]));
  const x = bufferToLittleEndianBigInt(h2);
  const verifier = modPow(G, x, N);

  return bigIntToLittleEndianBuffer(verifier, 32);
}

export function srp6ConstantN(): bigint {
  return N;
}
