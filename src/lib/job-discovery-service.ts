import { SupabaseClient } from '@supabase/supabase-js';

export class JobDiscoveryService {
  constructor(private supabase: SupabaseClient) {}

  async getRecommendedJobs(userId: string) {
    // 1. Fetch user profile skills
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('skills')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const userSkills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());

    // 2. Fetch jobs
    const { data: jobs, error: jobsError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true);

    if (jobsError || !jobs) {
      throw new Error('Failed to fetch jobs');
    }

    // 3. Calculate score based on skill overlap
    const scoredJobs = jobs.map(job => {
      const jobSkills: string[] = Array.isArray(job.skills) ? job.skills : [];
      const normalizedJobSkills = jobSkills.map(s => s.toLowerCase());
      
      const overlap = normalizedJobSkills.filter(s => normalizedUserSkills.includes(s)).length;
      
      return {
        ...job,
        matchScore: overlap
      };
    });

    // 4. Sort and return top 10
    return scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  async runAggregationPipeline() {
    console.log('Mock aggregation pipeline running');
    return [];
  }
}
