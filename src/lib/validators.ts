import { z } from 'zod';

export const createApplicationSchema = z.object({
  company_name: z.string().max(200),
  job_title: z.string().max(200),
  job_url: z.string().url().optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  salary_range: z.string().max(100).optional(),
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected', 'archived']).optional(),
  description: z.string().max(5000).optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const savedJobSchema = createApplicationSchema;

export const resumeAnalyzeSchema = z.object({
  resumeText: z.string().min(50).max(20000),
  jobDescription: z.string().min(50).max(10000),
});

export const coverLetterSchema = z.object({
  jobDescriptionText: z.string().min(50).max(10000),
  tone: z.enum(['professional', 'casual', 'enthusiastic']),
  applicationId: z.string().uuid().optional(),
});

export const skillsGapSchema = z.object({
  jobDescriptionText: z.string().min(50).max(10000),
});

export const followupSchema = z.object({
  company: z.string().max(200),
  jobTitle: z.string().max(200),
  appliedDate: z.string().optional(),
});

// Additional schemas for other POST routes
export const resumeGenerateSchema = z.object({
  jobDescriptionText: z.string().min(50).max(10000),
  applicationId: z.string().uuid().optional(),
});

export const interviewPrepSchema = z.object({
  jobId: z.string().uuid(),
  companyName: z.string().max(200),
  role: z.string().max(200),
});

export const atsScoreSchema = z.object({
  resumeText: z.string().min(50).max(20000),
  jobDescriptionText: z.string().min(50).max(10000),
});

export const oneClickApplySchema = z.object({
  jobId: z.string().uuid(),
});



export const createCheckoutSchema = z.object({
  interval: z.string().optional(),
  currency: z.enum(['inr', 'usd']).optional(),
});
