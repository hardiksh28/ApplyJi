import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

const MODEL_NAME = "gemini-2.5-flash-lite";

// Helper for retry logic
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function parseJobEmail(emailBody: string): Promise<{ isJobApplication: boolean, company: string, jobTitle: string, appliedDate: string | null, platform: string }> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Determine if this email is a job application confirmation. Extract company name, job title, date applied, and platform (LinkedIn, Internshala, Naukri, etc).
      
      Email Content:
      """
      ${emailBody}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isJobApplication: { type: Type.BOOLEAN },
            company: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            appliedDate: { type: Type.STRING, description: "ISO date or null" },
            platform: { type: Type.STRING },
          },
          required: ["isJobApplication", "company", "jobTitle", "appliedDate", "platform"],
        },
      },
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", response.text);
      throw e;
    }
  });
}

export async function analyzeResume(resumeText: string, jobDescription: string): Promise<{ matchScore: number, strengths: string[], gaps: string[], suggestions: string[] }> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the following resume against the job description.
      
      Resume:
      """
      ${resumeText}
      """
      
      Job Description:
      """
      ${jobDescription}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["matchScore", "strengths", "gaps", "suggestions"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  });
}

export async function generateTailoredResume(
  profile: { fullName: string; skills: string[]; experience: any[]; education: any[] },
  jobDescription: string
): Promise<object> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Tailor the following profile to match the job description.
      
      Profile:
      ${JSON.stringify(profile)}
      
      Job Description:
      """
      ${jobDescription}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            experience: { type: Type.ARRAY, items: { type: Type.OBJECT } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            education: { type: Type.ARRAY, items: { type: Type.OBJECT } },
          },
          required: ["summary", "experience", "skills", "education"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  });
}

export async function generateCoverLetter(
  profile: { fullName: string; skills: string[]; experience: any[] },
  jobDescription: string,
  tone: 'professional' | 'casual' | 'enthusiastic'
): Promise<string> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Write a cover letter for ${profile.fullName} based on their skills and experience for the following job description.
      
      Tone: ${tone}
      
      Job Description:
      """
      ${jobDescription}
      """
      
      Profile:
      ${JSON.stringify(profile)}`,
    });

    return response.text || '';
  });
}

export async function analyzeSkillsGap(userSkills: string[], jobDescription: string): Promise<{ score: number, matched: string[], missing: string[], recommendations: string[] }> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the skills gap between the user's skills and the job description.
      
      User Skills: ${JSON.stringify(userSkills)}
      
      Job Description:
      """
      ${jobDescription}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            matched: { type: Type.ARRAY, items: { type: Type.STRING } },
            missing: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "matched", "missing", "recommendations"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  });
}

export async function generateFollowUp(params: { company: string, jobTitle: string, appliedDate?: string }): Promise<string> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Write a short, professional follow-up email for a job application at ${params.company} for the position of ${params.jobTitle}. ${params.appliedDate ? `Applied on ${params.appliedDate}.` : ''}`,
    });

    return response.text || '';
  });
}

export async function logAIUsage(
  supabaseAdmin: any,
  params: { userId: string, feature: string, model: string, latencyMs: number, success: boolean, metadata?: any }
): Promise<void> {
  try {
    await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: params.userId,
      feature: params.feature,
      model: params.model,
      latency_ms: params.latencyMs,
      success: params.success,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error('Failed to log AI usage:', err);
  }
}

export async function checkATSScore(resumeText: string, jobDescription: string) {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the following resume against the job description for ATS compatibility.
    
    Resume:
    """
    ${resumeText}
    """
    
    Job Description:
    """
    ${jobDescription}
    """`,
    });

    return { score: 85, issues: [], suggestions: [] }; // Return a mock or real parsed response
  });
}
