import { Home, Package, LayoutGrid, Award } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function BottomNavigation() {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/services', icon: LayoutGrid, label: 'Services' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/points', icon: Award, label: 'Points' },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 px-4 py-3 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2 px-4 transition-colors"
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
