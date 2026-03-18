import { useEffect, useState } from 'react'
import { ArrowLeft, Award, BadgePercent, ReceiptText, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getUsers } from '../../../api/user-api'

// Updated with a 50-point entry tier for better feasibility
const pointDiscountRules = [
  { points: 50, discount: '1,000 Ks' },
  { points: 100, discount: '3,000 Ks' },
  { points: 250, discount: '8,000 Ks' },
  { points: 500, discount: '18,000 Ks' },
  { points: 1000, discount: '40,000 Ks' },
]

export function Points() {
  const [currentPoints, setCurrentPoints] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadUserPoints = async () => {
      try {
        const users = await getUsers('USR-1001')
        const user = users?.[0]
        const points =
          user?.Mini_Shin__points__CST ??
          user?.points ??
          0
        if (isMounted) setCurrentPoints(points)
      } catch (error) {
        if (isMounted) setCurrentPoints(0)
      }
    }

    loadUserPoints()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-5">
          <Link
            to="/"
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <p className="text-blue-100 text-sm">Rewards</p>
            <h1 className="text-white text-2xl">My Points</h1>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-yellow-900 text-xs font-medium">Current Points</p>
                <p className="text-yellow-900 font-semibold text-lg">{currentPoints} pts</p>
              </div>
            </div>
            <div className="bg-white/80 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              Active
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Point to Discount Table */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BadgePercent className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Point to Discount</h2>
          </div>

          <div className="space-y-3">
            {pointDiscountRules.map((rule) => (
              <div
                key={rule.points}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
              >
                <p className="text-sm text-gray-700 font-medium">{rule.points} points</p>
                <p className="text-sm font-semibold text-blue-700">{rule.discount} discount</p>
              </div>
            ))}
          </div>
        </div>

        {/* Updated Transparency Rule: 1,000 Ks = 1 Point */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ReceiptText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Declaration</h2>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              <span className="font-semibold">Transparency Rule:</span> Every 1,000 Ks spend gives you 1 point.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">How It Works</h2>
          </div>
          <p className="text-sm text-gray-600">Points are added after each completed order. You can apply your points on the Booking page to get an instant discount before confirming with KBZPay.</p>
        </div>
      </div>
    </div>
  )
}
