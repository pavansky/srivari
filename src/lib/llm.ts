/**
 * Provider-agnostic LLM client speaking the OpenAI-compatible chat API — the
 * lingua franca of open-source model hosts. No paid/proprietary SDKs.
 *
 * Configure with env vars (all free options):
 *   LLM_BASE_URL  e.g. https://api.groq.com/openai/v1   (Groq free tier)
 *                      https://openrouter.ai/api/v1      (OpenRouter ":free" models)
 *                      https://router.huggingface.co/v1  (Hugging Face)
 *                      http://localhost:1234/v1          (LM Studio, local)
 *   LLM_API_KEY   provider key (free-tier signup); optional for local servers
 *   LLM_MODEL     e.g. llama-3.3-70b-versatile / meta-llama/llama-3.3-70b-instruct:free
 *                 (optional for local servers — the first loaded model is used)
 *   LLM_REASONING_EFFORT  optional; set "none" for local reasoning models
 *
 * In development, an unset LLM_BASE_URL falls back to LM Studio's default
 * localhost endpoint so the AI features work on the dev machine for free.
 */

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const DEV_FALLBACK_URL = "http://localhost:1234/v1";

function baseUrl(): string | null {
    const url = process.env.LLM_BASE_URL?.trim();
    if (url) return url.replace(/\/$/, "");
    if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_URL;
    return null;
}

export function isLLMConfigured(): boolean {
    return baseUrl() !== null;
}

/** Human-facing message for routes when no endpoint is configured. */
export const LLM_NOT_CONFIGURED_MSG =
    "AI is not configured. Set LLM_BASE_URL / LLM_API_KEY / LLM_MODEL to a free OpenAI-compatible endpoint (e.g. Groq free tier, OpenRouter :free models, or a local LM Studio).";

// Model auto-detection for local servers (cached per runtime)
let cachedModel: string | null = null;

async function resolveModel(url: string, headers: Record<string, string>): Promise<string> {
    const configured = process.env.LLM_MODEL?.trim();
    if (configured) return configured;
    if (cachedModel) return cachedModel;

    try {
        const res = await fetch(`${url}/models`, { headers, signal: AbortSignal.timeout(4000) });
        if (res.ok) {
            const data = await res.json();
            const ids: string[] = (data?.data || []).map((m: any) => m.id).filter(Boolean);
            const chatModel = ids.find(id => !/embed|whisper|rerank|tts|audio/i.test(id));
            if (chatModel) {
                cachedModel = chatModel;
                return chatModel;
            }
        }
    } catch {
        // fall through to a sensible generic default
    }
    return "llama-3.3-70b-versatile";
}

/**
 * Strip <think>…</think> blocks that local reasoning models may emit. Also
 * handles a truncated, still-open <think> (model hit max_tokens mid-thought):
 * everything from an unclosed <think> to the end is dropped.
 */
function stripReasoning(text: string): string {
    return text
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/<think>[\s\S]*$/g, "")
        .trim();
}

interface CompleteOpts {
    system?: string;
    messages?: ChatMessage[];
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
}

async function completeAgainst(
    endpoint: { url: string; apiKey?: string; model?: string },
    opts: CompleteOpts
): Promise<string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (endpoint.apiKey) headers.Authorization = `Bearer ${endpoint.apiKey}`;

    const model = endpoint.model?.trim() || await resolveModel(endpoint.url, headers);

    const messages: ChatMessage[] = [
        ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
        ...(opts.messages || []),
        ...(opts.prompt ? [{ role: "user" as const, content: opts.prompt }] : []),
    ];

    const body: Record<string, unknown> = {
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
        stream: false,
    };
    if (process.env.LLM_REASONING_EFFORT) body.reasoning_effort = process.env.LLM_REASONING_EFFORT;

    const res = await fetch(`${endpoint.url}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`LLM request failed (${res.status}):`, errText.slice(0, 400));
        throw new Error(`LLM request failed (${res.status})`);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("LLM returned an empty response");
    return stripReasoning(text);
}

/**
 * Completes against the primary endpoint; if it errors (free tiers rate-limit)
 * and LLM_FALLBACK_BASE_URL is configured, retries once on the fallback.
 */
export async function chatComplete(opts: CompleteOpts): Promise<string> {
    const url = baseUrl();
    if (!url) throw new Error(LLM_NOT_CONFIGURED_MSG);

    try {
        return await completeAgainst(
            { url, apiKey: process.env.LLM_API_KEY, model: process.env.LLM_MODEL },
            opts
        );
    } catch (primaryError) {
        const fallbackUrl = process.env.LLM_FALLBACK_BASE_URL?.trim()?.replace(/\/$/, "");
        if (!fallbackUrl) throw primaryError;

        console.warn("Primary LLM failed, trying fallback:", (primaryError as Error)?.message);
        return await completeAgainst(
            { url: fallbackUrl, apiKey: process.env.LLM_FALLBACK_API_KEY, model: process.env.LLM_FALLBACK_MODEL },
            opts
        );
    }
}
