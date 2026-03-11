import { Outlet } from 'react-router-dom'
import { BottomNavigation } from './BottomNavigation.jsx'
import { ScrollToTop } from './ScrollToTop.jsx'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[390px] bg-white relative pb-20"> 
        <ScrollToTop />
        <Outlet />
        <BottomNavigation />
      </div>
    </div>
  )
}

