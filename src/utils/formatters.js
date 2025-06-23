// Format currency with ₹ symbol (Indian Rupees)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date as DD/MM/YYYY
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format date as readable (e.g., "May 3, 2025")
export const formatReadableDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Format number with commas for thousands
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-IN').format(number);
};

// Format percentage
export const formatPercentage = (number, decimals = 1) => {
  return `${number.toFixed(decimals)}%`;
};

// Format date range (e.g., "3 - 9 May, 2025")
export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Same month and year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-IN', { month: 'long' })}, ${start.getFullYear()}`;
  } 
  // Same year, different month
  else if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${start.toLocaleDateString('en-IN', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('en-IN', { month: 'short' })}, ${start.getFullYear()}`;
  } 
  // Different year
  else {
    return `${start.getDate()} ${start.toLocaleDateString('en-IN', { month: 'short' })}, ${start.getFullYear()} - ${end.getDate()} ${end.toLocaleDateString('en-IN', { month: 'short' })}, ${end.getFullYear()}`;
  }
}; 