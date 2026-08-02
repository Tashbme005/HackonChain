export async function validatePublicationWithAI(url: string) {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

    try {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    temperature: 0,
                    messages: [
                        {
                            role: "system",
                            content: `
You are validating whether a publication link appears to be genuine public evidence of a charitable donation.

Rules:
- If it appears to be a normal public URL (Facebook, X, Instagram, LinkedIn, YouTube, TikTok, news website, NGO website, blog, etc.), approve it.
- Reject localhost addresses.
- Reject private IP addresses.
- Reject empty strings.
- Reject random text that is not a URL.
- Respond ONLY with JSON.

Example:

{
  "approved": true,
  "reason": "Looks like a genuine public publication."
}

or

{
  "approved": false,
  "reason": "Publication appears invalid."
}
`,
                        },
                        {
                            role: "user",
                            content: `Check this publication link:\n${url}`,
                        },
                    ],
                }),
            }
        );

        const data = await response.json();

        console.log("Groq Response:", data);

        if (!response.ok) {
            console.error(data);
            throw new Error(data.error?.message || "AI request failed");
        }

        if (!data.choices || data.choices.length === 0) {
            throw new Error("No AI response received.");
        }

        let content = data.choices[0].message.content.trim();

        // Remove markdown code fences if present
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        const result = JSON.parse(content);

        return result;

    } catch (err) {
        console.error("Publication AI validation failed:", err);

        return {
            approved: false,
            reason: "Unable to validate publication.",
        };
    }
}
// }

// export async function validatePublicationWithAI(url: string) {

//     try {
//         const response = await fetch(
//             "https://api.groq.com/openai/v1/chat/completions",
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${GROQ_API_KEY}`,
//                 },
//                 body: JSON.stringify({
//                     model: "llama-3.1-8b-instant",
//                     messages: [
//                         {
//                             role: "system",
//                             content:
//                                 "You are validating whether a publication link looks like genuine public evidence of a charitable donation. If it appears to be a real public page return APPROVED. If it looks fake, invalid, localhost, private, random text or unrelated return REJECTED. Respond ONLY in JSON.",
//                         },
//                         {
//                             role: "user",
//                             content: `Check this publication link:\n${url}`,
//                         },
//                     ],
//                     response_format: {
//                         type: "json_object",
//                     },
//                 }),
//             }
//         );

//         const data = await response.json();

//         if (!response.ok) {
//             console.error(data);
//             throw new Error(data.error?.message || "AI request failed");
//         }

//         if (!data.choices?.length) {
//             throw new Error("No AI response received.");
//         }

//         return JSON.parse(data.choices[0].message.content);

//     } catch (err) {
//         console.error("Publication AI validation failed:", err);

//         return {
//             approved: false,
//             reason: "Unable to validate publication."
//         };
//     }
// }