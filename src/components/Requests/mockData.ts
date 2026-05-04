export interface Request {
  id: number;
  title: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  reason: string;
  submittedDate?: string;
  message?: string;
  managerName?: string;
  managerMessageDate?: string;
}

export const requests: Request[] = [
  {
    id: 1,
    title: 'Leave Request',
    type: 'Leave',
    status: 'pending',
    startDate: '29/04/2026',
    endDate: '29/04/2026',
    reason:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    submittedDate: 'Apr 28, 10:30 AM',
    message: 'Waiting for manager’s approval',
  },
  {
    id: 2,
    title: 'Leave Request',
    type: 'Leave',
    status: 'approved',
    startDate: '29/04/2026',
    endDate: '29/04/2026',
    reason:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    submittedDate: 'Apr 28, 10:30 AM',
    managerName: 'Saad Qureshi',
    managerMessageDate: 'Apr 28, 3:15 PM',
    message: 'Sounds good, approved. Let me know if you need anything.',
  },
  {
    id: 3,
    title: 'WFH Request',
    type: 'WFH',
    status: 'rejected',
    startDate: '29/04/2026',
    endDate: '29/04/2026',
    reason:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    submittedDate: 'Apr 28, 10:30 AM',
    message:
      'I am not feeling well, so I cannot come to the office today. I will try to work from home if possible.',
  },
];
