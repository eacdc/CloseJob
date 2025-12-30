import { jobsAPI } from './api.js';

// Collapsible panels
document.querySelectorAll(".panel--collapsible .panel-header").forEach((header) => {
  header.addEventListener("click", () => {
    const panel = header.closest(".panel--collapsible");
    panel?.classList.toggle("panel-collapsed");
  });
});

// Job search
const jobSearchForm = document.getElementById('jobSearchForm');
const jobSearchError = document.getElementById('jobSearchError');
const jobNumberInput = document.getElementById('jobNumber');
const jobNumberDropdown = document.getElementById('jobNumberDropdown');
let searchTimeout = null;

// Handle job number input - search when 4+ digits entered
jobNumberInput.addEventListener('input', async (e) => {
  const value = e.target.value.trim();
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Hide dropdown if less than 4 characters
  if (value.length < 4) {
    jobNumberDropdown.style.display = 'none';
    return;
  }

  // Debounce search (wait 300ms after user stops typing)
  searchTimeout = setTimeout(async () => {
    try {
      console.log('🔍 [FRONTEND] Searching job numbers for:', value);
      const jobNumbers = await jobsAPI.searchJobNumbersForCompletion(value);
      console.log('🔍 [FRONTEND] Received jobNumbers:', jobNumbers);
      console.log('🔍 [FRONTEND] jobNumbers type:', typeof jobNumbers, 'isArray:', Array.isArray(jobNumbers));
      
      if (jobNumbers && jobNumbers.length > 0) {
        // Populate dropdown
        jobNumberDropdown.innerHTML = '';
        jobNumbers.forEach(jobNum => {
          const item = document.createElement('div');
          item.style.padding = '10px 14px';
          item.style.cursor = 'pointer';
          item.style.borderBottom = '1px solid rgba(55, 65, 81, 0.5)';
          item.style.color = '#f9fafb';
          item.style.fontSize = '0.9rem';
          item.textContent = jobNum;
          item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'rgba(79, 70, 229, 0.3)';
          });
          item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
          });
          item.addEventListener('click', () => {
            jobNumberInput.value = jobNum;
            jobNumberDropdown.style.display = 'none';
            // Trigger job details fetch
            fetchJobDetails(jobNum);
          });
          jobNumberDropdown.appendChild(item);
        });
        jobNumberDropdown.style.display = 'block';
        console.log('🔍 [FRONTEND] Dropdown populated with', jobNumbers.length, 'items');
      } else {
        console.log('🔍 [FRONTEND] No job numbers found or empty array');
        jobNumberDropdown.style.display = 'none';
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error searching job numbers:', error);
      jobNumberDropdown.style.display = 'none';
    }
  }, 300);
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  const jobSearchPanel = jobSearchForm.closest('.panel');
  if (jobSearchPanel && !jobSearchPanel.contains(e.target)) {
    jobNumberDropdown.style.display = 'none';
  }
});

// Function to fetch job details from MSSQL for completion app
async function fetchJobDetails(jobNumber) {
  try {
    const jobDetails = await jobsAPI.getJobDetailsForCompletion(jobNumber);
    
    // Populate job details section with new mapping
    document.getElementById('clientName').value = jobDetails.clientName || '';
    document.getElementById('qty').value = jobDetails.qty || 0;
    
    // Normalize isclose to a number so that "1", 1, true all count as closed
    const isClosed = Number(jobDetails.isclose) === 1;

    // Status: if isclose = 0 then "Open", if 1 then "Closed"
    const status = isClosed ? 'Closed' : 'Open';
    document.getElementById('status').value = status;
    
    // Closed Date: format datetime, if null show "-"
    // Parse the date string directly to avoid timezone conversion issues
    if (jobDetails.jobcloseddate) {
      let dateStr = String(jobDetails.jobcloseddate);
      
      // Handle SQL Server datetime format: "2025-12-30T14:21:55.537Z" or "2025-12-30 14:21:55.537"
      // Extract date and time components directly without timezone conversion
      const sqlDateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s]+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
      
      if (sqlDateMatch) {
        const [, year, month, day, hour, minute, second] = sqlDateMatch;
        // Format as: MM/DD/YYYY HH:mm:ss (using the exact values from database)
        const formattedDate = `${month}/${day}/${year} ${hour}:${minute}:${second}`;
        document.getElementById('closedDate').value = formattedDate;
      } else {
        // Fallback: try to parse and display as-is
        document.getElementById('closedDate').value = dateStr;
      }
    } else {
      document.getElementById('closedDate').value = '-';
    }
    
    // Disable Complete button if job is already closed (isclose = 1)
    const completeBtn = document.getElementById('completeBtn');
    if (isClosed) {
      completeBtn.disabled = true;
      completeBtn.style.opacity = '0.5';
      completeBtn.style.cursor = 'not-allowed';
    } else {
      completeBtn.disabled = false;
      completeBtn.style.opacity = '1';
      completeBtn.style.cursor = 'pointer';
    }
  } catch (error) {
    console.error('Error fetching job details:', error);
    // Fallback to default values if error
    document.getElementById('clientName').value = '';
    document.getElementById('qty').value = 0;
    document.getElementById('status').value = '';
    document.getElementById('closedDate').value = '';
    
    // Enable button on error
    const completeBtn = document.getElementById('completeBtn');
    completeBtn.disabled = false;
    completeBtn.style.opacity = '1';
    completeBtn.style.cursor = 'pointer';
  }
}

jobSearchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const jobNumber = jobNumberInput.value.trim();
  const completeBtn = document.getElementById('completeBtn');
  
  // Prevent submission if button is disabled (job already closed)
  if (completeBtn.disabled) {
    jobSearchError.textContent = 'This job is already closed and cannot be completed again.';
    jobSearchError.className = 'inline-warning';
    jobSearchError.style.display = 'block';
    return;
  }
  
  jobSearchError.style.display = 'none';
  jobSearchError.className = 'inline-warning'; // Reset to warning class
  jobNumberDropdown.style.display = 'none';

  if (!jobNumber) {
    jobSearchError.textContent = 'Please enter a job number.';
    jobSearchError.style.display = 'block';
    return;
  }

  try {
    // First fetch job details to display
    await fetchJobDetails(jobNumber);

    // Then complete the job
    await jobsAPI.completeJob(jobNumber);
    
    // Show success message
    jobSearchError.textContent = 'Job closed successfully!';
    jobSearchError.className = 'inline-success';
    jobSearchError.style.display = 'block';
    
    // Refresh job details to show updated status
    await fetchJobDetails(jobNumber);
    
    // Clear form immediately so user can enter new job number right away
    jobNumberInput.value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('status').value = '';
    document.getElementById('closedDate').value = '';
    
    // Re-enable button
    completeBtn.disabled = false;
    completeBtn.style.opacity = '1';
    completeBtn.style.cursor = 'pointer';
    
    // Focus on input field for immediate entry
    jobNumberInput.focus();
    
    // Hide success message after 2 seconds
    setTimeout(() => {
      jobSearchError.style.display = 'none';
    }, 2000);
  } catch (error) {
    console.error('Error completing job:', error);
    // Clear job details if fetch fails
    document.getElementById('clientName').value = '';
    document.getElementById('qty').value = 0;
    document.getElementById('status').value = '';
    document.getElementById('closedDate').value = '';
    
    // Enable button on error
    const completeBtn = document.getElementById('completeBtn');
    completeBtn.disabled = false;
    completeBtn.style.opacity = '1';
    completeBtn.style.cursor = 'pointer';
    
    jobSearchError.textContent = error.message || 'Failed to complete job.';
    jobSearchError.className = 'inline-warning';
    jobSearchError.style.display = 'block';
  }
});

