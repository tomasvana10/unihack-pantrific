export function readFromEnv(k: string) {
  const val = process.env[k];
  if (!val) {
    throw new Error(`${k} is not set`);
  }
  return val;
}
