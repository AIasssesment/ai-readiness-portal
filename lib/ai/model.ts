import { createGoogleGenerativeAI } from "@ai-sdk/google"

const DEFAULT_MODEL = "gemini-2.5-flash"
const DEFAULT_FAST_MODEL = "gemini-2.5-flash"

function getApiKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || ""
}

export function isGoogleAiConfigured() {
  return Boolean(getApiKey())
}

function getGoogleProvider() {
  return createGoogleGenerativeAI({
    apiKey: getApiKey() || undefined,
  })
}

/** Default model for structured generation and chat replies. */
export function getLlmModel(modelId = process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || DEFAULT_MODEL) {
  return getGoogleProvider()(modelId)
}

/** Faster/cheaper model for intent classification and light passes. */
export function getFastLlmModel(
  modelId = process.env.GOOGLE_GENERATIVE_AI_FAST_MODEL?.trim() || DEFAULT_FAST_MODEL,
) {
  return getGoogleProvider()(modelId)
}

/** Gemini Google Search grounding tool (Stage 1 company research). */
export function getGoogleSearchTool() {
  return getGoogleProvider().tools.googleSearch({})
}
