// (RS) Logistics Production App
import { APP_MODE } from '../config'
import * as localDb from '../utils/localStorage'
import * as firebaseDb from './db'
import { database } from './firebase'
import { ref, onValue, push, set } from 'firebase/database'

const isDemo = APP_MODE === 'demo'

const ensureDatabase = () => {
  if (!database) {
    throw new Error("Firebase Database is not initialized. Please configure your API key.");
  }
};

export const dataService = {
  // Helper to build tenant-specific paths
  getPath: (node, companyId) => {
    // Users are global but filtered in the API layer for multi-tenancy
    if (node === 'users' || node === 'companies') return node;
    if (!companyId) return node;
    return `companies/${companyId}/${node}`;
  },

  // (RS) Audit Logging System
  logAudit: async (event) => {
    const { companyId, user, action, entityType, entityId, oldValue, newValue } = event
    if (!companyId) return
    
    const auditData = {
      timestamp: new Date().toISOString(),
      performedBy: {
        uid: user.uid,
        email: user.email,
        name: `${user.name || ''} ${user.surname || ''}`.trim()
      },
      action, // 'CREATE' | 'UPDATE' | 'DELETE'
      entityType, // 'CAPTURE' | 'USER' | 'SITE' | etc
      entityId,
      oldValue: oldValue || null,
      newValue: newValue || null
    }

    if (isDemo) {
      const current = localDb.getData(`auditLogs_${companyId}`) || []
      localDb.saveData(`auditLogs_${companyId}`, [auditData, ...current].slice(0, 500))
    } else {
      const path = `companies/${companyId}/auditLogs`
      await firebaseDb.pushData(path, auditData)
    }
  },

  getAuditLogs: async (companyId) => {
    if (isDemo) return localDb.getData(`auditLogs_${companyId}`) || []
    const data = await firebaseDb.readData(`companies/${companyId}/auditLogs`)
    return data ? Object.values(data).reverse() : []
  },

  // Company Info
  getCompanyInfo: async (companyId) => {
    if (isDemo) {
      return localDb.getData(`companyInfo_${companyId || 'default'}`) || { companyName: 'Production Management Pro' }
    } else {
      const path = dataService.getPath('companyInfo', companyId)
      const data = await firebaseDb.readData(path)
      return data || { companyName: 'New Company' }
    }
  },

  saveCompanyInfo: async (info, companyId) => {
    if (isDemo) {
      localDb.saveData(`companyInfo_${companyId || 'default'}`, info)
    } else {
      const path = dataService.getPath('companyInfo', companyId)
      await firebaseDb.writeData(path, info)
    }
  },

  // (RS) SuperAdmin: Company Management
  getCompanies: async () => {
    if (isDemo) return localDb.getData('companies') || []
    const data = await firebaseDb.readData('companies')
    return data ? Object.values(data).filter(Boolean) : []
  },

  saveCompany: async (companyData) => {
    const id = companyData.id || `comp_${Date.now()}`
    const data = { ...companyData, id }
    if (isDemo) {
      const current = localDb.getData('companies') || []
      const index = current.findIndex(c => c.id === id)
      const next = index > -1
        ? current.map(c => c.id === id ? data : c)
        : [...current, data]
      localDb.saveData('companies', next)
    } else {
      await firebaseDb.writeData(`companies/${id}`, data)
    }
    return data
  },

  deleteCompany: async (companyId) => {
    if (isDemo) {
      const current = localDb.getData('companies') || []
      localDb.saveData('companies', current.filter(c => c.id !== companyId))
    } else {
      await firebaseDb.deleteData(`companies/${companyId}`)
    }
  },

  // Sites
  getSites: async (companyId) => {
    if (isDemo) {
      return localDb.getData('sites') || []
    } else {
      const data = await firebaseDb.readData(dataService.getPath('sites', companyId))
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  saveSite: async (siteData, companyId) => {
    if (isDemo) {
      const sites = localDb.getData('sites') || []
      const index = sites.findIndex(s => s.id === siteData.id)
      if (index > -1) {
        sites[index] = siteData
        localDb.saveData('sites', sites)
      } else {
        localDb.saveData('sites', [...sites, siteData])
      }
    } else {
      const id = siteData.id || Date.now().toString()
      await firebaseDb.writeData(dataService.getPath(`sites/${id}`, companyId), siteData)
    }
  },

  // Trucks
  getTrucks: async (companyId) => {
    if (isDemo) {
      return localDb.getData('trucks') || []
    } else {
      const data = await firebaseDb.readData(dataService.getPath('trucks', companyId))
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  saveTruck: async (truckData, companyId) => {
    if (isDemo) {
      const trucks = localDb.getData('trucks') || []
      const index = trucks.findIndex(t => t.id === truckData.id)
      if (index > -1) {
        trucks[index] = truckData
        localDb.saveData('trucks', trucks)
      } else {
        localDb.saveData('trucks', [...trucks, truckData])
      }
    } else {
      const id = truckData.id || Date.now().toString()
      await firebaseDb.writeData(dataService.getPath(`trucks/${id}`, companyId), truckData)
    }
  },

  // Captures
  getCaptures: async (companyId) => {
    if (isDemo) {
      return localDb.getData('captures') || []
    } else {
      const data = await firebaseDb.readData(dataService.getPath('captures', companyId))
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  createCapture: async (captureData, companyId) => {
    if (isDemo) {
      const captures = localDb.getData('captures') || []
      if (captureData.id) {
        const index = captures.findIndex(c => c.id === captureData.id)
        if (index > -1) {
          captures[index] = captureData
          localDb.saveData('captures', captures)
          return captureData
        }
      }
      const newCapture = { ...captureData, id: Date.now() }
      localDb.saveData('captures', [...captures, newCapture])
      return newCapture
    } else {
      ensureDatabase();
      const id = captureData.id || push(ref(database, dataService.getPath('captures', companyId))).key
      const extendedData = {
        ...captureData,
        id,
        captureID: id,
        capturedBy: captureData.userName,
        capturedResources: captureData.resource || 'Coal',
        captureTime: new Date().toISOString(),
        captureLoad: captureData.tons
      }
      await set(ref(database, dataService.getPath(`captures/${id}`, companyId)), extendedData)
      return extendedData
    }
  },

  saveCapture: async (captureData, companyId, currentUser) => {
    // Get old value for audit trail
    let oldVal = null
    if (captureData.id) {
       oldVal = await dataService.getCapture(captureData.id, companyId)
    }

    if (isDemo) {
      const captures = localDb.getData('captures') || []
      const index = captures.findIndex(c => c.id === captureData.id)
      if (index > -1) {
        captures[index] = captureData
        localDb.saveData('captures', captures)
      } else {
        localDb.saveData('captures', [...captures, captureData])
      }
    } else {
      const id = captureData.id || Date.now().toString()
      await firebaseDb.writeData(dataService.getPath(`captures/${id}`, companyId), captureData)
    }

    // Record Audit Event
    if (currentUser) {
      dataService.logAudit({
        companyId,
        user: currentUser,
        action: captureData.id ? 'UPDATE' : 'CREATE',
        entityType: 'CAPTURE',
        entityId: captureData.id || 'new',
        oldValue: oldVal,
        newValue: captureData
      })
    }
  },

  // Production
  getProduction: async (companyId) => {
    if (isDemo) {
      return localDb.getData('production') || []
    } else {
      const data = await firebaseDb.readData(dataService.getPath('production', companyId))
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  saveProduction: async (prodData, companyId) => {
    if (isDemo) {
      const production = localDb.getData('production') || []
      const index = production.findIndex(p => p.id === prodData.id)
      if (index > -1) {
        production[index] = prodData
        localDb.saveData('production', production)
      } else {
        localDb.saveData('production', [...production, prodData])
      }
    } else {
      ensureDatabase();
      const id = prodData.id || push(ref(database, dataService.getPath('production', companyId))).key
      await set(ref(database, dataService.getPath(`production/${id}`, companyId)), { ...prodData, id })
    }
  },

  // Submitted Days
  getSubmittedDays: async () => {
    if (isDemo) {
      return localDb.getData('submittedDays') || []
    } else {
      const data = await firebaseDb.readData('submittedDays')
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  saveSubmittedDay: async (dayData, companyId) => {
    if (isDemo) {
      const submitted = localDb.getData('submittedDays') || []
      localDb.saveData('submittedDays', [...submitted, dayData])
    } else {
      ensureDatabase();
      const subRef = ref(database, dataService.getPath('submittedDays', companyId))
      const newRef = push(subRef)
      await set(newRef, { ...dayData, id: newRef.key })
    }
  },

  // Subscriptions
  subscribeToCaptures: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('captures') || []
      callback(data)
      return () => {}
    } else {
      if (!database) {
        console.warn("Database not initialized, subscription skipped.");
        return () => {};
      }
      const capturesRef = ref(database, dataService.getPath('captures', companyId))
      const unsubscribe = onValue(capturesRef, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  subscribeToProduction: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('production') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const prodRef = ref(database, dataService.getPath('production', companyId))
      const unsubscribe = onValue(prodRef, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  subscribeToSubmittedDays: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('submittedDays') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const subRef = ref(database, dataService.getPath('submittedDays', companyId))
      const unsubscribe = onValue(subRef, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  subscribeToSites: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('sites') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const refNode = ref(database, dataService.getPath('sites', companyId))
      const unsubscribe = onValue(refNode, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  subscribeToTrucks: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('trucks') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const refNode = ref(database, dataService.getPath('trucks', companyId))
      const unsubscribe = onValue(refNode, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  subscribeToUsers: (callback, companyId, isSuperAdmin = false) => {
    if (isDemo) {
      const data = localDb.getData('users') || []
      const filtered = isSuperAdmin ? data : data.filter(u => u.companyId === companyId)
      callback(filtered)
      return () => {}
    } else {
      if (!database) return () => {};
      const refNode = ref(database, 'users')
      const unsubscribe = onValue(refNode, (snapshot) => {
        const data = snapshot.val() || {}
        const allUsers = Object.values(data).filter(Boolean)
        const filtered = isSuperAdmin ? allUsers : allUsers.filter(u => u.companyId === companyId)
        callback(filtered)
      })
      return unsubscribe
    }
  },

  subscribeToProjects: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('projects') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const refNode = ref(database, dataService.getPath('projects', companyId))
      const unsubscribe = onValue(refNode, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  subscribeToMines: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('mines') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const refNode = ref(database, dataService.getPath('mines', companyId))
      const unsubscribe = onValue(refNode, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  subscribeToComments: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('comments') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const refNode = ref(database, dataService.getPath('comments', companyId))
      const unsubscribe = onValue(refNode, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  // Users
  getUsers: async (companyId, isSuperAdmin = false) => {
    if (isDemo) {
      const data = localDb.getData('users') || []
      return isSuperAdmin ? data : data.filter(u => u.companyId === companyId)
    } else {
      const data = await firebaseDb.readData('users')
      const allUsers = data ? Object.values(data).filter(Boolean) : []
      return isSuperAdmin ? allUsers : allUsers.filter(u => u.companyId === companyId)
    }
  },

  saveUser: async (userData, companyId, currentUser) => {
    if (isDemo) {
      const users = localDb.getData('users') || []
      const index = users.findIndex(u => u.id === userData.id)
      if (index > -1) {
        users[index] = userData
        localDb.saveData('users', users)
      } else {
        localDb.saveData('users', [...users, userData])
      }
    } else {
      const id = userData.id || userData.email.replace(/[@.]/g, '_')
      await firebaseDb.writeData(`users/${id}`, userData)
    }

    // Record Audit Event
    if (currentUser && companyId) {
       dataService.logAudit({
         companyId,
         user: currentUser,
         action: 'SAVE_USER',
         entityType: 'USER',
         entityId: userData.id || userData.email,
         newValue: userData
       })
    }
  },

  // Projects
  getProjects: async (companyId) => {
    if (isDemo) {
      return localDb.getData('projects') || []
    } else {
      const data = await firebaseDb.readData(dataService.getPath('projects', companyId))
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  saveProject: async (projectData, companyId) => {
    if (isDemo) {
      const projects = localDb.getData('projects') || []
      const index = projects.findIndex(p => p.id === projectData.id)
      if (index > -1) {
        projects[index] = projectData
        localDb.saveData('projects', projects)
      } else {
        localDb.saveData('projects', [...projects, projectData])
      }
    } else {
      const id = projectData.id || Date.now().toString()
      await firebaseDb.writeData(dataService.getPath(`projects/${id}`, companyId), projectData)
    }
  },

  // Mines
  getMines: async (companyId) => {
    if (isDemo) {
      return localDb.getData('mines') || []
    } else {
      const data = await firebaseDb.readData(dataService.getPath('mines', companyId))
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  saveMine: async (mineData, companyId) => {
    if (isDemo) {
      const mines = localDb.getData('mines') || []
      const index = mines.findIndex(m => m.id === mineData.id)
      if (index > -1) {
        mines[index] = mineData
        localDb.saveData('mines', mines)
      } else {
        localDb.saveData('mines', [...mines, mineData])
      }
    } else {
      const id = mineData.id || Date.now().toString()
      await firebaseDb.writeData(dataService.getPath(`mines/${id}`, companyId), mineData)
    }
  },

  // Comments
  getComments: async () => {
    if (isDemo) {
      return localDb.getData('comments') || []
    } else {
      const data = await firebaseDb.readData('comments')
      return data ? Object.values(data).filter(Boolean) : []
    }
  },

  saveComment: async (commentData) => {
    if (isDemo) {
      const comments = localDb.getData('comments') || []
      const index = comments.findIndex(c => c.id === commentData.id)
      if (index > -1) {
        comments[index] = commentData
        localDb.saveData('comments', comments)
      } else {
        localDb.saveData('comments', [...comments, commentData])
      }
    } else {
      const id = commentData.id || Date.now().toString()
      await firebaseDb.writeData(`comments/${id}`, commentData)
    }
  },

  // Connection Monitoring
  onConnectionChange: (callback) => {
    if (isDemo) {
      callback(true)
      return () => {}
    } else {
      if (!database) {
        callback(false);
        return () => {};
      }
      const connectedRef = ref(database, '.info/connected')
      const unsubscribe = onValue(connectedRef, (snap) => {
        callback(snap.val() === true)
      })
      return unsubscribe
    }
  },

  // Seeding
  seedDatabase: async (data) => {
    if (isDemo) return;
    ensureDatabase();
    for (const key of Object.keys(data)) {
      await set(ref(database, key), data[key]);
    }
  },

  // Delete Operations
  deleteSite: async (id, companyId) => {
    if (isDemo) {
      const sites = localDb.getData('sites') || []
      localDb.saveData('sites', sites.filter(s => s.id !== id))
    } else {
      await firebaseDb.deleteData(dataService.getPath(`sites/${id}`, companyId))
    }
  },

  deleteTruck: async (id, companyId) => {
    if (isDemo) {
      const trucks = localDb.getData('trucks') || []
      localDb.saveData('trucks', trucks.filter(t => t.id !== id))
    } else {
      await firebaseDb.deleteData(dataService.getPath(`trucks/${id}`, companyId))
    }
  },

  deleteUser: async (id) => {
    if (isDemo) {
      const users = localDb.getData('users') || []
      localDb.saveData('users', users.filter(u => u.id !== id))
    } else {
      await firebaseDb.deleteData(`users/${id}`)
    }
  },

  deleteProject: async (id, companyId) => {
    if (isDemo) {
      const projects = localDb.getData('projects') || []
      localDb.saveData('projects', projects.filter(p => p.id !== id))
    } else {
      await firebaseDb.deleteData(dataService.getPath(`projects/${id}`, companyId))
    }
  },

  deleteMine: async (id, companyId) => {
    if (isDemo) {
      const mines = localDb.getData('mines') || []
      localDb.saveData('mines', mines.filter(m => m.id !== id))
    } else {
      await firebaseDb.deleteData(dataService.getPath(`mines/${id}`, companyId))
    }
  },

  deleteCapture: async (id, companyId) => {
    if (isDemo) {
      const captures = localDb.getData('captures') || []
      localDb.saveData('captures', captures.filter(c => c.id !== id))
    } else {
      await firebaseDb.deleteData(dataService.getPath(`captures/${id}`, companyId))
    }
  },

  // Briefings (Performance Briefings)
  subscribeToBriefings: (callback, companyId) => {
    if (isDemo) {
      const data = localDb.getData('briefings') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const refNode = ref(database, dataService.getPath('briefings', companyId))
      const unsubscribe = onValue(refNode, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data).filter(Boolean))
      })
      return unsubscribe
    }
  },

  saveBriefing: async (briefingData, companyId) => {
    const id = briefingData.id || Date.now().toString()
    const finalData = {
      ...briefingData,
      id,
      timestamp: briefingData.timestamp || Date.now(),
      status: briefingData.status || 'open',
      replies: briefingData.replies || []
    }
    if (isDemo) {
      const briefings = localDb.getData('briefings') || []
      const index = briefings.findIndex(b => b.id === id)
      if (index > -1) {
        briefings[index] = finalData
        localDb.saveData('briefings', briefings)
      } else {
        localDb.saveData('briefings', [...briefings, finalData])
      }
    } else {
      await firebaseDb.writeData(dataService.getPath(`briefings/${id}`, companyId), finalData)
    }
  },

  addReplyToBriefing: async (briefingId, reply, companyId) => {
    if (isDemo) {
      const briefings = localDb.getData('briefings') || []
      const index = briefings.findIndex(b => b.id === briefingId)
      if (index > -1) {
        const briefing = briefings[index]
        briefing.replies = [...(briefing.replies || []), { ...reply, timestamp: Date.now() }]
        localDb.saveData('briefings', briefings)
      }
    } else {
      const briefings = await firebaseDb.readData(dataService.getPath('briefings', companyId))
      if (briefings && briefings[briefingId]) {
        const briefing = briefings[briefingId]
        const updatedReplies = [...(briefing.replies || []), { ...reply, timestamp: Date.now() }]
        await firebaseDb.writeData(dataService.getPath(`briefings/${briefingId}/replies`, companyId), updatedReplies)
      }
    }
  },

  resolveBriefing: async (briefingId, companyId) => {
    if (isDemo) {
      const briefings = localDb.getData('briefings') || []
      const index = briefings.findIndex(b => b.id === briefingId)
      if (index > -1) {
        briefings[index].status = 'resolved'
        localDb.saveData('briefings', briefings)
      }
    } else {
      await firebaseDb.writeData(dataService.getPath(`briefings/${briefingId}/status`, companyId), 'resolved')
    }
  },
}
