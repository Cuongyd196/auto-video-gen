const ts = () => new Date().toISOString().replace("T", " ").substring(0, 19);

export const log = {
  step: (n: number, total: number, msg: string) =>
    console.log(`[${ts()}] [${n}/${total}] ${msg}`),
  info: (msg: string) => console.log(`[${ts()}] ${msg}`),
  warn: (msg: string) => console.warn(`[${ts()}] WARN ${msg}`),
  error: (msg: string, err?: unknown) => {
    console.error(`[${ts()}] ERROR ${msg}`);
    if (err instanceof Error) console.error(err.stack);
    else if (err) console.error(err);
  },
};
