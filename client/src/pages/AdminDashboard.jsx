import React from 'react'
import { useState, useEffect } from 'react'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('drives')
  const [drives, setDrives] = useState([])
  const [donations, setDonations] = useState([])
  const [schools, setSchools] = useState([])
  const [allocations, setAllocations] = useState([])
  const [donors, setDonors] = useState([])
  const [coordinators, setCoordinators] = useState([])
  const [donorBooks, setDonorBooks] = useState({ '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 });
  const [loading, setLoading] = useState(true)

  // Message states for form submissions
  const [driveMessage, setDriveMessage] = useState({ type: '', text: '' })
  const [schoolMessage, setSchoolMessage] = useState({ type: '', text: '' })
  const [allocationMessage, setAllocationMessage] = useState({ type: '', text: '' })

  // Form states
  const [driveForm, setDriveForm] = useState({
    name: '',
    description: '',
    location: '',
    gatedCommunity: '',
    coordinator: { name: '', phone: '', email: '' },
    startDate: '',
    endDate: ''
  })

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    contactPerson: { name: '', phone: '', email: '' },
    studentsCount: 0
  })

  const [allocationForm, setAllocationForm] = useState({
    donationDriveId: '',
    donorId: '',
    schoolId: '',
    booksAllocated: { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 },
    notes: ''
  })
  // Fetch donors when a drive is selected
  useEffect(() => {
    const fetchDonors = async () => {
      if (!allocationForm.donationDriveId) {
        setDonors([]);
        setAllocationForm(f => ({ ...f, donorId: '' }));
        setDonorBooks({ '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 });
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/allocations/donors/by-drive/${allocationForm.donationDriveId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDonors(data);
        } else {
          setDonors([]);
        }
      } catch (err) {
        setDonors([]);
      }
    };
    fetchDonors();
  }, [allocationForm.donationDriveId]);

  // Update donorBooks when donor is selected
  useEffect(() => {
    if (!allocationForm.donorId || !donors.length) {
      setDonorBooks({ '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 });
      return;
    }
    const donorObj = donors.find(d => d.donor._id === allocationForm.donorId);
    if (!donorObj) {
      setDonorBooks({ '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 });
      return;
    }
    // Sum up available books by category for this donor (subtract already allocated)
    const books = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
    donorObj.donations.forEach(donation => {
      for (const cat of Object.keys(books)) {
        const total = donation.booksCount?.[cat] || 0;
        const allocated = donation.allocatedCount?.[cat] || 0;
        books[cat] += total - allocated;
      }
    });
    setDonorBooks(books);
  }, [allocationForm.donorId, donors]);

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [drivesRes, donationsRes, schoolsRes, allocationsRes, usersRes] = await Promise.all([
        fetch('/api/drives/all', { headers }),
        fetch('/api/donations/all', { headers }),
        fetch('/api/schools/all', { headers }),
        fetch('/api/allocations/all', { headers }),
        fetch('/api/auth/users', { headers })
      ])

      const [drivesData, donationsData, schoolsData, allocationsData, usersData] = await Promise.all([
        drivesRes.json(),
        donationsRes.json(),
        schoolsRes.json(),
        allocationsRes.json(),
        usersRes.json()
      ])

      setDrives(drivesData)
      setDonations(donationsData)
      setSchools(schoolsData)
      setAllocations(allocationsData)
      setCoordinators(usersData.filter(user => user.role === 'coordinator'))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDrive = async (e) => {
    e.preventDefault()
    setDriveMessage({ type: '', text: '' }) // Clear previous messages
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/drives/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(driveForm)
      })

      if (response.ok) {
        setDriveMessage({ type: 'success', text: 'Donation drive created successfully!' })
        setDriveForm({
          name: '',
          description: '',
          location: '',
          gatedCommunity: '',
          coordinator: { name: '', phone: '', email: '' },
          startDate: '',
          endDate: ''
        })
        await fetchData()
        setLoading(false)
      } else {
        const error = await response.json()
        setDriveMessage({ type: 'error', text: error.message || 'Failed to create drive' })
      }
    } catch (error) {
      console.error('Error creating drive:', error)
      setDriveMessage({ type: 'error', text: 'Failed to create drive' })
    }
  }

  const handleCreateSchool = async (e) => {
    e.preventDefault()
    setSchoolMessage({ type: '', text: '' }) // Clear previous messages
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/schools/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(schoolForm)
      })

      if (response.ok) {
        setSchoolMessage({ type: 'success', text: 'School created successfully!' })
        setSchoolForm({
          name: '',
          address: { street: '', city: '', state: '', zipCode: '' },
          contactPerson: { name: '', phone: '', email: '' },
          studentsCount: 0
        })
        fetchData()
      } else {
        const error = await response.json()
        setSchoolMessage({ type: 'error', text: error.message || 'Failed to create school' })
      }
    } catch (error) {
      console.error('Error creating school:', error)
      setSchoolMessage({ type: 'error', text: 'Failed to create school' })
    }
  }

  const handleAllocateBooks = async (e) => {
    e.preventDefault()
    setAllocationMessage({ type: '', text: '' }) // Clear previous messages
    
    // Validate allocation doesn't exceed available books from donor
    if (!allocationForm.donorId) {
      setAllocationMessage({ type: 'error', text: 'Please select a donor.' });
      return;
    }
    const requestedTotal = Object.values(allocationForm.booksAllocated).reduce((sum, count) => sum + count, 0);
    const donorTotal = Object.values(donorBooks).reduce((sum, count) => sum + count, 0);
    if (requestedTotal > donorTotal) {
      setAllocationMessage({
        type: 'error',
        text: `Cannot allocate ${requestedTotal} books. Only ${donorTotal} books available from this donor.`
      });
      return;
    }
    for (const [category, requestedCount] of Object.entries(allocationForm.booksAllocated)) {
      const available = donorBooks[category] || 0;
      if (requestedCount > available) {
        setAllocationMessage({
          type: 'error',
          text: `Cannot allocate ${requestedCount} books for age ${category}. Only ${available} books available from this donor in this category.`
        });
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/allocations/allocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(allocationForm)
      })

      if (response.ok) {
        setAllocationMessage({ type: 'success', text: 'Books allocated successfully!' })
        setAllocationForm({
          donationDriveId: '',
          donorId: '',
          schoolId: '',
          booksAllocated: { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 },
          notes: ''
        })
        fetchData()
      } else {
        const error = await response.json()
        setAllocationMessage({ type: 'error', text: error.message || 'Failed to allocate books' })
      }
    } catch (error) {
      console.error('Error allocating books:', error)
      setAllocationMessage({ type: 'error', text: 'Failed to allocate books' })
    }
  }

  const recalculateTotals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/donations/recalculate-totals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Drive totals recalculated successfully! Updated ${data.updatedDrives} drives.`)
        fetchData() // Refresh the data
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to recalculate totals')
      }
    } catch (error) {
      console.error('Error recalculating totals:', error)
      alert('Failed to recalculate totals')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
            <p className="text-gray-600">
              Manage donation drives, schools, and book allocations.
            </p>
          </div>
          <div className="flex gap-2">
            {/* Removed Fix Data button as requested */}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'drives', label: 'Donation Drives' },
            { id: 'schools', label: 'Schools' },
            { id: 'allocations', label: 'Book Allocations' },
            { id: 'donations', label: 'Donations' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'drives' && (
        <div className="space-y-8">
          {/* Create Drive Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Donation Drive</h2>
            <form onSubmit={handleCreateDrive} className="grid md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <input
                  type="text"
                  placeholder="Drive Name"
                  value={driveForm.name}
                  onChange={(e) => setDriveForm({...driveForm, name: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Coordinator Name"
                  value={driveForm.coordinator.name}
                  onChange={(e) => setDriveForm({...driveForm, coordinator: {...driveForm.coordinator, name: e.target.value}})}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Gated Community"
                  value={driveForm.gatedCommunity}
                  onChange={(e) => setDriveForm({...driveForm, gatedCommunity: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-xs"
                  required
                />
                <input
                  type="tel"
                  placeholder="Coordinator Phone"
                  value={driveForm.coordinator.phone}
                  onChange={(e) => setDriveForm({...driveForm, coordinator: {...driveForm.coordinator, phone: e.target.value}})}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={driveForm.location}
                  onChange={(e) => setDriveForm({...driveForm, location: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-xs"
                  required
                />
                <input
                  type="email"
                  placeholder="Coordinator Email"
                  value={driveForm.coordinator.email}
                  onChange={(e) => setDriveForm({...driveForm, coordinator: {...driveForm.coordinator, email: e.target.value}})}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-xs"
                  required
                />
              </div>
              <input
                type="date"
                value={driveForm.startDate}
                onChange={(e) => setDriveForm({...driveForm, startDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <span className="text-xs text-gray-500 md:col-span-2 -mt-2 mb-2">Start Date: The first day the donation drive will accept book donations.</span>
              <input
                type="date"
                value={driveForm.endDate}
                onChange={(e) => setDriveForm({...driveForm, endDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <span className="text-xs text-gray-500 md:col-span-2 -mt-2 mb-2">End Date: The last day the donation drive will accept book donations.</span>
              <textarea
                placeholder="Description"
                value={driveForm.description}
                onChange={(e) => setDriveForm({...driveForm, description: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md md:col-span-2"
                rows="2"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 md:col-span-2"
              >
                Create Drive
              </button>
              {driveMessage.text && (
                <div className={`mt-3 p-3 rounded-md md:col-span-2 ${
                  driveMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {driveMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Drives List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Donation Drives</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordinator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Books Received
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drives.map(drive => (
                    <tr key={drive._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {drive.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drive.gatedCommunity}, {drive.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drive.coordinator.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          drive.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {drive.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drive.totalBooksReceived}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs content would go here... */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drive
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Books
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donations.map(donation => (
                  <tr key={donation._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {donation.donor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donation.donationDrive.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donation.totalBooks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(donation.donationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        donation.status === 'collected' ? 'bg-green-100 text-green-800' : 
                        donation.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'schools' && (
        <div className="space-y-8">
          {/* Create School Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add New School</h2>
            <form onSubmit={handleCreateSchool} className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="School Name"
                value={schoolForm.name}
                onChange={(e) => setSchoolForm({...schoolForm, name: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="text"
                placeholder="Street Address"
                value={schoolForm.address.street}
                onChange={(e) => setSchoolForm({
                  ...schoolForm, 
                  address: {...schoolForm.address, street: e.target.value}
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="text"
                placeholder="City"
                value={schoolForm.address.city}
                onChange={(e) => setSchoolForm({
                  ...schoolForm, 
                  address: {...schoolForm.address, city: e.target.value}
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={schoolForm.address.state}
                onChange={(e) => setSchoolForm({
                  ...schoolForm, 
                  address: {...schoolForm.address, state: e.target.value}
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={schoolForm.address.zipCode}
                onChange={(e) => setSchoolForm({
                  ...schoolForm, 
                  address: {...schoolForm.address, zipCode: e.target.value}
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="number"
                placeholder="Number of students enrolled (e.g., 450)"
                value={schoolForm.studentsCount === 0 ? '' : schoolForm.studentsCount}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setSchoolForm({...schoolForm, studentsCount: isNaN(value) ? 0 : value});
                }}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.select();
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                min="0"
                required
              />
              <input
                type="text"
                placeholder="Contact Person Name"
                value={schoolForm.contactPerson.name}
                onChange={(e) => setSchoolForm({
                  ...schoolForm, 
                  contactPerson: {...schoolForm.contactPerson, name: e.target.value}
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="tel"
                placeholder="Contact Phone"
                value={schoolForm.contactPerson.phone}
                onChange={(e) => setSchoolForm({
                  ...schoolForm, 
                  contactPerson: {...schoolForm.contactPerson, phone: e.target.value}
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={schoolForm.contactPerson.email}
                onChange={(e) => setSchoolForm({
                  ...schoolForm, 
                  contactPerson: {...schoolForm.contactPerson, email: e.target.value}
                })}
                className="px-3 py-2 border border-gray-300 rounded-md md:col-span-2"
                required
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 md:col-span-2"
              >
                Add School
              </button>
              {schoolMessage.text && (
                <div className={`mt-3 p-3 rounded-md md:col-span-2 ${
                  schoolMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {schoolMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Schools List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Government Schools</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Enrollment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Books Received
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schools.map(school => (
                    <tr key={school._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {school.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {school.address.city}, {school.address.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {school.contactPerson.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-medium">{school.studentsCount.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 block">students</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-medium">{school.totalBooksReceived.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 block">books</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'allocations' && (
        <div className="space-y-8">
      {/* Allocate Books Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Allocate Books to School</h2>
        <form onSubmit={handleAllocateBooks} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <select
              value={allocationForm.donationDriveId}
              onChange={(e) => setAllocationForm({...allocationForm, donationDriveId: e.target.value, donorId: ''})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Donation Drive</option>
              {drives.map(drive => {
                // Calculate remaining books (total received minus already allocated)
                const allocatedFromDrive = allocations
                  .filter(allocation => allocation.donationDrive._id === drive._id)
                  .reduce((sum, allocation) => sum + allocation.totalBooksAllocated, 0);
                const remainingBooks = Math.max(0, drive.totalBooksReceived - allocatedFromDrive);
                return (
                  <option key={drive._id} value={drive._id}>
                    {drive.name} - Available: {remainingBooks} books
                  </option>
                );
              })}
            </select>

            {/* Donor selection, shown only if drive is selected */}
            <select
              value={allocationForm.donorId}
              onChange={e => setAllocationForm({...allocationForm, donorId: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={!allocationForm.donationDriveId || donors.length === 0}
            >
              <option value="">{!allocationForm.donationDriveId ? 'Select drive first' : donors.length === 0 ? 'No donors found' : 'Select Donor'}</option>
              {donors.map(donorObj => (
                <option key={donorObj.donor._id} value={donorObj.donor._id}>
                  {donorObj.donor.name}
                </option>
              ))}
            </select>

            <select
              value={allocationForm.schoolId}
              onChange={(e) => setAllocationForm({...allocationForm, schoolId: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select School</option>
              {schools.map(school => (
                <option key={school._id} value={school._id}>
                  {school.name} - {school.address.city}
                </option>
              ))}
            </select>
          </div>

              {/* Drive Details Section */}
              {allocationForm.donationDriveId && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-3">Selected Drive Details</h3>
                  {(() => {
                    const selectedDrive = drives.find(drive => drive._id === allocationForm.donationDriveId);
                    if (!selectedDrive) return null;
                    
                    const allocatedFromDrive = allocations
                      .filter(allocation => allocation.donationDrive._id === selectedDrive._id)
                      .reduce((sum, allocation) => sum + allocation.totalBooksAllocated, 0);
                    const remainingBooks = Math.max(0, selectedDrive.totalBooksReceived - allocatedFromDrive);
                    
                    return (
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="space-y-2">
                            <div><strong>Drive Name:</strong> {selectedDrive.name}</div>
                            <div><strong>Location:</strong> {selectedDrive.location}</div>
                            <div><strong>Total Books Received:</strong> {selectedDrive.totalBooksReceived}</div>
                            <div><strong>Books Already Allocated:</strong> {allocatedFromDrive}</div>
                            <div className="text-blue-700 font-semibold">
                              <strong>Available for Allocation:</strong> {remainingBooks}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-800 mb-2">Books Available by Age Category:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(selectedDrive.booksReceived || {'2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0}).map(([category, count]) => {
                              const allocatedInCategory = allocations
                                .filter(allocation => allocation.donationDrive._id === selectedDrive._id)
                                .reduce((sum, allocation) => sum + (allocation.booksAllocated[category] || 0), 0);
                              const availableInCategory = Math.max(0, count - allocatedInCategory);
                              
                              return (
                                <div key={category} className="bg-white p-2 rounded border">
                                  <div className="font-medium">Age {category}:</div>
                                  <div>Available: <span className="text-blue-700 font-semibold">{availableInCategory}</span></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Donor Details and Books */}
              {allocationForm.donorId && (() => {
                const donorObj = donors.find(d => d.donor._id === allocationForm.donorId);
                if (!donorObj) return null;
                const { name, email, phone, address } = donorObj.donor;
                return (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                    <h3 className="font-medium text-green-800 mb-2">Selected Donor Details</h3>
                    <div className="mb-3 text-sm">
                      <div><strong>Name:</strong> {name}</div>
                      <div><strong>Address:</strong> {address?.street || ''}{address?.street ? ', ' : ''}{address?.city || ''}{address?.city ? ', ' : ''}{address?.state || ''}{address?.state ? ', ' : ''}{address?.zipCode || ''}</div>
                      <div><strong>Email:</strong> {email}</div>
                      <div><strong>Phone:</strong> {phone}</div>
                    </div>
                    <h4 className="font-medium text-green-800 mb-2 mt-2">Books Donated by Selected Donor</h4>
                    <div className="grid md:grid-cols-4 gap-4">
                      {Object.entries(donorBooks).map(([category, count]) => (
                        <div key={category} className="bg-white p-2 rounded border">
                          <div className="font-medium">Age {category}:</div>
                          <div>Available: <span className="text-green-700 font-semibold">{count}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div>
                <h3 className="font-medium mb-2">Books to Allocate by Age Category</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {Object.entries(allocationForm.booksAllocated).map(([category, count]) => (
                    <div key={category}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age {category} years
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={donorBooks[category] || 0}
                        value={count === 0 ? '' : count}
                        onChange={(e) => {
                          let value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (value > (donorBooks[category] || 0)) value = donorBooks[category] || 0;
                          setAllocationForm({
                            ...allocationForm,
                            booksAllocated: {
                              ...allocationForm.booksAllocated,
                              [category]: isNaN(value) ? 0 : value
                            }
                          });
                        }}
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.select();
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={allocationForm.notes}
                  onChange={(e) => setAllocationForm({...allocationForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Any special instructions or notes..."
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-lg font-medium text-gray-800">
                  Total Books to Allocate: {Object.values(allocationForm.booksAllocated).reduce((sum, count) => sum + count, 0)}
                </div>
              </div>

              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
              >
                Allocate Books
              </button>
              {allocationMessage.text && (
                <div className={`mt-3 p-3 rounded-md ${
                  allocationMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {allocationMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Allocations List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Book Allocations</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drive
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Books Allocated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allocations.map(allocation => (
                    <tr key={allocation._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {allocation.donationDrive.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {allocation.school.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(allocation.booksAllocated).map(([category, count]) => (
                            <div key={category} className="bg-gray-50 p-2 rounded border">
                              <div className="font-medium">Age {category}:</div>
                              <div><span className="text-gray-700 font-semibold">{count}</span> books</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 font-semibold text-gray-800">
                          Total: {allocation.totalBooksAllocated} books
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(allocation.allocationDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
