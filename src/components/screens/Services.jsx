import {
  ArrowLeft,
  Search,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { getServices } from '../../../api/services-api'
import { mapApiServicesToCatalog } from '../../utils/services-catalog'
import { useI18n } from '../../utils/i18n.js'

function renderServiceTitle(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean)

  if (words.length <= 1) {
    return name
  }

  const firstLine = words[0]
  const secondLine = words.slice(1).join(' ')

  return (
    <>
      <span className="block">{firstLine}</span>
      <span
        className="block overflow-hidden text-ellipsis whitespace-nowrap"
        title={name}
      >
        {secondLine}
      </span>
    </>
  )
}

export function Services() {
  const { t, localizeDigits } = useI18n()
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
        const catalog = mapApiServicesToCatalog(services)
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
    <div className="min-h-screen bg-gray-50 pb-20 transition-colors dark:bg-slate-900">
      <div className="bg-blue-600 px-5 pt-12 pb-8 rounded-b-3xl dark:bg-blue-950">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors dark:bg-blue-900 dark:hover:bg-blue-800"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <p className="text-blue-100 text-sm">{t('services.browse')}</p>
            <h1 className="text-white text-2xl">{t('services.title')}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition-colors dark:bg-slate-800">
          <Search className="w-5 h-5 text-gray-400 dark:text-slate-400" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('services.searchPlaceholder')}
            aria-label={t('services.searchLabel')}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-slate-100 dark:placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="px-5 py-6">
        {isLoadingServices && <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">{t('services.loading')}</p>}
        {!isLoadingServices && servicesError && <p className="text-sm text-red-500 mb-4">{t('services.error')}</p>}
        <div className="grid grid-cols-2 gap-4">
          {filteredServices.map((service) => {
            const Icon = service.icon
            return (
              <Link
                key={service.id}
                to={`/service/${service.id}`}
                className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:shadow-slate-950/30"
              >
                <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-3`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3
                  className="min-h-10 leading-5 font-medium text-gray-800 dark:text-slate-100"
                >
                  {renderServiceTitle(service.name)}
                </h3>
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{localizeDigits(service.priceLabel)}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
