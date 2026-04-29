export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  assignedToName?: string[];
  status: TaskStatus;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  deadline?: string;
  updatedAt?: string;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  department?: string;
  project?: string;
  managerId?: string;
  memberIds?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
}
