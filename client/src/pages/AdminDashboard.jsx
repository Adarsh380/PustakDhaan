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
  const [creatingDrive, setCreatingDrive] = useState(false)

  // Message states for form submissions
  const [driveMessage, setDriveMessage] = useState({ type: '', text: '' })
  const [schoolMessage, setSchoolMessage] = useState({ type: '', text: '' })
  const [allocationMessage, setAllocationMessage] = useState({ type: '', text: '' })

  // Users & admin promotion state
  const [users, setUsers] = useState([])
  const [promoteMessage, setPromoteMessage] = useState({ type: '', text: '' })
  const [promotingUserId, setPromotingUserId] = useState(null)

  // Form states
  const [driveForm, setDriveForm] = useState({
    name: '',
    description: '',
    location: '',
    gatedCommunity: '',
    coordinator: { name: '', phone: '', email: '' },
    startDate: '',
    endDate: ''
  });
  // New state for edit/delete features
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });

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
    // use empty strings so inputs can be cleared by the user; convert to numbers during validation/submission
    booksAllocated: { '2-4': '', '4-6': '', '6-8': '', '8-10': '' },
    notes: ''
  })
  const fetchDonors = async (driveId) => {
    if (!driveId) {
      setDonors([]);
      setAllocationForm(f => ({ ...f, donorId: '' }));
      setDonorBooks({ '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/allocations/donors/by-drive/${driveId}`, {
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
  }

  // Fetch donors when a drive is selected
  useEffect(() => {
    fetchDonors(allocationForm.donationDriveId);
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
      setUsers(usersData)
      setCoordinators(usersData.filter(user => user.role === 'coordinator'))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (creatingDrive) return;
    setCreatingDrive(true);
    setDriveMessage({ type: '', text: '' }); // Clear previous messages
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/drives/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(driveForm)
      });
      if (response.ok) {
        setDriveMessage({ type: 'success', text: 'Donation drive created successfully!' });
        setDriveForm({
          name: '',
          description: '',
          location: '',
          gatedCommunity: '',
          coordinator: { name: '', phone: '', email: '' },
          startDate: '',
          endDate: ''
        });
        await fetchData();
      } else {
        const error = await response.json();
        setDriveMessage({ type: 'error', text: error.message || 'Failed to create drive' });
      }
    } catch (error) {
      setDriveMessage({ type: 'error', text: 'Failed to create drive' });
    } finally {
      setCreatingDrive(false);
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
    // convert allocation values (which may be empty strings) to numbers for validation
    const requestedTotal = Object.values(allocationForm.booksAllocated).reduce((sum, count) => sum + (Number(count) || 0), 0);
    const donorTotal = Object.values(donorBooks).reduce((sum, count) => sum + count, 0);
    if (requestedTotal > donorTotal) {
      setAllocationMessage({
        type: 'error',
        text: `Cannot allocate ${requestedTotal} books. Only ${donorTotal} books available from this donor.`
      });
      return;
    }
    for (const [category, requestedCount] of Object.entries(allocationForm.booksAllocated)) {
      const requestedNum = Number(requestedCount) || 0;
      const available = donorBooks[category] || 0;
      if (requestedNum > available) {
        setAllocationMessage({
          type: 'error',
          text: `Cannot allocate ${requestedNum} books for age ${category}. Only ${available} books available from this donor in this category.`
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
        // Refresh donors for the current drive so available counts update
        const currentDriveId = allocationForm.donationDriveId;
        await fetchDonors(currentDriveId);
        // clear only the allocation numbers and notes, keep selected drive/donor so UI stays focused and counts update
        setAllocationForm(f => ({ ...f, booksAllocated: { '2-4': '', '4-6': '', '6-8': '', '8-10': '' }, notes: '' }))
        await fetchData()
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

  // Promote a donor/user to admin (called from UI)
  const handlePromote = async (userId) => {
    setPromotingUserId(userId)
    setPromoteMessage({ type: '', text: '' })
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })
      const result = await res.json()
      if (res.ok) {
        setPromoteMessage({ type: 'success', text: result.message || 'User promoted to admin' })
        await fetchData()
      } else {
        setPromoteMessage({ type: 'error', text: result.message || 'Failed to promote user' })
      }
    } catch (err) {
      setPromoteMessage({ type: 'error', text: 'Failed to promote user' })
    } finally {
      setPromotingUserId(null)
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
            ,{ id: 'users', label: 'Users' }
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
            {editingDriveId && editForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setDriveMessage({ type: '', text: '' });
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/drives/${editingDriveId}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify(editForm)
                    });
                    if (response.ok) {
                      setDriveMessage({ type: 'success', text: 'Donation drive updated successfully!' });
                      setEditingDriveId(null);
                      setEditForm(null);
                      await fetchData();
                    } else {
                      const error = await response.json();
                      setDriveMessage({ type: 'error', text: error.message || 'Failed to update drive' });
                    }
                  } catch (error) {
                    setDriveMessage({ type: 'error', text: 'Failed to update drive' });
                  }
                }}
                className="grid md:grid-cols-2 gap-4 mb-6"
              >
                <input type="text" placeholder="Drive Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Coordinator Name" value={editForm.coordinator.name} onChange={e => setEditForm({ ...editForm, coordinator: { ...editForm.coordinator, name: e.target.value } })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Gated Community" value={editForm.gatedCommunity} onChange={e => setEditForm({ ...editForm, gatedCommunity: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                <input type="tel" placeholder="Coordinator Phone" value={editForm.coordinator.phone} onChange={e => setEditForm({ ...editForm, coordinator: { ...editForm.coordinator, phone: e.target.value } })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Location" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                <input type="email" placeholder="Coordinator Email" value={editForm.coordinator.email} onChange={e => setEditForm({ ...editForm, coordinator: { ...editForm.coordinator, email: e.target.value } })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                <input type="date" value={editForm.startDate?.slice(0,10) || ''} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                <input type="date" value={editForm.endDate?.slice(0,10) || ''} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" />
                <textarea placeholder="Description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md md:col-span-2" rows="2" />
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save</button>
                  <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500" onClick={() => { setEditingDriveId(null); setEditForm(null); }}>Cancel</button>
                </div>
                {driveMessage.text && (
                  <div className={`mt-3 p-3 rounded-md md:col-span-2 ${driveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{driveMessage.text}</div>
                )}
              </form>
            )}
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
              <div className="md:col-span-2 flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={creatingDrive}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {creatingDrive ? 'Creating...' : 'Create Drive'}
                </button>
              </div>
              {/* Message removed from here; will show only below the drives list */}
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
                    <React.Fragment key={drive._id}>
                      <tr>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                            onClick={() => { setEditingDriveId(drive._id); setEditForm({ ...drive, coordinator: { ...drive.coordinator } }); setDriveMessage({ type: '', text: '' }); setDeleteMessage({ type: '', text: '' }); }}
                          >Edit</button>
                          <button
                            className={`bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ${drive.totalBooksReceived > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={drive.totalBooksReceived > 0}
                            onClick={async () => {
                              if (drive.totalBooksReceived > 0) return;
                              if (!window.confirm('Are you sure you want to delete this drive? This action cannot be undone.')) return;
                              setDriveMessage({ type: '', text: '' });
                              setDeleteMessage({ type: '', text: '' });
                              try {
                                const token = localStorage.getItem('token');
                                const response = await fetch(`/api/drives/${drive._id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                const result = await response.json();
                                if (response.ok) {
                                  setDeleteMessage({ type: 'success', text: result.message });
                                  await fetchData();
                                } else {
                                  setDeleteMessage({ type: 'error', text: result.message || 'Failed to delete drive' });
                                }
                              } catch (error) {
                                setDeleteMessage({ type: 'error', text: 'Failed to delete drive' });
                              }
                            }}
                          >Delete</button>
                        </td>
                      </tr>
                      {editingDriveId === drive._id && editForm && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 px-6 py-4">
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setDriveMessage({ type: '', text: '' });
                                try {
                                  const token = localStorage.getItem('token');
                                  const response = await fetch(`/api/drives/${editingDriveId}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify(editForm)
                                  });
                                  if (response.ok) {
                                    setDriveMessage({ type: 'success', text: 'Donation drive updated successfully!' });
                                    setEditingDriveId(null);
                                    setEditForm(null);
                                    await fetchData();
                                  } else {
                                    const error = await response.json();
                                    setDriveMessage({ type: 'error', text: error.message || 'Failed to update drive' });
                                  }
                                } catch (error) {
                                  setDriveMessage({ type: 'error', text: 'Failed to update drive' });
                                }
                              }}
                              className="grid md:grid-cols-2 gap-4 mb-6"
                            >
                              <input type="text" placeholder="Drive Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                              <input type="text" placeholder="Coordinator Name" value={editForm.coordinator.name} onChange={e => setEditForm({ ...editForm, coordinator: { ...editForm.coordinator, name: e.target.value } })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                              <input type="text" placeholder="Gated Community" value={editForm.gatedCommunity} onChange={e => setEditForm({ ...editForm, gatedCommunity: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                              <input type="tel" placeholder="Coordinator Phone" value={editForm.coordinator.phone} onChange={e => setEditForm({ ...editForm, coordinator: { ...editForm.coordinator, phone: e.target.value } })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                              <input type="text" placeholder="Location" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                              <input type="email" placeholder="Coordinator Email" value={editForm.coordinator.email} onChange={e => setEditForm({ ...editForm, coordinator: { ...editForm.coordinator, email: e.target.value } })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                              <input type="date" value={editForm.startDate?.slice(0,10) || ''} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" required />
                              <input type="date" value={editForm.endDate?.slice(0,10) || ''} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" />
                              <textarea placeholder="Description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md md:col-span-2" rows="2" />
                              <div className="md:col-span-2 flex gap-2 mt-2">
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save</button>
                                <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500" onClick={() => { setEditingDriveId(null); setEditForm(null); }}>Cancel</button>
                              </div>
                            </form>
                            {driveMessage.text && (
                              <div className={`mt-2 p-2 rounded text-sm ${driveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {driveMessage.text}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Show driveMessage and deleteMessage below the list, one line only, overwrite on any operation */}
            {(driveMessage.text || deleteMessage.text) && (
              <div className="mt-4 text-sm">
                <span className={`p-2 rounded-md ${driveMessage.type === 'success' || deleteMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                  style={{ display: 'inline-block', minWidth: '200px', whiteSpace: 'nowrap' }}>
                  {driveMessage.text || deleteMessage.text}
                </span>
              </div>
            )}
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

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          {promoteMessage.text && (
            <div className={`mb-4 p-3 rounded-md ${promoteMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{promoteMessage.text}</div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.address ? `${user.address.street || ''}${user.address.street ? ', ' : ''}${user.address.city || ''}${user.address.city ? ', ' : ''}${user.address.state || ''}${user.address.zipCode ? ' - ' + user.address.zipCode : ''}` : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.role === 'donor' ? (
                        <button
                          className={`bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ${promotingUserId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={promotingUserId === user._id}
                          onClick={() => handlePromote(user._id)}
                        >
                          Promote to Admin
                        </button>
                      ) : user.role === 'admin' ? (
                        <span className="text-green-700 font-semibold">Admin</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'allocations' && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create Book Allocation</h2>
            <form onSubmit={handleAllocateBooks} className="grid md:grid-cols-2 gap-4">
              <select
                value={allocationForm.donationDriveId}
                onChange={(e) => setAllocationForm({ ...allocationForm, donationDriveId: e.target.value, donorId: '' })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Donation Drive</option>
                {drives.map(drive => (
                  <option key={drive._id} value={drive._id}>{drive.name}</option>
                ))}
              </select>

              <select
                value={allocationForm.donorId}
                onChange={(e) => setAllocationForm({ ...allocationForm, donorId: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={!allocationForm.donationDriveId}
              >
                <option value="">Select Donor</option>
                {donors.map(d => (
                  <option key={d.donor._id} value={d.donor._id}>{d.donor.name}</option>
                ))}
              </select>

              <select
                value={allocationForm.schoolId}
                onChange={(e) => setAllocationForm({ ...allocationForm, schoolId: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select School</option>
                {schools.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                {Object.keys(allocationForm.booksAllocated).map(cat => (
                  <div key={cat} className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">{cat} (available: {donorBooks[cat] || 0})</label>
                    <input
                      type="number"
                      min="0"
                      value={allocationForm.booksAllocated[cat] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        // allow empty string so the user can clear the field; store numeric strings otherwise
                        setAllocationForm({ ...allocationForm, booksAllocated: { ...allocationForm.booksAllocated, [cat]: v === '' ? '' : v } })
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>

              <textarea
                placeholder="Notes (optional)"
                value={allocationForm.notes}
                onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md md:col-span-2"
                rows={2}
              />

              <div className="md:col-span-2 flex gap-2 mt-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Allocate Books</button>
                <button type="button" onClick={() => setAllocationForm({ donationDriveId: '', donorId: '', schoolId: '', booksAllocated: { '2-4': '', '4-6': '', '6-8': '', '8-10': '' }, notes: '' })} className="bg-gray-200 px-4 py-2 rounded-md">Reset</button>
              </div>

              {allocationMessage.text && (
                <div className={`mt-3 p-3 rounded-md md:col-span-2 ${allocationMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{allocationMessage.text}</div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Existing Allocations</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drive</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Books Allocated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allocations.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-4 text-sm text-gray-500">No allocations yet.</td></tr>
                  ) : (
                    allocations.map(a => (
                      <tr key={a._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.donationDrive?.name || a.donationDriveName || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{
                          (a.donationsUsed && a.donationsUsed.length) ?
                            Array.from(new Set(a.donationsUsed.map(d => d.donor?.name).filter(Boolean))).join(', ') :
                            '—'
                        }</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.school?.name || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Object.entries(a.booksAllocated || {}).map(([k,v]) => `${k}: ${v}`).join(', ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</td>
                      </tr>
                    ))
                  )}
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
