import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * PHASE 4: Email Intelligence Service
 * Automates tracking by reading job-related emails.
 */
export class EmailIntelligenceService {
  private genAI: GoogleGenerativeAI;

  constructor(private supabase: SupabaseClient, apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Classify email content using Gemini
   */
  async classifyEmail(subject: string, bodySnippet: string) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Analyze this email and determine if it's related to a job application.
      
      Email Subject: "${subject}"
      Email Snippet: "${bodySnippet}"
      
      If it is related, classify it as one of:
      - interview_invite (scheduling an interview, call, or assessment)
      - rejection (no longer moving forward)
      - follow_up_needed (recruiter asking for more info/docs)
      - offer (job offer received)
      - other (general inquiry or confirmation)
      
      Return JSON only: { "isJobRelated": boolean, "classification": string, "company": string }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Basic JSON cleaning if needed
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error('Email classification failed:', err);
      return { isJobRelated: false };
    }
  }

  /**
   * Process a list of recent emails for a user
   */
  async processUserEmails(userId: string, emails: any[]) {
    const results = [];
    
    for (const email of emails) {
      const classification = await this.classifyEmail(email.subject, email.snippet);
      
      if (classification.isJobRelated) {
        // 1. Find matching application in DB
        const { data: application } = await this.supabase
          .from('applications')
          .select('id, status, company_name')
          .eq('user_id', userId)
          .ilike('company_name', `%${classification.company}%`)
          .single();

        if (application) {
          let newStatus = application.status;
          let notificationTitle = '';
          let notificationMsg = '';

          switch (classification.classification) {
            case 'interview_invite':
              newStatus = 'interviewing';
              notificationTitle = 'Interview Invite!';
              notificationMsg = `Great news! We detected an interview invite from ${application.company_name}. Card updated to "Interviewing".`;
              break;
            case 'rejection':
              newStatus = 'rejected';
              notificationTitle = 'Update from ' + application.company_name;
              notificationMsg = `We processed a response from ${application.company_name}. Status updated to "Rejected". Keep going!`;
              break;
            case 'offer':
              newStatus = 'offered';
              notificationTitle = 'Congratulations! 🎉';
              notificationMsg = `You received an offer from ${application.company_name}! Card updated to "Offer".`;
              break;
          }

          // 2. Update status if changed
          if (newStatus !== application.status) {
            await this.supabase
              .from('applications')
              .update({ status: newStatus })
              .eq('id', application.id);
              
            // 3. Create notification
            await this.supabase.from('notifications').insert({
              user_id: userId,
              title: notificationTitle,
              message: notificationMsg,
              type: classification.classification,
              metadata: { applicationId: application.id }
            });
          }
          
          results.push({ emailId: email.id, status: 'processed', match: application.id });
        }
      }
    }
    
    return results;
  }

  /**
   * AI Interview Prep Generation
   */
  async generateInterviewPrep(jobTitle: string, company: string, resumeText: string) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Generate a customized interview prep guide for a ${jobTitle} role at ${company}.
      Use the candidate's resume context:
      "${resumeText}"
      
      Provide:
      1. Top 10 likely interview questions for this specific company/role.
      2. Sample high-quality answers based on the candidate's experience.
      3. 3 "Questions to ask the interviewer" specific to ${company}.
      
      Format as JSON: { "questions": [{ "q": string, "a": string }], "proactiveQuestions": [string] }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text().substring(response.text().indexOf('{'), response.text().lastIndexOf('}') + 1));
  }
}
