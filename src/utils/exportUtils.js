/**
 * Logical mapping of internal keys to human-readable headers
 */
const KEY_MAP = {
  date: 'Date',
  siteName: 'Site Name',
  truckName: 'Truck / Vehicle',
  loads: 'Loads',
  tons: 'Total Tons (t)',
  totalTons: 'Total Tons (t)',
  target: 'Daily Target (t)',
  actual: 'Actual Produced (t)',
  variance: 'Variance %',
  status: 'Status',
  trucksUsed: 'Trucks Count',
  loadsPerTruck: 'Loads Per Truck',
  timestamp: 'Time recorded',
  failureReport_reasonCategory: 'Failure Category',
  failureReport_explanation: 'Failure Details',
  failureReport_delayFactors: 'Delay Factors',
  name: 'User Name',
  email: 'Email Address',
  role: 'Access Role',
  assignedSite: 'Assigned Site ID',
  projectName: 'Project Name',
  mine: 'Mine/Operation',
  capacity: 'Capacity (t)',
  type: 'Vehicle Type',
  mineName: 'Mine Name',
  resource: 'Resource Type',
  dailyTarget: 'Daily Target (t)'
};

/**
 * Flattens a nested object into a single level
 */
const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '_' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else if (Array.isArray(obj[k])) {
      acc[pre + k] = obj[k].join('; ');
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

export const exportToCSV = (rawData, filename) => {
  if (!rawData || !rawData.length) {
    alert("No data to export.");
    return;
  }

  // 1. Flatten all records and collect all unique keys
  const flattenedData = rawData.map(item => flattenObject(item));
  const allKeys = Array.from(new Set(flattenedData.reduce((acc, item) => acc.concat(Object.keys(item)), [])));

  // 2. Filter out internal keys like 'id' or 'siteId' if they have a better name available
  const displayKeys = allKeys.filter(key => !['id', 'siteId', 'truckId', 'mineId', 'companyId', 'password'].includes(key));

  // 3. Create headers using the KEY_MAP or fallback to capitalized key
  const headers = displayKeys.map(key => KEY_MAP[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '));

  // 4. Create rows
  const rows = flattenedData.map(obj => {
    return displayKeys.map(key => {
      let val = obj[key];
      if (val === null || val === undefined) {
        val = '';
      } else if (key === 'timestamp') {
        val = new Date(val).toLocaleTimeString();
      }
      
      // Escape double quotes and wrap in quotes
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
  });

  // 5. Build CSV content with BOM for Excel
  const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.body.appendChild(document.createElement('a'));
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.download = filename;
  link.click();
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 100);
};
