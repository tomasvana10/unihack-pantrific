export function readFromEnv(k: string) {
  const val = process.env[k];
  if (!val) {
    throw new Error(`${k} is not set`);
  }
  return val;
}

export function toDateString(date?: Date): string {
  return (date ?? new Date()).toISOString().split("T")[0]!;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
