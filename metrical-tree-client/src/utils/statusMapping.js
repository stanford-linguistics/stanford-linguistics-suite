// Utility to map backend result statuses to canonical frontend statuses and UI labels/icons

export const STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILURE: 'failure',
  RETRY: 'retry',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
  RECONSTRUCTED: 'reconstructed', // New status for tasks with reconstructed states
};

/**
 * Maps backend status to a canonical frontend status, with enhanced reliability detection
 * 
 * @param {string} status - The status string from the backend
 * @param {Object} stateInfo - Optional additional state information object
 * @param {boolean} stateInfo.isReliableState - Whether the backend considers this a reliable state determination
 * @param {Object} stateInfo.stateDetails - Additional details about state resolution
 * @returns {string} Canonical status string
 */
export function mapBackendStatus(status, stateInfo = {}) {
  if (!status) return STATUS.PENDING;
  
  const normalized = status.toLowerCase();
  
  // Enhanced logic for pending states - detect if backend thinks it's actually successful
  // despite Celery reporting PENDING
  if (normalized === 'pending' && stateInfo.isReliableState) {
    // If this is a reliable state determination and we have artifact evidence,
    // trust the backend's analysis over the raw status
    const hasSuccessArtifacts = stateInfo.stateDetails?.artifactsFound?.has_json || 
                               stateInfo.stateDetails?.artifactsFound?.has_results_csv;
    
    // If backend has determined this is actually successful, override the pending status
    if (hasSuccessArtifacts || stateInfo.stateDetails?.resolutionMethod === 'results_json_existence') {
      console.log('Overriding PENDING status with SUCCESS based on reliability indicators');
      return STATUS.SUCCESS;
    }
  }
  
  // Fall back to normal mapping if the enhanced rules don't apply
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
