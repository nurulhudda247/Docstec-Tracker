// Utility formatters for currency, dates, etc.
import useStore from '../store/useStore';

/**
 * Format number as BDT currency
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (!showSymbol) return formatted;
  
  const baseCurrency = useStore.getState().baseCurrency || 'BDT';
  if (baseCurrency === 'BDT') return `৳${formatted}`;
  if (baseCurrency === 'USD') return `$${formatted}`;
  if (baseCurrency === 'GBP') return `£${formatted}`;
  if (baseCurrency === 'EUR') return `€${formatted}`;
  return `${baseCurrency} ${formatted}`;
};

/**
 * Format Firestore Timestamp or Date to readable string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    input: { year: 'numeric', month: '2-digit', day: '2-digit' },
  };

  return d.toLocaleDateString('en-US', options[format] || options.short);
};

/**
 * Format date for PDF display (e.g., "May 25, 2026")
 */
export const formatDateForPDF = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Convert number to words (for BDT)
 */
export const numberToWords = (num, overrideCurrency = null) => {
  if (num === 0) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const numToStr = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToStr(n % 100) : '');
    if (n < 100000) return numToStr(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToStr(n % 1000) : '');
    if (n < 10000000) return numToStr(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToStr(n % 100000) : '');
    return numToStr(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToStr(n % 10000000) : '');
  };

  const code = overrideCurrency || useStore.getState().baseCurrency || 'BDT';
  const currencyName = code === 'USD' ? 'US Dollars Only' : 
                       code === 'GBP' ? 'British Pounds Only' : 
                       code === 'EUR' ? 'Euros Only' : 
                       'Bangladeshi Taka Only';

  return numToStr(Math.abs(Math.floor(num))) + ' ' + currencyName;
};

/**
 * Get relative time (e.g., "2 days ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Get days remaining until deadline
 */
export const getDaysRemaining = (deadline) => {
  if (!deadline) return null;
  const d = deadline?.toDate ? deadline.toDate() : new Date(deadline);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
