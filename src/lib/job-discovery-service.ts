import { SupabaseClient } from '@supabase/supabase-js';

export interface JobListing {
  title: string;
  company: string;
  location: string;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  skills: string[];
  source: 'linkedin' | 'naukri' | 'internshala' | 'foundit';
  source_url: string;
  posted_at?: string;
}

/**
 * PHASE 3: Job Discovery Engine
 * Handles aggregation, deduplication, and matching.
 */
export class JobDiscoveryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Deduplicate and store jobs in PostgreSQL
   */
  async upsertJobs(jobs: JobListing[]) {
    const { data, error } = await this.supabase
      .from('jobs')
      .upsert(
        jobs.map(j => ({
          ...j,
          is_active: true,
          fetched_at: new Date().toISOString(),
        })),
        { onConflict: 'source_url' }
      )
      .select();

    if (error) {
      console.error('Error upserting jobs:', error);
      throw error;
    }
    return data;
  }

  /**
   * Recommendation Algorithm:
   * Score = (Matching Skills Weight) + (Location Weight) + (Recency Weight)
   */
  async getRecommendedJobs(userId: string, limit = 20) {
    // 1. Fetch user profile and preferences
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('skills, preferred_role, preferred_location, target_salary_min')
      .eq('id', userId)
      .single();

    if (profileError || !profile) throw new Error('Profile not found');

    // 2. Fetch jobs (Simplified: In a real app, this would be a complex SQL query or vector search)
    // For now, we'll fetch active jobs and score them in TS
    const { data: jobs, error: jobsError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('posted_at', { ascending: false })
      .limit(500);

    if (jobsError || !jobs) throw new Error('Jobs not found');

    const userSkills = (profile.skills || []).map((s: any) => 
      typeof s === 'string' ? s.toLowerCase() : (s.name || s.skill || '').toLowerCase()
    );

    // 3. Scoring
    const scoredJobs = jobs.map(job => {
      let score = 0;
      
      // Skills matching (60% weight)
      const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
      const matchingSkills = jobSkills.filter((s: string) => userSkills.includes(s));
      score += (matchingSkills.length / (jobSkills.length || 1)) * 60;

      // Role matching (20% weight)
      if (profile.preferred_role && job.title.toLowerCase().includes(profile.preferred_role.toLowerCase())) {
        score += 20;
      }

      // Location matching (10% weight)
      if (profile.preferred_location && job.location?.toLowerCase().includes(profile.preferred_location.toLowerCase())) {
        score += 10;
      }

      // Recency (10% weight)
      const daysSincePosted = (new Date().getTime() - new Date(job.posted_at || job.created_at).getTime()) / (1000 * 3600 * 24);
      score += Math.max(0, 10 - daysSincePosted);

      return { ...job, matchScore: Math.round(score) };
    });

    // 4. Filter and Sort
    return scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Mock Scrapers for Naukri, Internshala, Foundit
   * In production, these would use Playwright/Puppeteer via a worker
   */
  async runAggregationPipeline() {
    console.log('Running aggregation pipeline...');
    
    // Simulate scraping Naukri
    const naukriJobs: JobListing[] = [
      {
        title: 'Senior Frontend Developer',
        company: 'TechCorp India',
        location: 'Bangalore',
        salary: '₹18L - ₹25L',
        salary_min: 1800000,
        salary_max: 2500000,
        description: 'We are looking for a Senior React dev...',
        skills: ['React', 'TypeScript', 'Tailwind', 'Next.js'],
        source: 'naukri',
        source_url: 'https://naukri.com/job/senior-frontend-1',
        posted_at: new Date().toISOString()
      },
      {
        title: 'Software Engineer',
        company: 'GrowthScale',
        location: 'Remote',
        salary: '₹10L - ₹15L',
        salary_min: 1000000,
        salary_max: 1500000,
        description: 'Full stack role with emphasis on Node...',
        skills: ['Node.js', 'PostgreSQL', 'AWS'],
        source: 'naukri',
        source_url: 'https://naukri.com/job/software-engineer-2',
        posted_at: new Date().toISOString()
      }
    ];

    // Simulate scraping Internshala
    const internshalaJobs: JobListing[] = [
      {
        title: 'Full Stack Intern',
        company: 'StartupX',
        location: 'Mumbai',
        salary: '₹20k/month',
        description: 'Exciting internship for freshers...',
        skills: ['JavaScript', 'HTML', 'CSS'],
        source: 'internshala',
        source_url: 'https://internshala.com/internship/detail/full-stack-3',
        posted_at: new Date().toISOString()
      }
    ];

    const allJobs = [...naukriJobs, ...internshalaJobs];
    return this.upsertJobs(allJobs);
  }
}
