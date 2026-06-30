import { setToken } from "../../../logging-middleware/logs.js";

const AUTH_API = "/eval-api/evaluation-service/auth";

const CREDENTIALS = {
  clientID: "67980ef1-0fc0-4fa2-bcaa-7c92f96f1d40",
  clientSecret: "HAGfavCDMjhGCCvq",
  email: "2303031050524@paruluniversity.ac.in",
  name: "Kishan Roy",
  rollNo: "2303031050524",
  accessCode: "cJqaEB",
};

const TOKEN_KEY = "eval_access_token";

function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000 - 30000;
  } catch {
    return true;
  }
}

export async function getToken() {
  const cached = sessionStorage.getItem(TOKEN_KEY);
  if (cached && !isExpired(cached)) {
    setToken(cached);
    return cached;
  }

  const response = await fetch(AUTH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS),
  });

  if (!response.ok) {
    throw new Error("Authentication failed");
  }

  const data = await response.json();
  const token = data.access_token;
  sessionStorage.setItem(TOKEN_KEY, token);
  setToken(token);
  return token;
}
