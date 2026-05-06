export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => {
    return Object.values(obj).map(val => {
      // Handle nested objects by converting them to JSON string
      let str = '';
      if (val === null || val === undefined) {
        str = '';
      } else if (typeof val === 'object') {
        str = JSON.stringify(val).replace(/"/g, '""');
      } else {
        str = String(val).replace(/"/g, '""');
      }
      return `"${str}"`;
    }).join(',');
  });

  const csvContent = "\uFEFF" + [headers, ...rows].join('\n'); // Added BOM for Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
