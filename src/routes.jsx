import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { Home } from './components/screens/Home.jsx'
import { ServiceDetail } from './components/screens/ServiceDetail.jsx'
import { ServiceReviews } from './components/screens/ServiceReviews.jsx'
import { Booking } from './components/screens/Booking.jsx'
import { Tracking } from './components/screens/Tracking.jsx'
import { Orders } from './components/screens/Orders.jsx'
import { Services } from './components/screens/Services.jsx'
import { Points } from './components/screens/Points.jsx'
import { Rating } from './components/screens/Rating.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'service/:id', Component: ServiceDetail },
      { path: 'service/:id/reviews', Component: ServiceReviews },
      { path: 'services', Component: Services },
      { path: 'booking/:id', Component: Booking },
      { path: 'tracking/:orderId', Component: Tracking },
      { path: 'orders', Component: Orders },
      { path: 'points', Component: Points },
      { path: 'rating/:orderId', Component: Rating },
    ],
  },
])
