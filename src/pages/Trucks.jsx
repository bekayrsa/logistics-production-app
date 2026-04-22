import { useState, useEffect } from 'react'
import { getData, saveData } from '../utils/localStorage'

function Trucks({ currentUser }) {
  const [trucks, setTrucks] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    truckName: '',
    type: '23t',
    capacity: ''
  })

  useEffect(() => {
    if (!currentUser) return
    loadTrucks()
  }, [currentUser])

  const loadTrucks = () => {
    let storedTrucks = getData('trucks') || []
    if (currentUser.role === 'siteManager') {
      storedTrucks = storedTrucks.filter(truck => truck.siteId === currentUser.assignedSite)
    }
    setTrucks(storedTrucks)
  }

  const saveTrucks = (newTrucks) => {
    const allTrucks = getData('trucks') || []
    const otherTrucks = allTrucks.filter(truck => !newTrucks.some(nt => nt.id === truck.id))
    const updatedAll = [...otherTrucks, ...newTrucks]
    setTrucks(newTrucks)
    saveData('trucks', updatedAll)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentUser.role !== 'admin') return

    if (editingId !== null) {
      // Update existing
      const updatedTrucks = trucks.map(truck =>
        truck.id === editingId ? { ...truck, ...formData } : truck
      )
      saveTrucks(updatedTrucks)
      setEditingId(null)
    } else {
      // Add new
      const newTruck = {
        id: Date.now(),
        ...formData,
        siteId: 1, // Default
        siteName: 'Default Site',
        companyId: 1,
        status: 'Active'
      }
      saveTrucks([...trucks, newTruck])
    }
    setFormData({ truckName: '', type: 'ADT', capacity: '' })
  }

  const handleEdit = (truck) => {
    if (currentUser.role !== 'admin') return
    setEditingId(truck.id)
    setFormData({
      truckName: truck.truckName,
      type: truck.type,
      capacity: truck.capacity
    })
  }

  const handleDelete = (id) => {
    if (currentUser.role !== 'admin') return
    const updatedTrucks = trucks.filter(truck => truck.id !== id)
    saveTrucks(updatedTrucks)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ truckName: '', type: 'ADT', capacity: '' })
  }

  const getTruckTypeColor = (type) => {
    if (type === 'ADT') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (type === 'Heavy Truck') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  }

  const totalCapacity = trucks.reduce((sum, t) => sum + Number(t.capacity || 0), 0)

  if (!canView) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Fleet Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage trucks and vehicles across sites</p>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? '✎ Edit Truck' : '+ Add New Truck'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Truck Name</label>
              <input
                type="text"
                value={formData.truckName}
                onChange={(e) => setFormData({ ...formData, truckName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ADT">ADT</option>
                <option value="Heavy Truck">Heavy Truck</option>
                <option value="Medium Truck">Medium Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capacity (tons)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
              {editingId ? '✓ Update' : '+ Add'} Truck
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Fleet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Total Trucks</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{trucks.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-lg shadow border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">Total Capacity</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{totalCapacity}t</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 p-6 rounded-lg shadow border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Average Capacity</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{trucks.length > 0 ? Math.round(totalCapacity / trucks.length) : 0}t</p>
        </div>
      </div>

      {/* Trucks Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Truck Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {trucks.length > 0 ? trucks.map(truck => (
              <tr key={truck.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{truck.truckName}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTruckTypeColor(truck.type)}`}>
                    {truck.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{truck.capacity}t</td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    ✓ Active
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {canEdit && (
                    <>
                      <button onClick={() => handleEdit(truck)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mr-4">Edit</button>
                      <button onClick={() => handleDelete(truck.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <p className="font-medium">No trucks configured yet</p>
                  <p className="text-sm mt-1">Add your first truck using the form above</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default Trucks