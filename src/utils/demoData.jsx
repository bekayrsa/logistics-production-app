// (RS) Logistics Production App - Demo Data Engine
import { saveData } from './localStorage'

export function loadDemoData() {
  const COMPANY_ID = 'Company1';
  
  // 1. Company Metadata
  const company = { 
    id: COMPANY_ID, 
    name: 'Azania Mining Group', 
    description: 'South African Premier Production Management & Mining' 
  }
  saveData('company', company)

  // 2. Mines & Resources
  const mines = [
    { id: 1, name: 'Grootegeluk Complex', operation: 'Exxaro', resource: 'Coal', location: 'Lephalale, Limpopo', status: 'Active', companyId: COMPANY_ID },
    { id: 2, name: 'Mogalakwena North', operation: 'Anglo Platinum', resource: 'Platinum', location: 'Mokopane, Limpopo', status: 'Active', companyId: COMPANY_ID },
    { id: 3, name: 'Thaba Chrome', operation: 'Samancor', resource: 'Chrome', location: 'Steelpoort, Mpumalanga', status: 'Active', companyId: COMPANY_ID },
    { id: 4, name: 'Marikana West', operation: 'Sibanye-Stillwater', resource: 'Platinum', location: 'Rustenburg, North West', status: 'Active', companyId: COMPANY_ID }
  ]
  saveData('mines', mines)

  // 3. Sites
  const sites = [
    { id: 1, siteName: 'Coal Box Cut 2', resource: 'Coal', mineId: 1, dailyTarget: 15000, status: 'Active', companyId: COMPANY_ID },
    { id: 2, siteName: 'Coal Wash Plant Feed', resource: 'Coal', mineId: 1, dailyTarget: 9000, status: 'Active', companyId: COMPANY_ID },
    { id: 3, siteName: 'Platinum Open Pit 1', resource: 'Platinum', mineId: 2, dailyTarget: 5000, status: 'Active', companyId: COMPANY_ID },
    { id: 4, siteName: 'Platinum Tailings', resource: 'Platinum', mineId: 2, dailyTarget: 3200, status: 'Active', companyId: COMPANY_ID },
    { id: 5, siteName: 'Chrome Mine A', resource: 'Chrome', mineId: 3, dailyTarget: 4000, status: 'Active', companyId: COMPANY_ID },
    { id: 6, siteName: 'Chrome Recovery', resource: 'Chrome', mineId: 3, dailyTarget: 2500, status: 'Active', companyId: COMPANY_ID },
    { id: 7, siteName: 'Platinum Pit 3', resource: 'Platinum', mineId: 4, dailyTarget: 4500, status: 'Active', companyId: COMPANY_ID },
    { id: 8, siteName: 'Coal Stockpile 4', resource: 'Coal', mineId: 1, dailyTarget: 7000, status: 'Active', companyId: COMPANY_ID }
  ]
  saveData('sites', sites)

  // 4. Projects
  const projects = [
    { id: 1, projectName: 'Coal Expansion H1', mine: 'Grootegeluk Complex', status: 'Active', companyId: COMPANY_ID },
    { id: 2, projectName: 'Platinum Telemetry', mine: 'Mogalakwena North', status: 'Active', companyId: COMPANY_ID },
    { id: 3, projectName: 'Chrome Production Optimization', mine: 'Thaba Chrome', status: 'Active', companyId: COMPANY_ID }
  ]
  saveData('projects', projects)

  // 5. Trucks
  const trucks = [
    { id: 1, truckName: 'KOM-930E-01', type: 'Rigid Hauler', capacity: 290, status: 'Active', companyId: COMPANY_ID },
    { id: 2, truckName: 'KOM-930E-02', type: 'Rigid Hauler', capacity: 290, status: 'Active', companyId: COMPANY_ID },
    { id: 3, truckName: 'CAT-793F-10', type: 'Rigid Hauler', capacity: 240, status: 'Active', companyId: COMPANY_ID },
    { id: 4, truckName: 'VOL-A60H-21', type: 'ADT', capacity: 55, status: 'Active', companyId: COMPANY_ID },
    { id: 5, truckName: 'BEL-B50E-30', type: 'ADT', capacity: 50, status: 'Active', companyId: COMPANY_ID },
    { id: 6, truckName: 'TRK-COAL-01', type: 'Tippertruck', capacity: 35, status: 'Active', companyId: COMPANY_ID },
    { id: 7, truckName: 'TRK-PLAT-01', type: 'ADT', capacity: 45, status: 'Active', companyId: COMPANY_ID },
    { id: 8, truckName: 'TRK-CHRO-01', type: 'Rigid Hauler', capacity: 100, status: 'Active', companyId: COMPANY_ID }
  ]
  saveData('trucks', trucks)

  // 6. Users (Synced to Company1 and Master)
  const users = [
    // Super Admin (Master Oversight)
    { 
      id: 'super_admin', 
      name: 'System', 
      surname: 'Owner', 
      email: 'boiketloramoabi@gmail.com', 
      role: 'superAdmin', 
      companyId: 'master' 
    },
    // Company1 Admin
    { 
      id: 'company1_admin', 
      name: 'Bekay', 
      surname: 'RSA', 
      email: 'bekayrsa@gmail.com', 
      role: 'admin', 
      companyId: COMPANY_ID 
    },
    // Managers
    { id: 'mgr_1', name: 'Sipho Gumede', email: 'sipho.g@miningsense.com', role: 'manager', companyId: COMPANY_ID },
    // Site Managers
    { id: 'sm_1', name: 'Mandla Dlamini', email: 'mandla.d@miningsense.com', role: 'siteManager', assignedSite: 1, assignedSites: { "1": true }, companyId: COMPANY_ID }
  ]
  saveData('users', users)

  // 7. Production History
  const productionData = []
  const today = new Date()
  let prodId = 1

  for (let i = 31; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    sites.forEach(site => {
      const target = site.dailyTarget
      const varianceFactor = 0.85 + Math.random() * 0.3
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
        variance: Math.round(((actual - target) / target) * 100),
        companyId: COMPANY_ID
      })
    })
  }
  saveData('production', productionData)

  // 8. Recent Captures
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
      timestamp: new Date(new Date().getTime() - Math.random() * 3600000 * 12).toISOString(),
      companyId: COMPANY_ID
    })
  }
  saveData('captures', captures)

  saveData('demoVersion', '7.0_MultiTenant_ZA')
  console.log('Demo Data Synchronized: Multi-Tenant siloes active.')
}