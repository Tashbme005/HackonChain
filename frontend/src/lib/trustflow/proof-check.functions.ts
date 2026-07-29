import { z } from "zod";

const Input = z.object({
  image: z.string().min(1),
  description: z.string().default(""),
  testimonial: z.string().default(""),
  amount: z.number().optional(),
  currency: z.string().optional(),
  seenBefore: z.boolean().default(false),
});

export type ProofCheckInput = z.infer<typeof Input>;

export type ProofCheckResult = {
  verdict: "verified" | "flagged";
  publicReason: string;
  internalNote: string;
  unavailable?: boolean;
};

/**
 * Client-side stub for proof-of-use authenticity checking.
 * In the hackathon MVP this catches duplicate-image submissions
 * deterministically; a real implementation would call an AI model.
 */
export async function checkProofAuthenticity(
  raw: ProofCheckInput,
): Promise<ProofCheckResult> {
  const data = Input.parse(raw);

  if (data.seenBefore) {
    return {
      verdict: "flagged",
      publicReason: "This image appears to match a previous submission.",
      internalNote:
        "Image fingerprint matches an earlier upload from this recipient. Ask for a fresh photo before releasing further funds.",
    };
  }

  // TODO: wire up a real AI counterfeit check (e.g. Gemini API)
  return {
    verdict: "verified",
    publicReason: "",
    internalNote: "Automated check unavailable — submission passed through unchecked.",
    unavailable: true,
  };
}
