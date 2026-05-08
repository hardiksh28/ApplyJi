import { SupabaseClient } from '@supabase/supabase-js';

export class AutoApplyService {
  constructor(private supabase: SupabaseClient) {}

  async applyToJob(userId: string, jobId: string) {
    // 1. Check daily auto-apply count from applications table
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await this.supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', 'auto_apply')
      .gte('applied_at', today.toISOString());

    if (countError) throw countError;
    
    if (count && count >= 10) {
      throw new Error('DAILY_LIMIT_REACHED');
    }

    // 2. Fetch job details
    const { data: job, error: jobError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    // 3. Insert into applications table
    const { data: application, error: appError } = await this.supabase
      .from('applications')
      .insert({
        user_id: userId,
        company_name: job.company,
        job_title: job.title,
        job_url: job.job_url || job.source_url,
        location: job.location,
        status: 'applied',
        source: 'auto_apply',
        platform: job.source,
      })
      .select()
      .single();

    if (appError) throw appError;

    // 4. Insert activity log in application_activities
    const { error: activityError } = await this.supabase
      .from('application_activities')
      .insert({
        application_id: application.id,
        activity_type: 'auto_apply',
        description: `Automatically applied to ${job.title} at ${job.company}`,
        metadata: { jobId: job.id }
      });

    if (activityError) {
      console.error('Failed to log activity:', activityError);
      // Don't fail the whole operation if logging fails
    }

    // 5. Return success
    return { success: true, application };
  }
}
