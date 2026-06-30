const isBrowser = typeof window !== "undefined";

const LOG_API = isBrowser
  ? "/eval-api/evaluation-service/logs"
  : "http://4.224.186.213/evaluation-service/logs";

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error"];

const VALID_PACKAGES = {
  backend: ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service", "auth", "config", "middleware", "utils"],
  frontend: ["api", "component", "hook", "page", "state", "style", "auth", "config", "middleware", "utils"],
};

let activeToken = "";

export function setToken(token) {
  activeToken = token;
}

export async function Log(stack, level, packageName, message) {
  if (!VALID_STACKS.includes(stack)) {
    console.error(`[Log] Invalid stack: "${stack}". Must be one of: ${VALID_STACKS.join(", ")}`);
    return;
  }
  if (!VALID_LEVELS.includes(level)) {
    console.error(`[Log] Invalid level: "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
    return;
  }
  if (!VALID_PACKAGES[stack].includes(packageName)) {
    console.error(`[Log] Invalid package: "${packageName}" for stack "${stack}". Must be one of: ${VALID_PACKAGES[stack].join(", ")}`);
    return;
  }

  try {
    const response = await fetch(LOG_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({ stack, level, package: packageName, message }),
    });
    const data = await response.json();
    console.log(`[Log] Sent: [${stack}/${level}/${packageName}] ${message}`);
    return data;
  } catch (error) {
    console.error(`[Log] Failed to send log:`, error.message);
  }
}