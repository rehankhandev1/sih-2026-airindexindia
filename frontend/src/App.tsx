import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Plane, TrendingUp, CheckCircle, Database } from 'lucide-react'

// URL pointing to our running FastAPI backend
const API_BASE = "http://127.0.0.1:8000/api"

function App() {
  const [indexData, setIndexData] = useState<any>(null)
  const [routeData, setRouteData] = useState<any[]>([])
  const [sampleFares, setSampleFares] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [idx, routes, fares] = await Promise.all([
          axios.get(`${API_BASE}/index/latest`),
          axios.get(`${API_BASE}/routes/metrics`),
          axios.get(`${API_BASE}/fares/sample`)
        ])
        
        setIndexData(idx.data)
        
        // Process route data to build the "Lead-Time Elasticity" chart
        const elasticityMap: any = {}
        routes.data.forEach((item: any) => {
          if (!elasticityMap[item.advance_days]) {
            elasticityMap[item.advance_days] = { advance_days: item.advance_days, average_fare: 0, count: 0 }
          }
          elasticityMap[item.advance_days].average_fare += item.total_fare
          elasticityMap[item.advance_days].count += 1
        })
        
        const elasticityChart = Object.values(elasticityMap).map((d: any) => ({
          advance_days: `T+${d.advance_days}`,
          fare: Math.round(d.average_fare / d.count)
        })).sort((a: any, b: any) => parseInt(a.advance_days.slice(2)) - parseInt(b.advance_days.slice(2)))

        setRouteData(elasticityChart)
        setSampleFares(fares.data.reverse().slice(0, 10)) // Show the 10 most recent observations
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-xl font-semibold text-blue-600">
      Loading AirIndex India System...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Plane className="text-blue-600" />
          AirIndex India
        </h1>
        <p className="text-gray-500 mt-2">Real-time Airfare Price Index for CPI Augmentation (MoSPI Prototype)</p>
      </header>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium">Current Airfare Index</h3>
            <TrendingUp className="text-blue-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{indexData?.index || "100.0"}</p>
          <p className="text-sm text-green-600 mt-2 font-medium">Base Period: 100.0</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium">Routes Tracked</h3>
            <CheckCircle className="text-green-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{indexData?.routes_tracked || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Active representative routes</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium">Observations Processed</h3>
            <Database className="text-purple-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{indexData?.observations_processed || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Latest collection cycle</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Lead-Time Elasticity (Advance Booking Effect)</h3>
          <div style={{ width: '100%', height: '288px' }}>
            <ResponsiveContainer>
              <LineChart data={routeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="advance_days" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip formatter={(value) => [`₹${value}`, "Avg Fare"]} />
                <Legend />
                <Line type="monotone" dataKey="fare" stroke="#2563eb" strokeWidth={3} dot={{r: 6}} name="Average Fare (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Observations Overview</h3>
          <div style={{ width: '100%', height: '288px' }}>
            <ResponsiveContainer>
              <BarChart data={sampleFares.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="destination" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, "Total Fare"]} />
                <Bar dataKey="total_fare" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Fare (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Quality Transparency Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Latest Processed Observations (Data Transparency)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-medium">Airline</th>
                <th className="p-4 font-medium">Route</th>
                <th className="p-4 font-medium">Travel Date</th>
                <th className="p-4 font-medium">Advance Days</th>
                <th className="p-4 font-medium">Total Fare</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleFares.map((fare, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-900 font-medium">{fare.airline}</td>
                  <td className="p-4 text-sm text-gray-600">{fare.origin} → {fare.destination}</td>
                  <td className="p-4 text-sm text-gray-500">{fare.travel_date}</td>
                  <td className="p-4 text-sm text-gray-500">T+{fare.advance_days}</td>
                  <td className="p-4 text-sm text-gray-900 font-bold">₹{fare.total_fare}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      {fare.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default App