# GitHub Copilot Configuration for Mining Production Management System

This file provides AI context and guidelines for GitHub Copilot assistance on this project.

## Project Overview

**Mining Production Management System** - A React + Tailwind web application for tracking daily production across mining sites with strict role-based access control (RBAC).

- **Tech Stack**: Vite 5.4.21, React 18, Tailwind CSS, React Router, localStorage (no backend)
- **Live Server**: http://localhost:5173 (run `npm run dev`)
- **Data Persistence**: localStorage API via `src/utils/localStorage.js` (getData/saveData functions)

---

## Architecture & Key Patterns

### RBAC System (Critical Implementation)

Three user roles with strict access control:
- **admin**: Full access to all pages + data management console (/admin-data)
- **manager**: Dashboard, Reports, Site Performance (read-only global view with comment capability)
- **siteManager**: Capture (daily workflow), Reports (assigned site only)

**Implementation Pattern**:
- `currentUser` object passed as prop through all components: `{ id, name, email, role, assignedSite, companyId }`
- Role checks in Layout.jsx `getMenuItems()` function determine sidebar menu
- Route protection: Check `currentUser?.role !== 'admin'` before rendering admin-only pages
- Data filtering: Filter arrays by `role` and `assignedSite` for siteManager

### Component Structure

All page components follow this pattern:
```jsx
export default function PageName({ currentUser }) {
  // Role-based access check
  if (currentUser?.role !== 'admin') {
    return <div>Access Denied</div>;
  }
  // Component logic...
}
```

### Data Persistence Pattern

Use localStorage utility for all data:
```jsx
import { getData, saveData } from '../utils/localStorage';

// Read: const sites = getData('sites') || [];
// Write: saveData('sites', updatedSites);
```

**Key localStorage Keys**: sites, trucks, users, production, captures, projects, comments, mines, demoVersion

### State Management

- **Authentication State** (App.jsx): currentUser persisted in localStorage
- **Component State** (each page): Local useState for form inputs, tables, modals
- **Demo Data** (demoData.jsx): 4 user roles, 8 sites, 20 trucks, 30+ production records, 3 projects
- **Version Control**: CURRENT_VERSION = '4' in App.jsx triggers fresh demo data reload

---

## Feature Implementation Details

### Daily Capture Workflow (Capture.jsx)

Site Managers submit daily truck logs with:
- Truck selection (filtered by assigned site)
- Loads count & automatic tons calculation (loads × truck capacity)
- Failure reporting modal if daily target won't be met
- Day locking after submission (tracked in `submittedDays` array)
- Production records auto-created on finalization

### Manager Comments System (Dashboard.jsx)

Managers can add issue comments/notes:
- Modal form: type (Comment/Issue), priority, content
- Auto-saved to localStorage 'comments' key
- Display with author, timestamp, resolved toggle
- Persists across sessions

### Admin Data Management (AdminDataManagement.jsx)

Six-tab console for full CRUD + data override:
1. **Truck Captures**: Edit/delete individual entries, automatic production recalculation
2. **Production Summary**: Aggregated totals with variance % and status
3. **Sites Database**: Full CRUD on all sites
4. **Trucks Database**: Full CRUD on all trucks
5. **Users Database**: Full CRUD on all users (manage roles & assignments)
6. **Projects Database**: Full CRUD on all projects

**Critical Function**: `recalculateProduction(date)` groups captures by siteId, recalculates totals, updates production records, and syncs to localStorage.

---

## Code Patterns & Conventions

### Naming Conventions
- Components: PascalCase (Dashboard.jsx, AdminDataManagement.jsx)
- Functions: camelCase (handleSubmit, getMenuItems)
- Constants: UPPER_SNAKE_CASE (CURRENT_VERSION)
- Files: kebab-case or PascalCase for components

### Form Patterns

Inline edit pattern (used in AdminDataManagement):
```jsx
{editingId === item.id ? (
  <input value={editData.field} onChange={...} />
  <button onClick={handleSave}>Save</button>
  <button onClick={handleCancel}>Cancel</button>
) : (
  <span>{item.field}</span>
  <button onClick={() => handleEdit(item)}>Edit</button>
)}
```

### Array Filtering Pattern

```jsx
const filtered = items.filter(item => {
  if (currentUser.role === 'siteManager') {
    return item.siteId === currentUser.assignedSite;
  }
  return true; // admin/manager see all
});
```

### Production Calculation Pattern

```jsx
const totalTons = captures.reduce((sum, c) => sum + c.totalTons, 0);
const variance = Math.round(((totalTons - target) / target) * 100);
const status = totalTons >= target ? 'On Target' : 'Below Target';
```

---

## UI/Styling Standards

- **Framework**: Tailwind CSS with dark mode support (class="dark:")
- **Layout**: Sidebar + main content (Layout.jsx wrapper)
- **Tables**: Use native `<table>` with Tailwind styling
- **Forms**: Use standard HTML inputs with Tailwind classes
- **Colors**: Primary blues/teals for actions, status-based (green=good, red=issue, yellow=warning)
- **Responsiveness**: Mobile-first, test with sidebar collapse

---

## Common Development Tasks

### Adding a New Page
1. Create in `src/pages/NewPage.jsx` with currentUser prop
2. Add role check at top if restricted
3. Import & add route in App.jsx: `<Route path="path" element={<NewPage currentUser={currentUser} />} />`
4. Add menu item in Layout.jsx getMenuItems() for appropriate roles

### Adding a New Feature to Admin Dashboard
1. Add new tab button in AdminDataManagement.jsx
2. Create sub-component (e.g., NewFeatureTab.jsx) or inline JSX
3. Use getData/saveData for persistence
4. Include edit/delete buttons following existing patterns

### Modifying Production Calculation
1. Update calculation in `recalculateProduction()` function
2. Test with multiple scenarios (above/below target)
3. Verify production records update in Production Summary tab

### Adding a New Role
1. Add to demoData.jsx users array
2. Update RBAC checks in all relevant components (Layout, pages)
3. Update roleStyles object if adding new status colors
4. Test menu visibility and data filtering for new role

---

## Testing & Validation Checklist

Before committing changes:
- [ ] Feature works for all accessible user roles
- [ ] Data persists after page refresh
- [ ] Sidebar menu shows/hides correct items per role
- [ ] No console errors in browser DevTools
- [ ] Production totals recalculate if data changes
- [ ] Date filters work correctly
- [ ] Edit/delete operations trigger appropriate recalculations

---

## Quick Reference

- **Start Dev Server**: `npm run dev` (runs on http://localhost:5173)
- **Default Users**: Admin User / Manager User / John Muhari (siteManager for Site 1)
- **Demo Data Reset**: Delete localStorage or change CURRENT_VERSION in App.jsx
- **Key Files**:
  - Route definitions: App.jsx
  - Menu/sidebar: Layout.jsx
  - Data utility: src/utils/localStorage.js
  - Demo data: src/utils/demoData.jsx

---

## Copilot Assistance Guidelines

When asking for help:
- Specify the user role if the feature is role-specific
- Mention if changes need production recalculation
- Clarify localStorage vs temporary state
- Provide examples if complex calculations are involved
- Ask for RBAC validation for security-sensitive features