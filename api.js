// API Configuration
// Automatically detect environment: use production URL if not on localhost
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : 'https://cdcapi.onrender.com/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Jobs API
export const jobsAPI = {
  getAll: () => apiCall('/jobs'),
  search: (jobNumber) => apiCall(`/jobs/search/${encodeURIComponent(jobNumber)}`),
  getById: (id) => apiCall(`/jobs/${id}`),
  create: (jobData) => apiCall('/jobs', {
    method: 'POST',
    body: jobData
  }),
  // Search job numbers from MSSQL (4+ digits)
  searchJobNumbers: (jobNumberPart) => apiCall(`/jobs/search-numbers/${encodeURIComponent(jobNumberPart)}`),
  // Search job numbers for completion app (uses direct query, not stored procedure)
  searchJobNumbersForCompletion: (jobNumberPart) => apiCall(`/jobs/search-numbers-completion/${encodeURIComponent(jobNumberPart)}`),
  // Get job details from MSSQL
  getJobDetails: (jobNumber) => apiCall(`/jobs/details/${encodeURIComponent(jobNumber)}`),
  // Get job details for completion app (with isclose and jobcloseddate)
  getJobDetailsForCompletion: (jobNumber) => apiCall(`/jobs/details-completion/${encodeURIComponent(jobNumber)}`),
  // Complete job - close job in jobbookingjobcard table
  completeJob: (jobNumber) => apiCall(`/jobs/complete/${encodeURIComponent(jobNumber)}`, {
    method: 'POST'
  })
};

