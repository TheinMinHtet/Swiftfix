import {
  ArrowLeft,
  Search,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { getServices } from '../../../api/services-api'
import { mapApiServicesToCatalog } from '../../utils/services-catalog'

export function Services() {
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [allServices, setAllServices] = useState([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [servicesError, setServicesError] = useState('')
  const searchInputRef = useRef(null)

  const filteredServices = allServices.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    if (location.state?.focusSearch) {
      searchInputRef.current?.focus()
    }
  }, [location.state])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true)
        setServicesError('')
        const services = await getServices()
        const catalog = mapApiServicesToCatalog(services).map((service) => ({
          ...service,
          price: 'Contact for price',
        }))
        setAllServices(catalog)
      } catch (error) {
        console.error('Error fetching services:', error)
        setServicesError('Unable to load services.')
      } finally {
        setIsLoadingServices(false)
      }
    }

    fetchServices()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <p className="text-blue-100 text-sm">Browse</p>
            <h1 className="text-white text-2xl">All Services</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search services..."
            aria-label="Search services"
            className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="px-5 py-6">
        {isLoadingServices && <p className="text-sm text-gray-500 mb-4">Loading services...</p>}
        {!isLoadingServices && servicesError && <p className="text-sm text-red-500 mb-4">{servicesError}</p>}
        <div className="grid grid-cols-2 gap-4">
          {filteredServices.map((service) => {
            const Icon = service.icon
            return (
              <Link
                key={service.id}
                to={`/service/${service.id}`}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-3`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-gray-800 font-medium">{service.name}</h3>
                <p className="text-gray-500 text-xs mt-1">{service.price}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
