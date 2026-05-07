export type ApplicationStatus = 'Saved' | 'Applied' | 'Screening' | 'Interview' | 'Interviewing' | 'Offer' | 'Rejected' | 'Ghosted';

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  dateApplied?: string;
  status: ApplicationStatus;
  notes: string;
  salary?: string;
  deadline?: string;
  tags?: string[];
  contacts?: Contact[];
  timeline?: TimelineItem[];
}

export interface Contact {
  name: string;
  role: string;
  email?: string;
  linkedin?: string;
}

export interface TimelineItem {
  date: string;
  label: string;
  description: string;
  type: 'status_change' | 'note' | 'interview';
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  applicationId?: string;
}

export interface SavedJob {
  id: string;
  company: string;
  role: string;
  salary: string;
  deadline: string;
  tags: string[];
}
