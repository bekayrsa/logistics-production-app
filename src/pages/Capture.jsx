import { useState, useEffect } from 'react'
import { getData, saveData } from '../utils/localStorage'

const FAILURE_REASONS = [
  { id: 'weather', label: 'Weather Conditions' },
  { id: 'equipment', label: 'Equipment Failure' },
  { id: 'staffing', label: 'Staffing Shortage' },
  { id: 'maintenance', label: 'Planned Maintenance' },
  { id: 'supply', label: 'Supply Chain Delay' },
  { id: 'operational', label: 'Operational Issue' },
  { id: 'other', label: 'Other' }
]

const DELAY_FACTORS = [
  'Traffic/Transportation',
  'Equipment Downtime',
  'Worker Absence',
  'Weather Impact',
  'Fuel Shortage',
  'Mechanical Issue',
  'Scheduling Conflict',
  'Safety Incident'
]

function Capture({ currentUser }) {
  const [sites, setSites] = useState([])
  const [trucks, setTrucks] = useState([])
  const [todayCaptures, setTodayCaptures] = useState([])
  const [filteredTrucks, setFilteredTrucks] = useState([])
  const [pendingEntries, setPendingEntries] = useState([])
  const [daySubmitted, setDaySubmitted] = useState(false)

  const [formData, setFormData] = useState({
    siteId: '',
    truckId: '',
    loads: ''
  })

  const [failureReport, setFailureReport] = useState({
    reasonCategory: '',
    explanation: '',
    delayFactors: []
  })

  const [showFailureModal, setShowFailureModal] = useState(false)
  const [tons, setTons] = useState(0)

  useEffect(() => {
    if (!currentUser) return
    let allSites = getData('sites') || []
    let allTrucks = getData('trucks') || []
    if (currentUser.role === 'siteManager') {
      allSites = allSites.filter(site => site.id === currentUser.assignedSite)
      allTrucks = allTrucks.filter(truck => truck.siteId === currentUser.assignedSite)
      // Pre-select the site for Site Managers
      setFormData(prev => ({ ...prev, siteId: currentUser.assignedSite.toString() }))
    }
    setSites(allSites)
    setTrucks(allTrucks)
    loadTodayCaptures()
  }, [currentUser])

  useEffect(() => {
    if (!formData.siteId) {
      setFilteredTrucks([])
      return
    }

    const siteTrucks = trucks.filter(
      truck => String(truck.siteId) === String(formData.siteId)
    )

    setFilteredTrucks(siteTrucks)

    if (
      formData.truckId &&
      !siteTrucks.find(t => String(t.id) === String(formData.truckId))
    ) {
      setFormData(prev => ({
        ...prev,
        truckId: ''
      }))
    }
  }, [formData.siteId, trucks, formData.truckId])

  useEffect(() => {
    const selectedTruck = trucks.find(
      truck => String(truck.id) === String(formData.truckId)
    )

    if (selectedTruck && formData.loads) {
      const total =
        Number(formData.loads) * Number(selectedTruck.capacity || 0)

      setTons(total)
    } else {
      setTons(0)
    }
  }, [
    formData.siteId,
    formData.truckId,
    formData.loads,
    trucks,
    sites,
    todayCaptures
  ])

  const loadTodayCaptures = () => {
    const captures = getData('captures') || []
    const today = new Date().toISOString().split('T')[0]

    let todayData = captures.filter(item => item.date === today)
    if (currentUser.role === 'siteManager') {
      todayData = todayData.filter(item => item.siteId === currentUser.assignedSite)
      // Check if day is already submitted
      const submittedDays = getData('submittedDays') || []
      setDaySubmitted(submittedDays.some(day => day.date === today && day.siteId === currentUser.assignedSite))
    }
    setTodayCaptures(todayData)
  }

  const addEntry = (e) => {
    e.preventDefault()

    const selectedSite = sites.find(site => String(site.id) === String(formData.siteId))
    const selectedTruck = trucks.find(truck => String(truck.id) === String(formData.truckId))

    if (!selectedSite || !selectedTruck || !formData.loads) return

    const newEntry = {
      id: Date.now(),
      siteId: Number(formData.siteId),
      siteName: selectedSite.siteName,
      truckId: Number(formData.truckId),
      truckName: selectedTruck.truckName,
      loads: Number(formData.loads),
      tons: tons
    }

    setPendingEntries(prev => [...prev, newEntry])

    // Reset form
    setFormData(prev => ({
      ...prev,
      truckId: '',
      loads: ''
    }))
    setTons(0)
  }

  const submitDayReport = () => {
    if (pendingEntries.length === 0) {
      alert('Please add at least one truck entry before submitting the day report.')
      return
    }

    const selectedSite = sites.find(site => site.id === currentUser.assignedSite)
    const totalTons = pendingEntries.reduce((sum, entry) => sum + entry.tons, 0)
    const target = selectedSite.dailyTarget
    const willFail = totalTons < target

    if (willFail) {
      setShowFailureModal(true)
    } else {
      finalizeSubmission()
    }
  }

  const finalizeSubmission = () => {
    const today = new Date().toISOString().split('T')[0]
    const selectedSite = sites.find(site => site.id === currentUser.assignedSite)

    // Save all pending entries
    const captures = getData('captures') || []
    const newCaptures = pendingEntries.map(entry => ({
      ...entry,
      date: today,
      failureReport: showFailureModal ? failureReport : null
    }))
    saveData('captures', [...captures, ...newCaptures])

    // Update production data
    const production = getData('production') || []
    const totalTons = pendingEntries.reduce((sum, entry) => sum + entry.tons, 0)
    const totalLoads = pendingEntries.reduce((sum, entry) => sum + entry.loads, 0)

    const existing = production.find(item => item.date === today && item.siteId === currentUser.assignedSite)

    if (existing) {
      existing.loadsPerTruck += totalLoads
      existing.totalTons += totalTons
      existing.actual = existing.totalTons
      existing.variance = Math.round(((existing.totalTons - existing.target) / existing.target) * 100)
      existing.status = existing.totalTons >= existing.target ? 'On Target' : 'Below Target'
    } else {
      production.push({
        id: Date.now(),
        date: today,
        siteId: currentUser.assignedSite,
        siteName: selectedSite.siteName,
        trucksUsed: pendingEntries.length,
        loadsPerTruck: totalLoads,
        totalTons: totalTons,
        target: target,
        actual: totalTons,
        variance: Math.round(((totalTons - target) / target) * 100),
        status: totalTons >= target ? 'On Target' : 'Below Target'
      })
    }

    saveData('production', production)

    // Mark day as submitted
    const submittedDays = getData('submittedDays') || []
    submittedDays.push({
      date: today,
      siteId: currentUser.assignedSite,
      totalTons: totalTons,
      target: target,
      status: totalTons >= target ? 'green' : 'red'
    })
    saveData('submittedDays', submittedDays)

    // Reset state
    setPendingEntries([])
    setFailureReport({ reasonCategory: '', explanation: '', delayFactors: [] })
    setShowFailureModal(false)
    setDaySubmitted(true)
    loadTodayCaptures()
  }

  const handleSubmit = e => {
    e.preventDefault()

    if (willFail && !isFailureReportValid()) {
      alert('Please complete the failure report.')
      return
    }

    const selectedSite = sites.find(
      site => String(site.id) === String(formData.siteId)
    )

    const selectedTruck = trucks.find(
      truck => String(truck.id) === String(formData.truckId)
    )

    if (!selectedSite || !selectedTruck || !formData.loads) return

    const today = new Date().toISOString().split('T')[0]

    const newCapture = {
      id: Date.now(),
      date: today,
      siteId: Number(formData.siteId),
      siteName: selectedSite.siteName,
      truckId: Number(formData.truckId),
      truckName: selectedTruck.truckName,
      loads: Number(formData.loads),
      tons,
      failureReport: willFail ? failureReport : null
    }

    const captures = getData('captures') || []
    saveData('captures', [...captures, newCapture])

    const production = getData('production') || []

    const existing = production.find(
      item =>
        item.date === today &&
        Number(item.siteId) === Number(formData.siteId)
    )

    if (existing) {
      existing.loadsPerTruck += Number(formData.loads)
      existing.totalTons += tons
      existing.actual = existing.totalTons
      existing.variance = Math.round(
        ((existing.totalTons - existing.target) /
          existing.target) *
          100
      )
      existing.status =
        existing.totalTons >= existing.target
          ? 'On Target'
          : 'Below Target'
    } else {
      production.push({
        id: Date.now(),
        date: today,
        siteId: Number(formData.siteId),
        siteName: selectedSite.siteName,
        trucksUsed: 1,
        loadsPerTruck: Number(formData.loads),
        totalTons: tons,
        target: Number(selectedSite.dailyTarget),
        actual: tons,
        variance: Math.round(
          ((tons - selectedSite.dailyTarget) /
            selectedSite.dailyTarget) *
            100
        ),
        status:
          tons >= selectedSite.dailyTarget
            ? 'On Target'
            : 'Below Target'
      })
    }

    saveData('production', production)

    setFormData({
      siteId: '',
      truckId: '',
      loads: ''
    })

    setFailureReport({
      reasonCategory: '',
      explanation: '',
      delayFactors: []
    })

    setTons(0)
    setWillFail(false)

    loadTodayCaptures()
  }

  const getSiteTargetAchievement = siteId => {
    return todayCaptures
      .filter(item => String(item.siteId) === String(siteId))
      .reduce((sum, item) => sum + Number(item.tons || 0), 0)
  }

  const getSiteTargetPercentage = siteId => {
    const site = sites.find(
      item => String(item.id) === String(siteId)
    )

    if (!site) return 0

    const achieved = getSiteTargetAchievement(siteId)

    return Math.round(
      (achieved / Number(site.dailyTarget || 1)) * 100
    )
  }

  const canCapture = currentUser?.role === 'admin' || currentUser?.role === 'siteManager'

  if (!canCapture) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to capture production data.</p>
        </div>
      </div>
    )
  }

  if (daySubmitted) {
    return (
      <main className="p-6">
        <h2 className="text-2xl font-semibold mb-2">Daily Production Capture</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Day Report Submitted</h3>
          <p className="text-green-700">Today's production data has been submitted and is now locked.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h2 className="text-2xl font-semibold mb-2">Daily Production Capture</h2>
      <p className="mb-6 text-gray-500">
        {currentUser.role === 'siteManager' 
          ? 'Log daily production for your assigned site' 
          : 'Log daily production by site and truck'}
      </p>

      {currentUser.role === 'siteManager' ? (
        // Site Manager Workflow
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Site: {sites.find(s => s.id === currentUser.assignedSite)?.siteName}</h3>
            
            <form onSubmit={addEntry} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={formData.truckId}
                  onChange={e => setFormData(prev => ({ ...prev, truckId: e.target.value }))}
                  className="border p-2 rounded"
                  required
                >
                  <option value="">Select Truck</option>
                  {filteredTrucks.map(truck => (
                    <option key={truck.id} value={truck.id}>
                      {truck.truckName} ({truck.capacity}t)
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Loads"
                  value={formData.loads}
                  onChange={e => setFormData(prev => ({ ...prev, loads: e.target.value }))}
                  className="border p-2 rounded"
                  required
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Calculated Tons: {tons}</span>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>

          {/* Pending Entries */}
          {pendingEntries.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Today's Entries ({pendingEntries.length})</h3>
              <div className="space-y-2">
                {pendingEntries.map((entry, index) => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>{entry.truckName}</span>
                    <span>{entry.loads} loads × {entry.tons / entry.loads}t = {entry.tons}t</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total: {pendingEntries.reduce((sum, e) => sum + e.tons, 0)} tons</span>
                  <button
                    onClick={submitDayReport}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Submit Day Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Admin Workflow (existing)
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 mb-6"
        >
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <select
            value={formData.siteId}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                siteId: e.target.value
              }))
            }
            className="border p-2 rounded"
            required
          >
            <option value="">Select Site</option>

            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.siteName}
              </option>
            ))}
          </select>

          <select
            value={formData.truckId}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                truckId: e.target.value
              }))
            }
            className="border p-2 rounded"
            required
            disabled={!formData.siteId}
          >
            <option value="">Select Truck</option>

            {filteredTrucks.map(truck => (
              <option key={truck.id} value={truck.id}>
                {truck.truckName} ({truck.capacity}t)
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="number"
            min="1"
            placeholder="Loads"
            value={formData.loads}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                loads: e.target.value
              }))
            }
            className="border p-2 rounded"
            required
          />

          <input
            type="number"
            value={tons}
            readOnly
            className="border p-2 rounded bg-gray-100"
          />
        </div>

        {willFail && (
          <div className="border border-red-400 bg-red-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">
              Failure Report Required
            </h3>

            <select
              value={failureReport.reasonCategory}
              onChange={e =>
                setFailureReport(prev => ({
                  ...prev,
                  reasonCategory: e.target.value
                }))
              }
              className="border p-2 rounded w-full mb-3"
            >
              <option value="">Select Reason</option>

              {FAILURE_REASONS.map(reason => (
                <option
                  key={reason.id}
                  value={reason.id}
                >
                  {reason.label}
                </option>
              ))}
            </select>

            <textarea
              rows="3"
              placeholder="Explanation"
              value={failureReport.explanation}
              onChange={e =>
                setFailureReport(prev => ({
                  ...prev,
                  explanation: e.target.value
                }))
              }
              className="border p-2 rounded w-full mb-3"
            />

            <div className="grid md:grid-cols-2 gap-2">
              {DELAY_FACTORS.map(factor => (
                <label
                  key={factor}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="checkbox"
                    checked={failureReport.delayFactors.includes(
                      factor
                    )}
                    onChange={() =>
                      toggleDelayFactor(factor)
                    }
                  />
                  {factor}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!isFailureReportValid()}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {willFail
            ? 'Submit with Failure Report'
            : 'Submit Capture'}
        </button>
      </form>
      )}

      {/* Failure Modal for Site Managers */}
      {showFailureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Target Not Met - Failure Report Required</h3>
            
            <select
              value={failureReport.reasonCategory}
              onChange={e => setFailureReport(prev => ({ ...prev, reasonCategory: e.target.value }))}
              className="border p-2 rounded w-full mb-3"
              required
            >
              <option value="">Select Reason Category</option>
              {FAILURE_REASONS.map(reason => (
                <option key={reason.id} value={reason.id}>{reason.label}</option>
              ))}
            </select>

            <textarea
              rows="3"
              placeholder="Explanation"
              value={failureReport.explanation}
              onChange={e => setFailureReport(prev => ({ ...prev, explanation: e.target.value }))}
              className="border p-2 rounded w-full mb-3"
              required
            />

            <div className="mb-4">
              <p className="font-medium mb-2">Delay Factors:</p>
              <div className="grid grid-cols-1 gap-2">
                {DELAY_FACTORS.map(factor => (
                  <label key={factor} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={failureReport.delayFactors.includes(factor)}
                      onChange={() => toggleDelayFactor(factor)}
                    />
                    {factor}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFailureModal(false)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={finalizeSubmission}
                disabled={!failureReport.reasonCategory || !failureReport.explanation.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {sites.map(site => {
          const achieved = getSiteTargetAchievement(site.id)
          const percent = getSiteTargetPercentage(site.id)

          return (
            <div
              key={site.id}
              className="bg-white p-4 rounded shadow"
            >
              <p className="font-semibold">
                {site.siteName}
              </p>

              <p className="text-xl font-bold">
                {achieved} / {site.dailyTarget}
              </p>

              <p>{percent}%</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Site</th>
              <th className="p-3 text-left">Truck</th>
              <th className="p-3 text-left">Loads</th>
              <th className="p-3 text-left">Tons</th>
              <th className="p-3 text-left">Report</th>
            </tr>
          </thead>

          <tbody>
            {todayCaptures.map(item => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.siteName}</td>
                <td className="p-3">{item.truckName}</td>
                <td className="p-3">{item.loads}</td>
                <td className="p-3">{item.tons}</td>
                <td className="p-3">
                  {item.failureReport
                    ? 'Filed'
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default Capture
