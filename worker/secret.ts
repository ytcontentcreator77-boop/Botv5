import type { Env } from "./env";
import { getSettings, setSettings } from "./settings";

const enc = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const dec = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptBotToken(token: string, secret: string): Promise<{ ciphertext: string; iv: string }> {
  if (secret.length < 32) throw new Error("APP_ENCRYPTION_KEY must contain at least 32 characters");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret), new TextEncoder().encode(token));
  return { ciphertext: enc(new Uint8Array(encrypted)), iv: enc(iv) };
}
export async function decryptBotToken(ciphertext: string, iv: string, secret: string): Promise<string> {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: dec(iv) }, await aesKey(secret), dec(ciphertext));
  return new TextDecoder().decode(plain);
}
/** Loads the encrypted first-run token into the request-local bindings object for legacy modules. */
export async function hydrateBotToken(env: Env): Promise<void> {
  const s = await getSettings(env);
  if (s.bot_token_ciphertext && s.bot_token_iv) {
    if (!env.APP_ENCRYPTION_KEY) throw new Error("APP_ENCRYPTION_KEY is required to decrypt the configured Telegram bot token");
    env.BOT_TOKEN = await decryptBotToken(s.bot_token_ciphertext, s.bot_token_iv, env.APP_ENCRYPTION_KEY);
    return;
  }
  // Backwards-compatible for deployments that still provide BOT_TOKEN as a Worker secret.
}
export async function saveEncryptedBotToken(env: Env, token: string): Promise<void> {
  if (!env.APP_ENCRYPTION_KEY) throw new Error("Set APP_ENCRYPTION_KEY as a Cloudflare Worker secret before first-time setup");
  const v = await encryptBotToken(token, env.APP_ENCRYPTION_KEY);
  await setSettings(env, { bot_token_ciphertext: v.ciphertext, bot_token_iv: v.iv });
  env.BOT_TOKEN = token;
}
