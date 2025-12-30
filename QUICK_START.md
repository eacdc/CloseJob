# Job Completion System - Quick Start Guide

## Prerequisites

1. **Backend server must be running** on `http://localhost:3001`
2. A web server to serve the static files (cannot use `file://` due to CORS)

## Step 1: Start the Backend Server

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm install  # If you haven't already
npm start
```

The backend should be running on `http://localhost:3001`

## Step 2: Start a Local Web Server

Open a **new terminal** and navigate to the Job Completion directory:

### Option 1: Using Python (Recommended - Built-in)

```bash
cd "Job Completion"
python -m http.server 8000
```

### Option 2: Using Node.js (if you have http-server installed)

```bash
cd "Job Completion"
npx http-server -p 8000
```

### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Step 3: Access the Application

Open your browser and navigate to:

```
http://localhost:8000
```

## Testing

1. Type at least 4 digits of a job number in the search field
2. You should see an autocomplete dropdown with matching job numbers
3. Click on a job number or press Enter
4. The job details should populate automatically

## Troubleshooting

- **CORS errors**: Make sure the backend is running on port 3001
- **No autocomplete**: Check browser console for errors
- **Backend connection failed**: Verify backend is running: `http://localhost:3001/api/jobs`

