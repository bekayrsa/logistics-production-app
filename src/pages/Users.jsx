import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'

function Users({ currentUser }) {
  const [users, setUsers] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'siteManager',
    assignedSite: ''
  })

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager'
  const canEdit = currentUser?.role === 'admin'

  const loadUsers = async () => {
    const allUsers = await dataService.getUsers()
    setUsers(allUsers)
  }

  useEffect(() => {
    if (!canView) return
    loadUsers()
  }, [currentUser])

  const handleSubmit = async (e) => {
    if (!canEdit) return
    e.preventDefault()
    
    const userData = {
      ...formData,
      id: isEditing ? editingUser.id : (formData.email.replace(/\./g, '_')),
      companyId: 1
    }

    await dataService.saveUser(userData)
    
    setIsEditing(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'siteManager', assignedSite: '' })
    loadUsers()
  }

  const handleEdit = (user) => {
    if (!canEdit) return
    setIsEditing(true)
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      assignedSite: user.assignedSite || ''
    })
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // In a real production app, we would have a deleteUser method in dataService
      // For now, we'll implement a soft delete or ignore if not available
      alert('Delete functionality is being integrated into the production environment.')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'siteManager', assignedSite: '' })
  }

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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage user accounts and roles</p>
      </div>

      {/* Add/Edit Form */}
      {canEdit && (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit User' : 'Add New User'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Company Admin</option>
                <option value="manager">Manager</option>
                <option value="siteManager">Site Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Site (for Site Managers)
              </label>
              <input
                type="number"
                value={formData.assignedSite}
                onChange={(e) => setFormData({...formData, assignedSite: e.target.value ? parseInt(e.target.value) : ''})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for Admin/Manager"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'Update User' : 'Add User'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Site
                </th>
                {canEdit && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Company Admin' :
                       user.role === 'manager' ? 'Manager' : 'Site Manager'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.assignedSite || '-'}
                  </td>
                  {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Users