const fs = require('fs');

const sites = [
  { id: 'site_001', siteName: 'Pit Alpha', resource: 'Coal', dailyTarget: 1200 },
  { id: 'site_002', siteName: 'Pit Bravo', resource: 'Coal', dailyTarget: 800 },
  { id: 'site_003', siteName: 'Silo 9 East', resource: 'Coal', dailyTarget: 1500 }
];

const trucks = [
  { id: 't_01', truckName: 'Volvo A40-1', capacity: 40, type: 'ADT' },
  { id: 't_02', truckName: 'Volvo A40-2', capacity: 40, type: 'ADT' },
  { id: 't_03', truckName: 'CAT 777-1', capacity: 90, type: 'RDT' },
  { id: 't_04', truckName: 'CAT 777-2', capacity: 90, type: 'RDT' },
  { id: 't_05', truckName: 'Bell B50-1', capacity: 50, type: 'ADT' }
];

const data = {
  users: {
    "boiketloramoabi_gmail_com": {
      "name": "Super", "surname": "Admin", "email": "boiketloramoabi@gmail.com", "role": "admin", "companyId": "master"
    },
    "bekayrsa_gmail_com": {
      "name": "Bekay", "surname": "RSA", "email": "bekayrsa@gmail.com", "role": "admin", "companyId": "Company1"
    },
    "manager_company1_com": {
      "name": "John", "surname": "Operations", "email": "manager@company1.com", "role": "manager", "companyId": "Company1"
    },
    "alpha_manager_company1_com": {
      "name": "Sarah", "surname": "Pit-Lead", "email": "alpha.manager@company1.com", "role": "siteManager", "companyId": "Company1",
      "assignedSites": { "site_001": true }
    },
    "multi_manager_company1_com": {
      "name": "Mike", "surname": "Multi-Lead", "email": "multi.manager@company1.com", "role": "siteManager", "companyId": "Company1",
      "assignedSites": { "site_002": true, "site_003": true }
    }
  },
  companies: {
    "Company1": {
      sites: {},
      trucks: {},
      production: {},
      captures: {}
    }
  }
};

// Populate Sites & Trucks
sites.forEach(s => data.companies.Company1.sites[s.id] = { ...s, status: 'Active' });
trucks.forEach(t => data.companies.Company1.trucks[t.id] = { ...t, status: 'Active' });

// Generate 90 Days of Data
const days = 90;
const today = new Date();

for (let i = 0; i < days; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];

  sites.forEach(site => {
    // Determine daily production (with some randomness)
    const target = site.dailyTarget;
    // 70% chance of being on target, 30% chance of variance
    const performanceFactor = Math.random() > 0.3 ? (0.95 + Math.random() * 0.15) : (0.6 + Math.random() * 0.35);
    const actual = Math.round(target * performanceFactor);
    const variance = Math.round(((actual - target) / target) * 100);
    const status = actual >= target ? 'On Target' : 'Below Target';
    
    const prodId = `p_${site.id}_${i}`;
    data.companies.Company1.production[prodId] = {
      id: prodId,
      date: dateStr,
      siteId: site.id,
      siteName: site.siteName,
      actual,
      target,
      variance,
      status,
      trucksUsed: Math.floor(Math.random() * 3) + 2
    };

    // Generate specific captures for this site/day
    let remainingTons = actual;
    let capIndex = 0;
    const captureUsers = [
      { name: 'Sarah Pit-Lead', email: 'alpha.manager@company1.com', sites: ['site_001'] },
      { name: 'Mike Multi-Lead', email: 'multi.manager@company1.com', sites: ['site_002', 'site_003'] },
      { name: 'Bekay RSA', email: 'bekayrsa@gmail.com', sites: ['site_001', 'site_002', 'site_003'] }
    ];

    while (remainingTons > 0) {
      const truck = trucks[Math.floor(Math.random() * trucks.length)];
      const loads = Math.min(Math.floor(remainingTons / truck.capacity) + 1, 10);
      const tons = loads * truck.capacity;
      
      const user = captureUsers.filter(u => u.sites.includes(site.id))[Math.floor(Math.random() * captureUsers.filter(u => u.sites.includes(site.id)).length)];
      
      const capId = `cap_${site.id}_${i}_${capIndex}`;
      data.companies.Company1.captures[capId] = {
        id: capId,
        date: dateStr,
        siteId: site.id,
        siteName: site.siteName,
        truckId: truck.id,
        truckName: truck.truckName,
        loads,
        tons,
        userName: user.name,
        userId: user.email.replace(/[@.]/g, '_'),
        timestamp: date.getTime() + (capIndex * 3600000)
      };
      
      remainingTons -= tons;
      capIndex++;
    }
  });
}

fs.writeFileSync('seed_data_extended.json', JSON.stringify(data, null, 2));
console.log('90-day extended dataset generated successfully: seed_data_extended.json');
