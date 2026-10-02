import { GoogleGenAI } from "@google/genai";
import { envConfig } from "./envConfig";

export const aiGuard = new GoogleGenAI({ apiKey: envConfig.GEMINI_GUARD_API_KEY });