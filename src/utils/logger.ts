import pino from "pino";

export type Logger = pino.Logger;

export function createLogger(level: string = "info"): Logger {
  const isDev = process.env["NODE_ENV"] !== "production";
  return pino({
    level,
    ...(isDev && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss" },
      },
    }),
  });
}
