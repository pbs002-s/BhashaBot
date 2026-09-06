import { AppSettings, ProviderMeta, providerMeta } from "./settings-schema";

/**
 * Asks a provider which models the key in hand can actually reach, so nobody
 * has to guess a model id or find out it was wrong in front of a customer.
 * Works against the same key the settings panel is about to save, before it
 * is saved.
 */

export interface ModelScan {
  ok: boolean;
  /** Chat-capable ids, best first. */
  models: string[];
  /** Everything the provider returned, including the ones filtered out. */
  total: number;
  error?: string;
}

/** Ids that exist but cannot answer a chat message. */
const NOT_CHAT =
  /(embed|embedding|whisper|tts|text-to-speech|speech|audio|moderation|rerank|dall-e|image|stable-diffusion|guard|safety|distil-whisper|clip|bge|e5)/i;

/** Derives the model-list URL from the configured chat endpoint. */
export function modelsUrl(meta: ProviderMeta, baseUrl: string): string {
  if (meta.dialect === "anthropic") return "https://api.anthropic.com/v1/models";

  const endpoint = baseUrl || meta.endpoint;
  if (!endpoint) return "";
  if (/\/chat\/completions\/?$/.test(endpoint)) {
    return endpoint.replace(/\/chat\/completions\/?$/, "/models");
  }
  if (/\/models\/?$/.test(endpoint)) return endpoint;
  return `${endpoint.replace(/\/$/, "")}/models`;
}

export async function scanModels(
  settings: AppSettings,
  /** A key the operator has typed but not saved yet. */
  candidateKey?: string
): Promise<ModelScan> {
  const meta = providerMeta(settings.provider.id);

  if (meta.dialect === "none") {
    return { ok: true, models: meta.models, total: meta.models.length };
  }

  const apiKey = (candidateKey || settings.provider.apiKey || "").trim();
  if (!apiKey) {
    return { ok: false, models: [], total: 0, error: "No API key to scan with" };
  }

  const url = modelsUrl(meta, settings.provider.baseUrl);
  if (!url) {
    return { ok: false, models: [], total: 0, error: "This provider has no endpoint configured" };
  }

  const headers: Record<string, string> =
    meta.dialect === "anthropic"
      ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      return {
        ok: false,
        models: [],
        total: 0,
        error: res.status === 401 || res.status === 403 ? "Key rejected" : `${res.status} ${body}`,
      };
    }

    const data = await res.json();
    const ids = extractIds(data);
    const chat = ids.filter((id) => !NOT_CHAT.test(id));

    return {
      ok: true,
      // Fall back to the raw list rather than an empty picker if the filter
      // was too eager for an unfamiliar provider.
      models: sortModels(chat.length ? chat : ids, meta),
      total: ids.length,
    };
  } catch (err: any) {
    return { ok: false, models: [], total: 0, error: String(err?.message || err).slice(0, 200) };
  }
}

/** Providers disagree on the envelope; the ids are always in one of these. */
function extractIds(data: any): string[] {
  const list: any[] = Array.isArray(data)
    ? data
    : data?.data || data?.models || data?.body || [];

  return Array.from(
    new Set(
      list
        .map((item) => (typeof item === "string" ? item : item?.id || item?.name || ""))
        .map((id) => String(id).trim().replace(/^models\//, ""))
        .filter(Boolean)
    )
  );
}

/** The catalogue's own suggestions first, then everything else alphabetically. */
function sortModels(ids: string[], meta: ProviderMeta): string[] {
  const known = meta.models.filter((m) => ids.includes(m));
  const rest = ids.filter((id) => !known.includes(id)).sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}
