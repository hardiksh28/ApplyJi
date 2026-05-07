import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

const MODEL_NAME = "gemini-3-flash-preview";

// ============ RETRY LOGIC ============

/**
 * Retry wrapper with exponential backoff (3 attempts).
 * Required for all LLM calls per Phase 2 quality requirements.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`AI call attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
      
      // Don't retry on 4xx errors (except 429 rate limit)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// ============ AI USAGE LOGGING ============

export interface AIUsageLog {
  userId: string;
  feature: 'resume_generate' | 'resume_analyze' | 'cover_letter' | 'skills_gap' | 'follow_up' | 'email_parse' | 'ats_score';
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// ... existing code ...

/**
 * FEATURE 4: ATS Resume Score Checker
 * Performs deep analysis for keyword density, formatting, length, and section completeness.
 */
export async function checkATSScore(
  resumeText: string,
  jobDescription: string
) {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the following resume against the job description for ATS (Applicant Tracking System) compatibility.
    
    Resume:
    """
    ${resumeText}
    """
    
    Job Description:
    """
    ${jobDescription}
    """`,
      config: {
        systemInstruction: "You are a specialized ATS optimization expert. Evaluate the resume's effectiveness for a modern ATS. Focus on keyword matching, structural integrity, and professional standards. Always output valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                keywords: { type: Type.NUMBER },
                formatting: { type: Type.NUMBER },
                length: { type: Type.NUMBER },
                sections: { type: Type.NUMBER },
              },
              required: ["keywords", "formatting", "length", "sections"],
            },
            issues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keywordAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  found: { type: Type.BOOLEAN },
                  importance: { type: Type.STRING, description: "critical, high, or moderate" },
                },
                required: ["skill", "found", "importance"],
              },
            },
          },
          required: ["overallScore", "breakdown", "issues", "suggestions", "keywordAnalysis"],
        },
      },
    });

    try {
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Failed to parse ATS score response:", error);
      throw new Error("Failed to check ATS score");
    }
  });
}


/**
 * Logs AI usage to the database for cost tracking.
 */
export async function logAIUsage(supabaseAdmin: any, log: AIUsageLog) {
  try {
    await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: log.userId,
      feature: log.feature,
      model: log.model,
      prompt_tokens: log.promptTokens || 0,
      completion_tokens: log.completionTokens || 0,
      total_tokens: log.totalTokens || 0,
      latency_ms: log.latencyMs || 0,
      success: log.success,
      error_message: log.errorMessage || null,
      metadata: log.metadata || {},
    });
  } catch (err) {
    console.error('Failed to log AI usage:', err);
    // Don't throw — logging shouldn't break the main flow
  }
}

// ============ EXISTING FEATURES ============

/**
 * Parses raw email text to detect and extract job application details.
 */
export async function parseJobEmail(emailBody: string) {
  return withRetry(async () => {
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
  });
}

/**
 * Crafts a short, professional follow-up email based on application details.
 */
export async function generateFollowUp(appDetails: { company: string; jobTitle: string; appliedDate?: string }) {
  return withRetry(async () => {
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

    return response.text;
  });
}

/**
 * Analyzes a resume against a job description.
 */
export async function analyzeResume(resumeText: string, jobDescription: string) {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze my resume against the following job description and provide a score and detailed feedback.
    
    Resume:
    """
    ${resumeText}
    """
    
    Job Description:
    """
    ${jobDescription}
    """`,
      config: {
        systemInstruction: "You are an expert ATS (Applicant Tracking System) analyzer. Evaluate the resume's match for the job. Provide a score from 0-100 and categorize feedback into strengths and improvements.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            matchLevel: { type: Type.STRING, description: "Low, Medium, Strong, or Exceptional" },
            summary: { type: Type.STRING },
            strengths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            improvements: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
          },
          required: ["score", "matchLevel", "summary", "strengths", "improvements"],
        },
      },
    });

    try {
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new Error("Failed to analyze resume");
    }
  });
}

// ============ PHASE 2: NEW AI FEATURES ============

/**
 * FEATURE 1: Generate a tailored resume based on user profile and job description.
 * Returns structured JSON for frontend rendering + PDF export.
 */
export async function generateTailoredResume(
  profile: { fullName: string; skills: any[]; experience: any[]; education: any[] },
  jobDescription: string
) {
  return withRetry(async () => {
    const profileContext = `
Candidate Profile:
- Name: ${profile.fullName}
- Skills: ${JSON.stringify(profile.skills)}
- Experience: ${JSON.stringify(profile.experience)}
- Education: ${JSON.stringify(profile.education)}
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Rewrite this resume to match the job description. Highlight relevant skills. Keep it ATS-friendly.

${profileContext}

Job Description:
"""
${jobDescription}
"""

Generate a tailored resume optimized for this specific role. Emphasize matching skills and relevant experience. Use action verbs and quantifiable achievements where possible.`,
      config: {
        systemInstruction: "You are an expert resume writer specializing in ATS-optimized resumes. Create tailored resumes that highlight the most relevant skills and experience for the target job. Always output valid JSON matching the schema exactly.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Professional summary paragraph tailored to the job (2-4 sentences)",
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  highlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["title", "company", "duration", "highlights"],
              },
            },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["category", "items"],
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING },
                  details: { type: Type.STRING },
                },
                required: ["degree", "institution", "year"],
              },
            },
          },
          required: ["summary", "experience", "skills", "education"],
        },
      },
    });

    try {
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Failed to parse tailored resume response:", error);
      throw new Error("Failed to generate tailored resume");
    }
  });
}

/**
 * FEATURE 2: Generate a cover letter with configurable tone.
 */
export async function generateCoverLetter(
  profile: { fullName: string; skills: any[]; experience: any[] },
  jobDescription: string,
  tone: 'professional' | 'casual' | 'enthusiastic' = 'professional'
) {
  const toneGuides: Record<string, string> = {
    professional: "Use a formal, polished tone. Be direct and confident while remaining respectful. Focus on qualifications and value proposition.",
    casual: "Use a warm, conversational tone. Be personable and approachable while still demonstrating competence. Show personality.",
    enthusiastic: "Use an energetic, passionate tone. Show genuine excitement about the role and company. Be dynamic and engaging while remaining professional.",
  };

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Write a cover letter for the following job based on the candidate's profile.

Candidate:
- Name: ${profile.fullName}
- Key Skills: ${JSON.stringify(profile.skills)}
- Experience Summary: ${JSON.stringify(profile.experience)}

Job Description:
"""
${jobDescription}
"""

Tone: ${tone}
Instructions: ${toneGuides[tone]}

Write a compelling cover letter (3-4 paragraphs) that:
1. Opens with a hook about why the candidate is excited about this specific role
2. Highlights 2-3 most relevant skills/experiences that match the job requirements
3. Shows knowledge of the company/role
4. Closes with a clear call to action

Do NOT include placeholder brackets like [Company Name]. Use the actual details from the job description.
Do NOT include the candidate's address or date header. Start directly with "Dear Hiring Manager," or similar.`,
      config: {
        systemInstruction: "You are an expert career coach who writes compelling, personalized cover letters. Never use generic templates or placeholder text. Every letter should feel unique and authentic.",
      },
    });

    return response.text;
  });
}

/**
 * FEATURE 3: Skills Gap Analyzer — extracts required skills from JD, compares with user profile.
 */
export async function analyzeSkillsGap(
  userSkills: string[],
  jobDescription: string
) {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the following job description to extract required skills, then compare against the candidate's existing skills.

Candidate's Current Skills:
${JSON.stringify(userSkills)}

Job Description:
"""
${jobDescription}
"""

Compare the candidate's skills against the job requirements. Identify matched skills, missing skills, and provide a match score from 0-100. For each missing skill, suggest a specific learning resource or action.`,
      config: {
        systemInstruction: "You are a career skills advisor. Extract all required and preferred skills from the job description. Be thorough in identifying both technical and soft skills. Score objectively based on skill coverage.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matched: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  relevance: { type: Type.STRING, description: "required or preferred" },
                },
                required: ["skill", "relevance"],
              },
            },
            missing: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  relevance: { type: Type.STRING, description: "required or preferred" },
                  learnSuggestion: { type: Type.STRING, description: "Specific course, tutorial, or action to learn this skill" },
                },
                required: ["skill", "relevance", "learnSuggestion"],
              },
            },
            score: {
              type: Type.NUMBER,
              description: "Overall match score from 0-100 based on skill coverage",
            },
            summary: {
              type: Type.STRING,
              description: "Brief 1-2 sentence summary of the candidate's fit",
            },
          },
          required: ["matched", "missing", "score", "summary"],
        },
      },
    });

    try {
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Failed to parse skills gap response:", error);
      throw new Error("Failed to analyze skills gap");
    }
  });
}
