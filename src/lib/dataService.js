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
  // Sites
  getSites: async () => {
    if (isDemo) {
      return localDb.getData('sites') || []
    } else {
      const data = await firebaseDb.readData('sites')
      return data ? Object.values(data) : []
    }
  },

  saveSite: async (siteData) => {
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
      await firebaseDb.writeData(`sites/${id}`, siteData)
    }
  },

  // Trucks
  getTrucks: async () => {
    if (isDemo) {
      return localDb.getData('trucks') || []
    } else {
      const data = await firebaseDb.readData('trucks')
      return data ? Object.values(data) : []
    }
  },

  saveTruck: async (truckData) => {
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
      await firebaseDb.writeData(`trucks/${id}`, truckData)
    }
  },

  // Captures
  getCaptures: async () => {
    if (isDemo) {
      return localDb.getData('captures') || []
    } else {
      const data = await firebaseDb.readData('captures')
      return data ? Object.values(data) : []
    }
  },

  createCapture: async (captureData) => {
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
      const id = captureData.id || push(ref(database, 'captures')).key
      await set(ref(database, `captures/${id}`), { ...captureData, id })
      return { ...captureData, id }
    }
  },

  // Production
  getProduction: async () => {
    if (isDemo) {
      return localDb.getData('production') || []
    } else {
      const data = await firebaseDb.readData('production')
      return data ? Object.values(data) : []
    }
  },

  saveProduction: async (prodData) => {
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
      const id = prodData.id || push(ref(database, 'production')).key
      await set(ref(database, `production/${id}`), { ...prodData, id })
    }
  },

  // Submitted Days
  getSubmittedDays: async () => {
    if (isDemo) {
      return localDb.getData('submittedDays') || []
    } else {
      const data = await firebaseDb.readData('submittedDays')
      return data ? Object.values(data) : []
    }
  },

  saveSubmittedDay: async (dayData) => {
    if (isDemo) {
      const submitted = localDb.getData('submittedDays') || []
      localDb.saveData('submittedDays', [...submitted, dayData])
    } else {
      ensureDatabase();
      const subRef = ref(database, 'submittedDays')
      const newRef = push(subRef)
      await set(newRef, { ...dayData, id: newRef.key })
    }
  },

  // Subscriptions
  subscribeToCaptures: (callback) => {
    if (isDemo) {
      const data = localDb.getData('captures') || []
      callback(data)
      return () => {}
    } else {
      if (!database) {
        console.warn("Database not initialized, subscription skipped.");
        return () => {};
      }
      const capturesRef = ref(database, 'captures')
      const unsubscribe = onValue(capturesRef, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data))
      })
      return unsubscribe
    }
  },

  subscribeToProduction: (callback) => {
    if (isDemo) {
      const data = localDb.getData('production') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const prodRef = ref(database, 'production')
      const unsubscribe = onValue(prodRef, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data))
      })
      return unsubscribe
    }
  },

  subscribeToSubmittedDays: (callback) => {
    if (isDemo) {
      const data = localDb.getData('submittedDays') || []
      callback(data)
      return () => {}
    } else {
      if (!database) return () => {};
      const subRef = ref(database, 'submittedDays')
      const unsubscribe = onValue(subRef, (snapshot) => {
        const data = snapshot.val() || {}
        callback(Object.values(data))
      })
      return unsubscribe
    }
  },

  // Users
  getUsers: async () => {
    if (isDemo) {
      return localDb.getData('users') || []
    } else {
      const data = await firebaseDb.readData('users')
      return data ? Object.values(data) : []
    }
  },

  saveUser: async (userData) => {
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
      const id = userData.id || Date.now().toString()
      await firebaseDb.writeData(`users/${id}`, userData)
    }
  },

  // Projects
  getProjects: async () => {
    if (isDemo) {
      return localDb.getData('projects') || []
    } else {
      const data = await firebaseDb.readData('projects')
      return data ? Object.values(data) : []
    }
  },

  saveProject: async (projectData) => {
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
      await firebaseDb.writeData(`projects/${id}`, projectData)
    }
  },

  // Mines
  getMines: async () => {
    if (isDemo) {
      return localDb.getData('mines') || []
    } else {
      const data = await firebaseDb.readData('mines')
      return data ? Object.values(data) : []
    }
  },

  saveMine: async (mineData) => {
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
      await firebaseDb.writeData(`mines/${id}`, mineData)
    }
  },

  // Comments
  getComments: async () => {
    if (isDemo) {
      return localDb.getData('comments') || []
    } else {
      const data = await firebaseDb.readData('comments')
      return data ? Object.values(data) : []
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
  deleteSite: async (id) => {
    if (isDemo) {
      const sites = localDb.getData('sites') || []
      localDb.saveData('sites', sites.filter(s => s.id !== id))
    } else {
      await firebaseDb.deleteData(`sites/${id}`)
    }
  },

  deleteTruck: async (id) => {
    if (isDemo) {
      const trucks = localDb.getData('trucks') || []
      localDb.saveData('trucks', trucks.filter(t => t.id !== id))
    } else {
      await firebaseDb.deleteData(`trucks/${id}`)
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

  deleteProject: async (id) => {
    if (isDemo) {
      const projects = localDb.getData('projects') || []
      localDb.saveData('projects', projects.filter(p => p.id !== id))
    } else {
      await firebaseDb.deleteData(`projects/${id}`)
    }
  },

  deleteMine: async (id) => {
    if (isDemo) {
      const mines = localDb.getData('mines') || []
      localDb.saveData('mines', mines.filter(m => m.id !== id))
    } else {
      await firebaseDb.deleteData(`mines/${id}`)
    }
  },

  deleteCapture: async (id) => {
    if (isDemo) {
      const captures = localDb.getData('captures') || []
      localDb.saveData('captures', captures.filter(c => c.id !== id))
    } else {
      await firebaseDb.deleteData(`captures/${id}`)
    }
  }
}
