// Utility to map backend result statuses to canonical frontend statuses and UI labels/icons

export const STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILURE: 'failure',
  RETRY: 'retry',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
};

export function mapBackendStatus(status) {
  if (!status) return STATUS.PENDING;
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'pending':
      return STATUS.PENDING;
    case 'started':
      return STATUS.RUNNING;
    case 'running':
      return STATUS.RUNNING;
    case 'success':
      return STATUS.SUCCESS;
    case 'failure':
      return STATUS.FAILURE;
    case 'retry':
      return STATUS.RETRY;
    case 'revoked':
      return STATUS.REVOKED;
    case 'expired':
    case 'results_missing':
      return STATUS.EXPIRED;
    default:
      return normalized;
  }
}

export function getStatusDisplay(status) {
  switch (status) {
    case STATUS.PENDING:
      return { label: 'Pending', color: 'warning', icon: 'HourglassEmpty' };
    case STATUS.RUNNING:
      return { label: 'Running', color: 'primary', icon: 'HourglassEmpty' };
    case STATUS.SUCCESS:
      return { label: 'Success', color: 'success', icon: 'CheckCircle' };
    case STATUS.FAILURE:
      return { label: 'Failed', color: 'error', icon: 'Error' };
    case STATUS.RETRY:
      return { label: 'Retrying', color: 'info', icon: 'Info' };
    case STATUS.REVOKED:
      return { label: 'Cancelled', color: 'default', icon: 'Error' };
    case STATUS.EXPIRED:
      return { label: 'Expired', color: 'default', icon: 'Error' };
    default:
      return { label: status, color: 'default', icon: 'Info' };
  }
}
