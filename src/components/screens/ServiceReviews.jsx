import { ArrowLeft, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getReviews } from '../../../api/reviews-api'
import { getServices } from '../../../api/services-api'

const formatReviewDate = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}

export function ServiceReviews() {
  const { id } = useParams()
  const [serviceName, setServiceName] = useState('Service')
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchServiceName = async () => {
      try {
        const services = await getServices()
        const matchedService = services.find((item) => {
          const routeId = (item?.Mini_Shin__id__CST || item?.id || '').toString().trim()
          return routeId === (id || '')
        })
        const name =
          matchedService?.Mini_Shin__serviceName__CST ||
          matchedService?.serviceName ||
          matchedService?.Mini_Shin__name__CST ||
          matchedService?.name ||
          'Service'
        setServiceName(name)
      } catch (fetchError) {
        console.error('Error fetching service name:', fetchError)
      }
    }

    fetchServiceName()
  }, [id])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true)
        setError('')
        const data = await getReviews(id)
        const normalized = (data || []).map((review, index) => ({
          id: review.id ?? review.Mini_Shin__id__CST ?? `${review.Mini_Shin__serviceId__CST || 'review'}-${index}`,
          serviceId: review.Mini_Shin__serviceId__CST ?? review.serviceId ?? '',
          name:
            review.Mini_Shin__name__CST ||
            review.Mini_Shin__reviewerName__CST ||
            review.name ||
            review.createdBy?.name ||
            'Anonymous',
          rating: Number(review.Mini_Shin__rating__CST ?? review.rating ?? 0),
          date: formatReviewDate(review.Mini_Shin__date__CST || review.date || review.createdDate),
          comment: review.Mini_Shin__comment__CST || review.comment || '',
        }))
        const filtered = normalized.filter((review) => {
          const routeId = (id || '').toString().trim()
          const reviewServiceId = (review.serviceId || '').toString().trim()
          return !routeId || !reviewServiceId || routeId === reviewServiceId
        })
        setReviews(filtered)
      } catch (fetchError) {
        console.error('Error fetching reviews:', fetchError)
        setError('Unable to load reviews.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 transition-colors dark:bg-slate-900">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-white px-5 py-4 shadow-sm transition-colors dark:bg-slate-900/95 dark:shadow-slate-950/30">
        <Link
          to={`/service/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors dark:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-200" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">All Reviews</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">{serviceName}</p>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="space-y-4">
          {isLoading && (
            <p className="text-sm text-gray-500 dark:text-slate-400">Loading reviews...</p>
          )}
          {!isLoading && error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!isLoading && !error && reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {review.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{review.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{review.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <Star
                      key={starValue}
                      className={`w-3 h-3 ${
                        starValue <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                    ))}
                </div>
              </div>
            </div>
          ))}
          {!isLoading && !error && reviews.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-slate-400">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
