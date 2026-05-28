// App-wide constants

export const APP_NAME = 'Docstec Tracker';

export const PROJECT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.PENDING]: 'Pending',
  [PROJECT_STATUS.IN_PROGRESS]: 'In Progress',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.CANCELLED]: 'Cancelled',
};

export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS.PENDING]: { bg: '#FEF3C7', text: '#D97706' },
  [PROJECT_STATUS.IN_PROGRESS]: { bg: '#DBEAFE', text: '#2563EB' },
  [PROJECT_STATUS.COMPLETED]: { bg: '#DCFCE7', text: '#16A34A' },
  [PROJECT_STATUS.CANCELLED]: { bg: '#FEE2E2', text: '#DC2626' },
};

export const PAYMENT_METHODS = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'bKash', value: 'bkash' },
  { label: 'Nagad', value: 'nagad' },
  { label: 'Cash', value: 'cash' },
  { label: 'Rocket', value: 'rocket' },
  { label: 'Other', value: 'other' },
];

export const PAYMENT_METHOD_LABELS = {
  bank_transfer: 'Bank Transfer',
  bkash: 'bKash',
  nagad: 'Nagad',
  cash: 'Cash',
  rocket: 'Rocket',
  other: 'Other',
};

export const DEFAULT_COMPANY = {
  name: 'Docstec',
  tagline: 'WEB DEVELOPMENT & TECH SOLUTIONS',
  address: 'Dhaka, Bangladesh',
  email: 'hello@docstec.com',
  web: 'www.docstec.com',
};

export const DEFAULT_TERMS = [];

export const CURRENCY = 'BDT';
