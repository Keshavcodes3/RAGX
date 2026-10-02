import type { GenerateContentConfig } from "@google/genai";
import { z } from "zod";

import { aiGuard } from "@/config/aiConfig";
import { OUTPUT_GUARDRAIL_PROMPT } from "./output.guardrail.prompt";
import { scanSecrets } from "./secret.scanner";

const resultSchema = z.object({
  decision: z.enum(["allow", "block", "review"]),
  attackTypes: z.array(z.enum([
    "credential-exposure",
    "prompt-injection",
    "jailbreak",
    "data-exfiltration",
    "internal-information-exposure",
    "malicious-payload",
    "sensitive-data-exposure",
  ])),
  credentialTypes: z.array(z.enum([
    "api-key",
    "private-key",
    "jwt",
    "bearer-token",
    "connection-string",
    "credential-assignment",
    "known-secret",
    "other-credential",
  ])),
  reason: z.string().trim().min(1),
});

interface GuardrailOptions {
  userQuery?: string;
  retrievedContext?: string;
  knownSecrets?: readonly string[];
  model?: string;
}

const config: GenerateContentConfig = {
  systemInstruction: OUTPUT_GUARDRAIL_PROMPT,
  responseMimeType: "application/json",
  responseJsonSchema: z.toJSONSchema(resultSchema),
  temperature: 0,
  httpOptions: { timeout: 30_000 },
};

/** Only decision === "allow" should permit releasing the candidate output. */
export async function outputGuardrail(
  output: string,
  options: GuardrailOptions = {},
): Promise<z.infer<typeof resultSchema>> {
  const secretScan = scanSecrets(output, options);

  // Do not send already detected credentials to the external guard model.
  if (secretScan.hasSecrets) {
    return {
      decision: "block",
      attackTypes: ["credential-exposure"],
      credentialTypes: secretScan.types,
      reason: "The secret scanner detected possible credentials in the output.",
    };
  }

  try {
    const response = await aiGuard.models.generateContent({
      model: options.model ?? "gemini-2.5-flash",
      contents: JSON.stringify({
        candidateOutput: output,
        userQuery: options.userQuery,
        retrievedContext: options.retrievedContext,
        secretScan,
      }),
      config,
    });

    const result = resultSchema.parse(JSON.parse(response.text ?? ""));
    if (result.decision === "allow" &&
        (result.attackTypes.length > 0 || result.credentialTypes.length > 0)) {
      throw new Error("Guard model returned an inconsistent allow decision.");
    }

    // Keep classifications consistent and remove duplicate categories.
    if (result.credentialTypes.length > 0) {
      result.attackTypes.push("credential-exposure");
    }
    result.attackTypes = [...new Set(result.attackTypes)];
    result.credentialTypes = [...new Set(result.credentialTypes)];
    if (scanSecrets(result.reason, options).hasSecrets) {
      result.reason = "The guard model detected a possible security risk.";
    }
    return result;
  } catch {
    // Do not log provider errors: they may contain candidate text or credentials.
    return {
      decision: "review",
      attackTypes: [],
      credentialTypes: [],
      reason: "The AI security check could not be completed or returned an invalid result.",
    };
  }
}
