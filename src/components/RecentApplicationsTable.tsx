import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  interviewing: 'bg-green-100 text-green-700 hover:bg-green-200',
  offered: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
  saved: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
};

interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  applied_at: string;
}

export function RecentApplicationsTable({ applications }: { applications: Application[] }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-lg text-gray-900">Recent Applications</h3>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Applied Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                No applications found. Sync with Gmail to get started!
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow 
                key={app.id} 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/applications/${app.id}`)}
              >
                <TableCell className="font-medium text-gray-900">
                  {app.company_name}
                </TableCell>
                <TableCell className="text-gray-600">{app.job_title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[app.status] || ''}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {format(new Date(app.applied_at), 'MMM dd, yyyy')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
