import { Application, Task, SavedJob } from '../types';

export const mockApplications: Application[] = [
  {
    id: '1',
    company: 'Google',
    role: 'Senior Software Engineer',
    location: 'Mountain View, CA',
    dateApplied: '2026-05-01',
    status: 'Interview',
    notes: 'Focus on distributed systems and system design.',
    salary: '$200k - $250k',
    tags: ['Dream Job', 'Referral'],
    contacts: [
      { name: 'Sarah Chen', role: 'Recruiter', email: 'sarah.c@google.com' }
    ],
    timeline: [
      { date: '2026-05-01', label: 'Applied', description: 'Submitted application through portal', type: 'status_change' },
      { date: '2026-05-05', label: 'Screening', description: 'Intro call with recruiter', type: 'status_change' }
    ]
  },
  {
    id: '2',
    company: 'Stripe',
    role: 'Frontend Engineer',
    location: 'Remote',
    dateApplied: '2026-04-28',
    status: 'Screening',
    notes: 'Prepare for React and architecture deep dive.',
    salary: '$180k - $220k',
    tags: ['Remote', 'Urgent'],
    contacts: [],
    timeline: [
      { date: '2026-04-28', label: 'Applied', description: 'Internal referral applied', type: 'status_change' }
    ]
  },
  {
    id: '3',
    company: 'Meta',
    role: 'Product Engineer',
    location: 'Menlo Park, CA',
    dateApplied: '2026-05-02',
    status: 'Applied',
    notes: 'Team match in AI Infrastructure.',
    salary: '$210k - $260k',
    tags: ['AI', 'Top Tier'],
    contacts: [],
    timeline: [
      { date: '2026-05-02', label: 'Applied', description: 'Application submitted', type: 'status_change' }
    ]
  },
  {
    id: '4',
    company: 'Airbnb',
    role: 'Fullstack Developer',
    location: 'Remote',
    dateApplied: '2026-04-15',
    status: 'Offer',
    notes: 'Great culture, flexible perks.',
    salary: '$190k',
    timeline: [
      { date: '2026-04-15', label: 'Applied', description: 'Applied via LinkedIn', type: 'status_change' },
      { date: '2026-05-01', label: 'Offer Received', description: 'Verbal offer from hiring manager', type: 'status_change' }
    ]
  }
];

export const mockTasks: Task[] = [
  { id: '1', title: 'Prepare for Google Interview', dueDate: '2026-05-10', priority: 'High', completed: false, applicationId: '1' },
  { id: '2', title: 'Follow up with Stripe recruiter', dueDate: '2026-05-08', priority: 'Medium', completed: false, applicationId: '2' },
  { id: '3', title: 'Update Resume for AI roles', dueDate: '2026-05-09', priority: 'Low', completed: true },
];

export const mockSavedJobs: SavedJob[] = [
  { id: '1', company: 'Tesla', role: 'UI Engineer', salary: '$170k+', deadline: '5 days left', tags: ['Remote'] },
  { id: '2', company: 'NVIDIA', role: 'Deep Learning Engineer', salary: '$220k+', deadline: '2 days left', tags: ['Dream Job', 'Urgent'] },
];
