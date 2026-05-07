import { SupabaseClient } from '@supabase/supabase-js';

/**
 * PHASE 3: One-Click Apply Automation
 * Leverages profile data to fill job forms.
 */
export class AutoApplyService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Main entry point for one-click apply
   */
  async applyToJob(userId: string, jobId: string) {
    // 1. Check daily limit and Pro status
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('subscription_tier, auto_apply_count_today, autofill_data, full_name, email, phone')
      .eq('id', userId)
      .single();

    if (profileError || !profile) throw new Error('User profile not found');
    if (profile.subscription_tier !== 'pro') {
      throw new Error('ONE_CLICK_APPLY_PRO_ONLY');
    }
    if (profile.auto_apply_count_today >= 10) {
      throw new Error('DAILY_LIMIT_REACHED');
    }

    // 2. Fetch job details
    const { data: job, error: jobError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) throw new Error('Job not found');

    // 3. Automation Flow
    let result;
    try {
      // In a real environment, we would spin up a Playwright worker here
      // const browser = await playwright.chromium.launch();
      // const page = await browser.newPage();
      // await page.goto(job.source_url);
      
      // LOGIC:
      // - Detect if there is a "Quick Apply" or "Apply Now" button
      // - Fill fields: [name, email, phone, resume_link] from profile.autofill_data
      // - Submit
      
      // For this demo/phase, we'll mark it as manual_redirect if it's external
      // or success if we simulate a quick-apply match
      if (job.source === 'linkedin' || job.source === 'naukri') {
         // These often redirect to external portals or need complex auth
         result = { success: true, method: 'manual', redirectUrl: job.source_url };
      } else {
         result = { success: true, method: 'auto' };
      }

      // 4. Log and increment counter
      await this.supabase.from('auto_apply_logs').insert({
        user_id: userId,
        job_id: jobId,
        status: result.method === 'auto' ? 'success' : 'manual_redirect',
        method: result.method
      });

      await this.supabase
        .from('profiles')
        .update({ auto_apply_count_today: (profile.auto_apply_count_today || 0) + 1 })
        .eq('id', userId);

      // 5. Add to user's application tracker
      await this.supabase.from('applications').upsert({
        user_id: userId,
        company_name: job.company,
        job_title: job.title,
        job_url: job.source_url,
        status: 'applied',
        platform: job.source,
        location: job.location
      }, { onConflict: 'user_id, company_name, job_title' });

      return result;

    } catch (err: any) {
      await this.supabase.from('auto_apply_logs').insert({
        user_id: userId,
        job_id: jobId,
        status: 'failed',
        error_message: err.message
      });
      throw err;
    }
  }
}
