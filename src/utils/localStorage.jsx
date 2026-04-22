// LocalStorage helpers for Production Management app

/**
 * Save data to localStorage
 * @param {string} key - The key to store the data under
 * @param {*} data - The data to store (will be JSON stringified)
 */
export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving data to localStorage:', error)
  }
}

/**
 * Get data from localStorage
 * @param {string} key - The key to retrieve the data from
 * @returns {*} The parsed data, or null if not found or error
 */
export function getData(key) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('Error getting data from localStorage:', error)
    return null
  }
}

/**
 * Update data in localStorage using an updater function
 * @param {string} key - The key of the data to update
 * @param {function} updater - Function that takes current data and returns updated data
 */
export function updateData(key, updater) {
  try {
    const currentData = getData(key)
    const updatedData = updater(currentData)
    saveData(key, updatedData)
  } catch (error) {
    console.error('Error updating data in localStorage:', error)
  }
}

/**
 * Delete data from localStorage
 * @param {string} key - The key to delete
 */
export function deleteData(key) {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error deleting data from localStorage:', error)
  }
}