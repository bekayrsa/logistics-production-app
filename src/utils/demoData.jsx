// Demo data generator for Production Management app

import { saveData } from './localStorage'

export function loadDemoData() {
  // Create default user for demo mode
  const defaultUser = {
    email: 'demo@miningsense.com',
    role: 'Admin',
    companyId: 1,
    loggedIn: true
  }
  saveData('user', defaultUser)

  // Company Structure
  const company = {
    id: 1,
    name: 'Demo Mining Logistics',
    description: 'Consolidated mining operations across multiple sites'
  }
  saveData('company', company)

  // Mines (1 company → multiple mines)
  const mines = [
    {
      id: 1,
      name: 'Mine A',
      operation: 'Coal Operations',
      companyId: 1,
      location: 'Northern Region',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Mine B',
      operation: 'Chrome Operations',
      companyId: 1,
      location: 'Central Region',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Mine C',
      operation: 'Platinum Operations',
      companyId: 1,
      location: 'Southern Region',
      status: 'Active'
    }
  ]
  saveData('mines', mines)

  // Site Managers
  const managers = [
    { id: 1, name: 'John Muhari', email: 'john.muhari@demo.com', phone: '+27 11 123 4567' },
    { id: 2, name: 'Sarah Nkosi', email: 'sarah.nkosi@demo.com', phone: '+27 11 234 5678' },
    { id: 3, name: 'David Thabo', email: 'david.thabo@demo.com', phone: '+27 11 345 6789' },
    { id: 4, name: 'Linda Mbatha', email: 'linda.mbatha@demo.com', phone: '+27 11 456 7890' },
    { id: 5, name: 'Peter Dlamini', email: 'peter.dlamini@demo.com', phone: '+27 11 567 8901' },
    { id: 6, name: 'Emma Coetzee', email: 'emma.coetzee@demo.com', phone: '+27 11 678 9012' },
    { id: 7, name: 'Michael Van Der', email: 'michael.vd@demo.com', phone: '+27 11 789 0123' },
    { id: 8, name: 'Thandi Sithole', email: 'thandi.sithole@demo.com', phone: '+27 11 890 1234' }
  ]
  saveData('managers', managers)

  // Sites (1 mine → 1 or more sites | Total: 8 sites)
  const sites = [
    // Mine A - Coal Operations (3 sites)
    {
      id: 1,
      siteName: 'Coal Site A1',
      mineName: 'Mine A',
      resource: 'Coal',
      mineId: 1,
      companyId: 1,
      dailyTarget: 50,
      assignedManager: 'John Muhari',
      managerId: 1,
      status: 'Active'
    },
    {
      id: 2,
      siteName: 'Coal Site A2',
      mineName: 'Mine A',
      resource: 'Coal',
      mineId: 1,
      companyId: 1,
      dailyTarget: 45,
      assignedManager: 'Sarah Nkosi',
      managerId: 2,
      status: 'Active'
    },
    {
      id: 3,
      siteName: 'Coal Site A3',
      mineName: 'Mine A',
      resource: 'Coal',
      mineId: 1,
      companyId: 1,
      dailyTarget: 48,
      assignedManager: 'David Thabo',
      managerId: 3,
      status: 'Active'
    },
    // Mine B - Chrome Operations (3 sites)
    {
      id: 4,
      siteName: 'Chrome Site B1',
      mineName: 'Mine B',
      resource: 'Chrome',
      mineId: 2,
      companyId: 1,
      dailyTarget: 30,
      assignedManager: 'Linda Mbatha',
      managerId: 4,
      status: 'Active'
    },
    {
      id: 5,
      siteName: 'Chrome Site B2',
      mineName: 'Mine B',
      resource: 'Chrome',
      mineId: 2,
      companyId: 1,
      dailyTarget: 28,
      assignedManager: 'Peter Dlamini',
      managerId: 5,
      status: 'Active'
    },
    {
      id: 6,
      siteName: 'Chrome Site B3',
      mineName: 'Mine B',
      resource: 'Chrome',
      mineId: 2,
      companyId: 1,
      dailyTarget: 32,
      assignedManager: 'Emma Coetzee',
      managerId: 6,
      status: 'Active'
    },
    // Mine C - Platinum Operations (2 sites)
    {
      id: 7,
      siteName: 'Platinum Site C1',
      mineName: 'Mine C',
      resource: 'Platinum',
      mineId: 3,
      companyId: 1,
      dailyTarget: 20,
      assignedManager: 'Michael Van Der',
      managerId: 7,
      status: 'Active'
    },
    {
      id: 8,
      siteName: 'Platinum Site C2',
      mineName: 'Mine C',
      resource: 'Platinum',
      mineId: 3,
      companyId: 1,
      dailyTarget: 22,
      assignedManager: 'Thandi Sithole',
      managerId: 8,
      status: 'Active'
    }
  ]
  saveData('sites', sites)

  // Trucks (20 total, spread across 8 sites)
  const trucks = [
    // Site 1 - Coal Site A1 (3 trucks)
    { id: 1, truckName: 'TRK-001', type: 'ADT', capacity: 23, siteId: 1, siteName: 'Coal Site A1', companyId: 1, status: 'Active' },
    { id: 2, truckName: 'TRK-002', type: 'Heavy Truck', capacity: 35, siteId: 1, siteName: 'Coal Site A1', companyId: 1, status: 'Active' },
    { id: 3, truckName: 'TRK-003', type: 'Medium Truck', capacity: 23, siteId: 1, siteName: 'Coal Site A1', companyId: 1, status: 'Active' },
    // Site 2 - Coal Site A2 (3 trucks)
    { id: 4, truckName: 'TRK-004', type: 'Heavy Truck', capacity: 35, siteId: 2, siteName: 'Coal Site A2', companyId: 1, status: 'Active' },
    { id: 5, truckName: 'TRK-005', type: 'ADT', capacity: 23, siteId: 2, siteName: 'Coal Site A2', companyId: 1, status: 'Active' },
    { id: 6, truckName: 'TRK-006', type: 'Medium Truck', capacity: 23, siteId: 2, siteName: 'Coal Site A2', companyId: 1, status: 'Active' },
    // Site 3 - Coal Site A3 (2 trucks)
    { id: 7, truckName: 'TRK-007', type: 'ADT', capacity: 23, siteId: 3, siteName: 'Coal Site A3', companyId: 1, status: 'Active' },
    { id: 8, truckName: 'TRK-008', type: 'Heavy Truck', capacity: 35, siteId: 3, siteName: 'Coal Site A3', companyId: 1, status: 'Active' },
    // Site 4 - Chrome Site B1 (3 trucks)
    { id: 9, truckName: 'TRK-009', type: 'Medium Truck', capacity: 23, siteId: 4, siteName: 'Chrome Site B1', companyId: 1, status: 'Active' },
    { id: 10, truckName: 'TRK-010', type: 'ADT', capacity: 23, siteId: 4, siteName: 'Chrome Site B1', companyId: 1, status: 'Active' },
    { id: 11, truckName: 'TRK-011', type: 'Heavy Truck', capacity: 35, siteId: 4, siteName: 'Chrome Site B1', companyId: 1, status: 'Active' },
    // Site 5 - Chrome Site B2 (2 trucks)
    { id: 12, truckName: 'TRK-012', type: 'ADT', capacity: 23, siteId: 5, siteName: 'Chrome Site B2', companyId: 1, status: 'Active' },
    { id: 13, truckName: 'TRK-013', type: 'Medium Truck', capacity: 23, siteId: 5, siteName: 'Chrome Site B2', companyId: 1, status: 'Active' },
    // Site 6 - Chrome Site B3 (3 trucks)
    { id: 14, truckName: 'TRK-014', type: 'Heavy Truck', capacity: 35, siteId: 6, siteName: 'Chrome Site B3', companyId: 1, status: 'Active' },
    { id: 15, truckName: 'TRK-015', type: 'ADT', capacity: 23, siteId: 6, siteName: 'Chrome Site B3', companyId: 1, status: 'Active' },
    { id: 16, truckName: 'TRK-016', type: 'Medium Truck', capacity: 23, siteId: 6, siteName: 'Chrome Site B3', companyId: 1, status: 'Active' },
    // Site 7 - Platinum Site C1 (2 trucks)
    { id: 17, truckName: 'TRK-017', type: 'ADT', capacity: 23, siteId: 7, siteName: 'Platinum Site C1', companyId: 1, status: 'Active' },
    { id: 18, truckName: 'TRK-018', type: 'Heavy Truck', capacity: 35, siteId: 7, siteName: 'Platinum Site C1', companyId: 1, status: 'Active' },
    // Site 8 - Platinum Site C2 (2 trucks)
    { id: 19, truckName: 'TRK-019', type: 'Medium Truck', capacity: 23, siteId: 8, siteName: 'Platinum Site C2', companyId: 1, status: 'Active' },
    { id: 20, truckName: 'TRK-020', type: 'Heavy Truck', capacity: 35, siteId: 8, siteName: 'Platinum Site C2', companyId: 1, status: 'Active' }
  ]
  saveData('trucks', trucks)

  // Production history (30 days × 8 sites + TODAY)
  const productionData = []
  const siteTargets = {
    1: 50, 2: 45, 3: 48, 4: 30, 5: 28, 6: 32, 7: 20, 8: 22
  }
  const siteTruckCounts = {
    1: 3, 2: 3, 3: 2, 4: 3, 5: 2, 6: 3, 7: 2, 8: 2
  }

  let productionId = 1
  const today = new Date()

  // Generate 30 days of production logs + TODAY
  for (let day = 30; day >= 0; day--) {
    const logDate = new Date(today)
    logDate.setDate(logDate.getDate() - day)
    const dateString = logDate.toISOString().split('T')[0]

    // Add logs for each site
    for (let siteId = 1; siteId <= 8; siteId++) {
      const target = siteTargets[siteId]
      const trucksUsed = siteTruckCounts[siteId]
      
      // Generate realistic variation: 70-130% of target
      const variance = (Math.random() - 0.5) * 60 // -30% to +30%
      const actual = Math.round(target * (1 + variance / 100))
      const loadsPerTruck = Math.round(actual / trucksUsed)
      const totalTons = loadsPerTruck * trucksUsed
      const variancePercent = Math.round((totalTons - target) / target * 100)

      productionData.push({
        id: productionId++,
        date: dateString,
        siteId,
        siteName: sites.find(s => s.id === siteId)?.siteName || `Site ${siteId}`,
        trucksUsed,
        loadsPerTruck,
        totalTons,
        target,
        actual: totalTons,
        variance: variancePercent,
        status: totalTons >= target ? 'On Target' : 'Below Target'
      })
    }
  }
  saveData('production', productionData)

  // Sample captures for today (simulating user entries)
  const captures = []
  const todayString = today.toISOString().split('T')[0]
  let captureId = 1

  // Add sample captures for today across all sites
  const captureData = [
    { siteId: 1, truckId: 1, loads: 3, tons: 69 },
    { siteId: 1, truckId: 2, loads: 2, tons: 70 },
    { siteId: 2, truckId: 4, loads: 2, tons: 70 },
    { siteId: 2, truckId: 5, loads: 2, tons: 46 },
    { siteId: 3, truckId: 7, loads: 3, tons: 69 },
    { siteId: 3, truckId: 8, loads: 1, tons: 35 },
    { siteId: 4, truckId: 9, loads: 2, tons: 46 },
    { siteId: 4, truckId: 10, loads: 1, tons: 23 },
    { siteId: 5, truckId: 12, loads: 2, tons: 46 },
    { siteId: 6, truckId: 14, loads: 2, tons: 70 },
    { siteId: 6, truckId: 15, loads: 1, tons: 23 },
    { siteId: 7, truckId: 17, loads: 1, tons: 23 },
    { siteId: 8, truckId: 19, loads: 2, tons: 46 }
  ]

  captureData.forEach(capture => {
    const site = sites.find(s => s.id === capture.siteId)
    const truck = trucks.find(t => t.id === capture.truckId)
    captures.push({
      id: captureId++,
      date: todayString,
      siteId: capture.siteId,
      siteName: site?.siteName || `Site ${capture.siteId}`,
      truckId: capture.truckId,
      truckName: truck?.truckName || `Truck ${capture.truckId}`,
      loads: capture.loads,
      tons: capture.tons,
      companyId: 1,
      failureReport: null
    })
  })
  saveData('captures', captures)

  // Sample projects
  const projects = [
    { id: 1, projectName: 'Q2 Expansion', mine: 'Mine A', status: 'Active', companyId: 1 },
    { id: 2, projectName: 'Equipment Upgrade', mine: 'Mine B', status: 'Active', companyId: 1 },
    { id: 3, projectName: 'Safety Initiative', mine: 'Mine C', status: 'Active', companyId: 1 }
  ]
  saveData('projects', projects)

  // Users with roles
  const users = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@miningsense.com',
      role: 'admin',
      companyId: 1,
      assignedSite: null
    },
    {
      id: 2,
      name: 'Manager User',
      email: 'manager@miningsense.com',
      role: 'manager',
      companyId: 1,
      assignedSite: null
    },
    {
      id: 3,
      name: 'John Muhari',
      email: 'john.muhari@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 1
    },
    {
      id: 4,
      name: 'Sarah Nkosi',
      email: 'sarah.nkosi@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 2
    },
    {
      id: 5,
      name: 'David Thabo',
      email: 'david.thabo@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 3
    },
    {
      id: 6,
      name: 'Linda Mbatha',
      email: 'linda.mbatha@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 4
    },
    {
      id: 7,
      name: 'Peter Dlamini',
      email: 'peter.dlamini@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 5
    },
    {
      id: 8,
      name: 'Emma Coetzee',
      email: 'emma.coetzee@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 6
    },
    {
      id: 9,
      name: 'Michael Van Der',
      email: 'michael.vd@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 7
    },
    {
      id: 10,
      name: 'Thandi Sithole',
      email: 'thandi.sithole@demo.com',
      role: 'siteManager',
      companyId: 1,
      assignedSite: 8
    }
  ]
  saveData('users', users)

  // Set default logged in user (Admin for demo)
  const defaultCurrentUser = users.find(u => u.role === 'admin')
  saveData('currentUser', defaultCurrentUser)

  // Sample manager comments and issues
  const comments = [
    {
      id: 1,
      siteId: 1,
      type: 'comment',
      author: 'Manager',
      authorRole: 'manager',
      content: 'Site A is consistently meeting targets. Good performance from the team.',
      timestamp: new Date().toISOString(),
      resolved: false
    },
    {
      id: 2,
      siteId: 2,
      type: 'issue',
      author: 'Manager',
      authorRole: 'manager',
      content: 'Site B showing declining performance. Need to investigate equipment issues.',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      resolved: false,
      priority: 'high'
    },
    {
      id: 3,
      siteId: 3,
      type: 'comment',
      author: 'Manager',
      authorRole: 'manager',
      content: 'Site C had weather delays yesterday. Performance should improve today.',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      resolved: true
    }
  ]
  saveData('comments', comments)

  // Mark demo data as loaded with version
  saveData('demoVersion', '4')

  console.log('Demo data loaded successfully!')
}