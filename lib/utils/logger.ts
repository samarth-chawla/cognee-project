type Details = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, details?: Details) {
  const payload = details ? { message, ...details } : message;
  console[level](payload);
}

export const logger = {
  info: (message: string, details?: Details) => write("info", message, details),
  warn: (message: string, details?: Details) => write("warn", message, details),
  error: (message: string, details?: Details) => write("error", message, details),
};
