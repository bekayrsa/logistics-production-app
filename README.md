# Mining SaaS Dashboard

A professional React-based dashboard for mining operations management, built with Vite and Tailwind CSS.

## Features

- **Dashboard**: KPI cards, production trends, and site performance overview
- **Sites Management**: CRUD operations for mining sites with targets and assignments
- **Trucks Fleet**: Vehicle management with capacity tracking and status monitoring
- **Projects**: Initiative tracking with status badges and progress monitoring
- **Reports**: Production capture data with load tracking and timestamps
- **Local Storage**: Client-side data persistence for demo purposes

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- Local Storage API

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/
│   └── Layout.jsx          # Main layout with sidebar navigation
├── pages/
│   ├── Dashboard.jsx       # Main dashboard with KPIs and charts
│   ├── Sites.jsx           # Sites management interface
│   ├── Trucks.jsx          # Fleet management
│   ├── Projects.jsx        # Project tracking
│   ├── Reports.jsx         # Production reports
│   └── ...
├── utils/
│   ├── demoData.jsx        # Demo data generation
│   └── localStorage.jsx    # Data persistence utilities
└── App.jsx                 # Main app component with routing
```

## Demo Data

The application uses localStorage to persist demo data including:
- 8 mining sites with production targets
- 20 trucks with varying capacities
- 3 active projects
- 31 days of production history
- 24 recent production captures

Data is automatically reloaded on app start to ensure fresh demo content.