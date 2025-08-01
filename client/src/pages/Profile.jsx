import React from 'react'
function Profile({ user }) {
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Please login to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-center mb-6">My Profile</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Name
          </label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{user.name}</p>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{user.email}</p>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Phone
          </label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{user.phone}</p>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Role
          </label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md capitalize">{user.role}</p>
        </div>

        {user.address && (
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Address
            </label>
            <div className="text-gray-900 bg-gray-50 p-3 rounded-md">
              {user.address.street && <p>{user.address.street}</p>}
              {user.address.city && user.address.state && (
                <p>{user.address.city}, {user.address.state}</p>
              )}
              {user.address.zipCode && <p>{user.address.zipCode}</p>}
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Member Since
          </label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          Profile editing feature will be available soon!
        </p>
      </div>
    </div>
  )
}

export default Profile
