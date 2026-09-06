import { NextRequest, NextResponse } from "next/server";
import { scanModels } from "@/lib/models";
import { getSettings } from "@/lib/settings";
import { mergeSettings, type AiProviderId, PROVIDERS } from "@/lib/settings-schema";

export const dynamic = "force-dynamic";

/**
 * Lists the models a key can actually reach.
 * body: { providerId?, apiKey?, baseUrl? }
 * The key is used for this one request and never written anywhere.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const stored = await getSettings();

  const providerId = PROVIDERS.some((p) => p.id === body.providerId)
    ? (body.providerId as AiProviderId)
    : stored.provider.id;

  const settings = mergeSettings(stored, {
    provider: {
      ...stored.provider,
      id: providerId,
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : stored.provider.baseUrl,
    },
  });

  const candidateKey = typeof body.apiKey === "string" ? body.apiKey : "";
  const result = await scanModels(settings, candidateKey);

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
