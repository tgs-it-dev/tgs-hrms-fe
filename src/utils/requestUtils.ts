export const mapWorkflowStatus = (
  status: string
): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_review' => {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'in_review') return 'in_review';
  return 'pending';
};
