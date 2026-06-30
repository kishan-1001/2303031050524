import axios from "axios";

const LOG_API = "http://4.224.186.213/evaluation-service/logs";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzAzMDMxMDUwNTI0QHBhcnVsdW5pdmVyc2l0eS5hYy5pbiIsImV4cCI6MTc4MjgwOTM3MywiaWF0IjoxNzgyODA4NDczLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiOGUxYWZiNmItZGM5Ny00MTIxLWJhM2EtMjFkOTlkZTJkYzk0IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoia2lzaGFuIHJveSIsInN1YiI6IjY3OTgwZWYxLTBmYzAtNGZhMi1iY2FhLTdjOTJmOTZmMWQ0MCJ9LCJlbWFpbCI6IjIzMDMwMzEwNTA1MjRAcGFydWx1bml2ZXJzaXR5LmFjLmluIiwibmFtZSI6Imtpc2hhbiByb3kiLCJyb2xsTm8iOiIyMzAzMDMxMDUwNTI0IiwiYWNjZXNzQ29kZSI6ImNKcWFFQiIsImNsaWVudElEIjoiNjc5ODBlZjEtMGZjMC00ZmEyLWJjYWEtN2M5MmY5NmYxZDQwIiwiY2xpZW50U2VjcmV0IjoiSEFHZmF2Q0RNamhHQ0N2cSJ9.Rw6ysVVmgtIfY-jUFGS-jSdgAI7ttJlZTHZV_8tAxrc";

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error"];

const VALID_PACKAGES = {
  backend: ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service", "auth", "config", "middleware", "utils"],
  frontend: ["api", "component", "hook", "page", "state", "style", "auth", "config", "middleware", "utils"],
};

export async function Log(stack, level, packageName, message) {
  // Validate inputs
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
    const response = await axios.post(
      LOG_API,
      { stack, level, package: packageName, message },
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );
    console.log(`[Log] Sent: [${stack}/${level}/${packageName}] ${message}`);
    return response.data;
  } catch (error) {
    console.error(`[Log] Failed to send log:`, error?.response?.data || error.message);
  }
}