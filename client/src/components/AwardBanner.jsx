import React from 'react'

function AwardBanner({ user }) {
  if (!user || !user.badge || user.badge === 'none') {
    return null
  }

  const getBadgeConfig = (badge) => {
    switch (badge) {
      case 'gold':
        return {
          color: 'from-yellow-400 via-yellow-500 to-yellow-600',
          textColor: 'text-yellow-900',
          border: 'border-yellow-500',
          icon: '🥇',
          message: 'Gold Medal Donor!',
          description: '100+ books donated',
          shimmer: 'animate-pulse'
        }
      case 'silver':
        return {
          color: 'from-gray-300 via-gray-400 to-gray-500',
          textColor: 'text-gray-800',
          border: 'border-gray-400',
          icon: '🥈',
          message: 'Silver Medal Donor!',
          description: '50+ books donated',
          shimmer: 'animate-bounce'
        }
      case 'bronze':
        return {
          color: 'from-orange-400 via-orange-500 to-orange-600',
          textColor: 'text-orange-900',
          border: 'border-orange-500',
          icon: '🥉',
          message: 'Bronze Medal Donor!',
          description: '10+ books donated',
          shimmer: 'animate-bounce'
        }
      default:
        return null
    }
  }

  const config = getBadgeConfig(user.badge)
  if (!config) return null

  return (
    <div className={`bg-gradient-to-r ${config.color} border-b-2 ${config.border} py-3 px-4 shadow-md relative overflow-hidden`}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
      
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4 relative">
        {/* Left medal with animation */}
        <div className={`text-3xl ${config.shimmer} transform hover:scale-110 transition-transform duration-300`}>
          {config.icon}
        </div>
        
        {/* Center content */}
        <div className={`text-center ${config.textColor}`}>
          <div className="font-bold text-lg tracking-wide drop-shadow-sm">{config.message}</div>
          <div className="text-sm opacity-90 font-medium">{config.description}</div>
          {user.totalBooksDonatted && (
            <div className="text-xs mt-1 opacity-75">
              Total donated: {user.totalBooksDonatted} books
            </div>
          )}
        </div>
        
        {/* Right medal with animation */}
        <div className={`text-3xl ${config.shimmer} transform hover:scale-110 transition-transform duration-300`}>
          {config.icon}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse delay-1000"></div>
      </div>
    </div>
  )
}

export default AwardBanner
