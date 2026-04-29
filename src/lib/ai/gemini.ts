import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

const MODEL_NAME = "gemini-3-flash-preview";

/**
 * Parses raw email text to detect and extract job application details.
 */
export async function parseJobEmail(emailBody: string) {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Analyze the following email content and extract job application details if present.
    
    Email Content:
    """
    ${emailBody}
    """`,
    config: {
      systemInstruction: "You are an expert at identifying job application confirmation emails and extracting key details. Be precise and conservative; if an email is not clearly about a job application or confirmation, set isJobApplication to false.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isJobApplication: {
            type: Type.BOOLEAN,
            description: "Whether the email is a job application confirmation or status update.",
          },
          company: {
            type: Type.STRING,
            description: "The name of the company applied to.",
          },
          jobTitle: {
            type: Type.STRING,
            description: "The title of the position.",
          },
          appliedDate: {
            type: Type.STRING,
            description: "The date of application (ISO format if possible).",
          },
          platform: {
            type: Type.STRING,
            description: "The platform used for application (e.g., LinkedIn, Greenhouse, Lever, Company Site).",
          },
        },
        required: ["isJobApplication"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return { isJobApplication: false };
  }
}

/**
 * Crafts a short, professional follow-up email based on application details.
 */
export async function generateFollowUp(appDetails: { company: string; jobTitle: string; appliedDate?: string }) {
  const prompt = `Write a professional 3-sentence follow-up email for the following job application:
  Company: ${appDetails.company}
  Job Title: ${appDetails.jobTitle}
  Applied Date: ${appDetails.appliedDate || "recently"}
  
  The tone should be enthusiastic but respectful.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: "You are a career coach helping candidates write concise, effective follow-up emails. Keep the total length to exactly 3 sentences. Do not include subject lines or signatures, just the body.",
    },
  });

  return response.text.trim();
}
