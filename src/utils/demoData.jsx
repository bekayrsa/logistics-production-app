// Demo data generator for Production Management app - South African Mining Standards
import { saveData } from './localStorage'

export function loadDemoData() {
  // 1. Mines & Resources (Coal, Chrome, Platinum)
  const company = { id: 1, name: 'Azania Mining Group', description: 'South African Premier Production Management & Mining' }
  saveData('company', company)

  const mines = [
    { id: 1, name: 'Grootegeluk Complex', operation: 'Exxaro', resource: 'Coal', location: 'Lephalale, Limpopo', status: 'Active' },
    { id: 2, name: 'Mogalakwena North', operation: 'Anglo Platinum', resource: 'Platinum', location: 'Mokopane, Limpopo', status: 'Active' },
    { id: 3, name: 'Thaba Chrome', operation: 'Samancor', resource: 'Chrome', location: 'Steelpoort, Mpumalanga', status: 'Active' },
    { id: 4, name: 'Marikana West', operation: 'Sibanye-Stillwater', resource: 'Platinum', location: 'Rustenburg, North West', status: 'Active' }
  ]
  saveData('mines', mines)

  // 2. Sites (8 Sites focused on Coal, Chrome, Platinum)
  const sites = [
    { id: 1, siteName: 'Coal Box Cut 2', resource: 'Coal', mineId: 1, dailyTarget: 15000, status: 'Active' },
    { id: 2, siteName: 'Coal Wash Plant Feed', resource: 'Coal', mineId: 1, dailyTarget: 9000, status: 'Active' },
    { id: 3, siteName: 'Platinum Open Pit 1', resource: 'Platinum', mineId: 2, dailyTarget: 5000, status: 'Active' },
    { id: 4, siteName: 'Platinum Tailings', resource: 'Platinum', mineId: 2, dailyTarget: 3200, status: 'Active' },
    { id: 5, siteName: 'Chrome Mine A', resource: 'Chrome', mineId: 3, dailyTarget: 4000, status: 'Active' },
    { id: 6, siteName: 'Chrome Recovery', resource: 'Chrome', mineId: 3, dailyTarget: 2500, status: 'Active' },
    { id: 7, siteName: 'Platinum Pit 3', resource: 'Platinum', mineId: 4, dailyTarget: 4500, status: 'Active' },
    { id: 8, siteName: 'Coal Stockpile 4', resource: 'Coal', mineId: 1, dailyTarget: 7000, status: 'Active' }
  ]
  saveData('sites', sites)

  // 3. Projects
  const projects = [
    { id: 1, projectName: 'Coal Expansion H1', mine: 'Grootegeluk Complex', status: 'Active' },
    { id: 2, projectName: 'Platinum Telemetry', mine: 'Mogalakwena North', status: 'Active' },
    { id: 3, projectName: 'Chrome Production Optimization', mine: 'Thaba Chrome', status: 'Active' }
  ]
  saveData('projects', projects)

  // 4. Trucks
  const trucks = [
    { id: 1, truckName: 'KOM-930E-01', type: 'Rigid Hauler', capacity: 290, status: 'Active' },
    { id: 2, truckName: 'KOM-930E-02', type: 'Rigid Hauler', capacity: 290, status: 'Active' },
    { id: 3, truckName: 'CAT-793F-10', type: 'Rigid Hauler', capacity: 240, status: 'Active' },
    { id: 4, truckName: 'VOL-A60H-21', type: 'ADT', capacity: 55, status: 'Active' },
    { id: 5, truckName: 'BEL-B50E-30', type: 'ADT', capacity: 50, status: 'Active' },
    { id: 6, truckName: 'TRK-COAL-01', type: 'Tippertruck', capacity: 35, status: 'Active' },
    { id: 7, truckName: 'TRK-PLAT-01', type: 'ADT', capacity: 45, status: 'Active' },
    { id: 8, truckName: 'TRK-CHRO-01', type: 'Rigid Hauler', capacity: 100, status: 'Active' },
    { id: 9, truckName: 'MACK-G6-01', type: 'Tippertruck', capacity: 30, status: 'Active' },
    { id: 10, truckName: 'BEL-B45E-01', type: 'ADT', capacity: 41, status: 'Active' },
    { id: 11, truckName: 'KOM-830E-01', type: 'Rigid Hauler', capacity: 220, status: 'Active' },
    { id: 12, truckName: 'CAT-777G-01', type: 'Rigid Hauler', capacity: 90, status: 'Active' },
    { id: 13, truckName: 'VOL-A45G-01', type: 'ADT', capacity: 41, status: 'Active' },
    { id: 14, truckName: 'TRK-LOGI-05', type: 'Tippertruck', capacity: 28, status: 'Active' },
    { id: 15, truckName: 'TRK-LOGI-06', type: 'Tippertruck', capacity: 28, status: 'Active' },
    { id: 16, truckName: 'KOM-HD785-01', type: 'Rigid Hauler', capacity: 91, status: 'Active' },
    { id: 17, truckName: 'BEL-B60E-01', type: 'ADT', capacity: 55, status: 'Active' },
    { id: 18, truckName: 'CAT-789D-01', type: 'Rigid Hauler', capacity: 181, status: 'Active' },
    { id: 19, truckName: 'TRK-HAUL-09', type: 'ADT', capacity: 45, status: 'Active' },
    { id: 20, truckName: 'TRK-HAUL-10', type: 'ADT', capacity: 45, status: 'Active' }
  ]
  saveData('trucks', trucks)

  // 5. Users (Employees: 2 Managers, Multiple Site Managers)
  const users = [
    { id: 1, name: 'System Admin', email: 'boiketloramaobi@gmail.com', role: 'admin' },
    // Managers
    { id: 2, name: 'Sipho Gumede', email: 'sipho.g@miningsense.com', role: 'manager' },
    { id: 3, name: 'Adrienne Smith', email: 'adrienne.s@miningsense.com', role: 'manager' },
    // Site Managers
    { id: 4, name: 'Mandla Dlamini', email: 'mandla.d@miningsense.com', role: 'siteManager', assignedSite: 1 },
    { id: 5, name: 'Thabo Mbeki', email: 'thabo.m@miningsense.com', role: 'siteManager', assignedSite: 2 },
    { id: 6, name: 'Lerato Molefe', email: 'lerato.m@miningsense.com', role: 'siteManager', assignedSite: 3 },
    { id: 7, name: 'Pieter Burger', email: 'pieter.b@miningsense.com', role: 'siteManager', assignedSite: 5 },
    { id: 8, name: 'Nomvula Zulu', email: 'nomvula.z@miningsense.com', role: 'siteManager', assignedSite: 7 }
  ]
  saveData('users', users)

  // 6. Production History (31 Days)
  const productionData = []
  const today = new Date()
  let prodId = 1

  for (let i = 31; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    sites.forEach(site => {
      const target = site.dailyTarget
      const varianceFactor = 0.85 + Math.random() * 0.3 // 85% to 115%
      const actual = Math.round(target * varianceFactor)
      
      productionData.push({
        id: prodId++,
        date: dateStr,
        siteId: site.id,
        siteName: site.siteName,
        target,
        actual,
        totalTons: actual,
        status: actual >= target ? 'On Target' : 'Below Target',
        variance: Math.round(((actual - target) / target) * 100)
      })
    })
  }
  saveData('production', productionData)

  // 7. Recent Captures (24 captures)
  const captures = []
  const todayStr = today.toISOString().split('T')[0]
  for (let j = 1; j <= 24; j++) {
    const site = sites[Math.floor(Math.random() * sites.length)]
    const truck = trucks[Math.floor(Math.random() * trucks.length)]
    const loads = Math.floor(Math.random() * 8) + 1
    
    captures.push({
      id: j,
      date: todayStr,
      siteId: site.id,
      siteName: site.siteName,
      truckId: truck.id,
      truckName: truck.truckName,
      loads,
      tons: loads * truck.capacity,
      timestamp: new Date(new Date().getTime() - Math.random() * 3600000 * 12).toISOString()
    })
  }
  saveData('captures', captures)

  saveData('demoVersion', '6.0_ZA_Employees')
  console.log('Demo Data Updated: Resources and Employees set.')
}