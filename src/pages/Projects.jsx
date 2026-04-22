import { useState, useEffect } from 'react'
import { getData, saveData } from '../utils/localStorage'

function Projects({ currentUser }) {
  const [projects, setProjects] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    projectName: '',
    mine: '',
    status: 'Active'
  })

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role === 'siteManager') return // No access
    loadProjects()
  }, [currentUser])

  const loadProjects = () => {
    const storedProjects = getData('projects') || []
    setProjects(storedProjects)
  }

  const saveProjects = (newProjects) => {
    const allProjects = getData('projects') || []
    const otherProjects = allProjects.filter(project => !newProjects.some(np => np.id === project.id))
    const updatedAll = [...otherProjects, ...newProjects]
    setProjects(newProjects)
    saveData('projects', updatedAll)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentUser.role !== 'admin') return

    if (editingId !== null) {
      // Update existing
      const updatedProjects = projects.map(project =>
        project.id === editingId ? { ...project, ...formData } : project
      )
      saveProjects(updatedProjects)
      setEditingId(null)
    } else {
      // Add new
      const newProject = {
        id: Date.now(),
        ...formData,
        companyId: 1
      }
      saveProjects([...projects, newProject])
    }
    setFormData({ projectName: '', mine: '', status: 'Active' })
  }

  const handleEdit = (project) => {
    if (currentUser.role !== 'admin') return
    setEditingId(project.id)
    setFormData({
      projectName: project.projectName,
      mine: project.mine,
      status: project.status
    })
  }

  const handleDelete = (id) => {
    if (currentUser.role !== 'admin') return
    const updatedProjects = projects.filter(project => project.id !== id)
    saveProjects(updatedProjects)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ projectName: '', mine: '', status: 'Active' })
  }

  const canEdit = currentUser?.role === 'admin'
  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager'

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

  const getStatusColor = (status) => {
    if (status === 'Active') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (status === 'Completed') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const activeProjects = projects.filter(p => p.status === 'Active').length
  const completedProjects = projects.filter(p => p.status === 'Completed').length

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Projects & Initiatives</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage strategic projects across mining operations</p>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? '✎ Edit Project' : '+ Add New Project'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mine / Operation</label>
              <input
                type="text"
                value={formData.mine}
                onChange={(e) => setFormData({ ...formData, mine: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
              {editingId ? '✓ Update' : '+ Add'} Project
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Projects Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Total Projects</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{projects.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-lg shadow border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">Active Projects</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{activeProjects}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 p-6 rounded-lg shadow border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Completed</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{completedProjects}</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Mine / Operation</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {projects.length > 0 ? projects.map(project => (
              <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{project.projectName}</td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{project.mine}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {canEdit && (
                    <>
                      <button onClick={() => handleEdit(project)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mr-4">Edit</button>
                      <button onClick={() => handleDelete(project.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <p className="font-medium">No projects configured yet</p>
                  <p className="text-sm mt-1">Add your first project using the form above</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default Projects