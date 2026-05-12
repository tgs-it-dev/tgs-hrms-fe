export const mapWorkflowStatus = (
  status: string
): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
};
