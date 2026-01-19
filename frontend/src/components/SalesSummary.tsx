import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import api from '../services/api'
import { SalesSummary as SalesSummaryType, RecordFilters } from '../types'

function SalesSummary() {
  const [summary, setSummary] = useState<SalesSummaryType | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RecordFilters>({})

  useEffect(() => {
    fetchSummary()
  }, [filters])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.zone) params.append('zone', filters.zone)
      if (filters.sold_by) params.append('sold_by', filters.sold_by)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)

      const response = await api.get<SalesSummaryType>(`/sales/summary?${params}`)
      setSummary(response.data)
    } catch (error: any) {
      console.error('Error fetching sales summary:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load sales summary'
      console.error('Error details:', error.response?.data)
      alert(`Failed to load sales summary: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

  // Format month for display
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Prepare data for charts
  const prepareMonthlyData = () => {
    const combined = [...(summary?.monthly_trends || []), ...(summary?.projected_sales || [])]
    return combined.map(item => ({
      month: formatMonth(item.month),
      monthKey: item.month,
      actualCount: summary?.monthly_trends.find(m => m.month === item.month)?.count || 0,
      projectedCount: summary?.projected_sales.find(m => m.month === item.month)?.count || 0,
      actualRevenue: summary?.monthly_trends.find(m => m.month === item.month)?.revenue || 0,
      projectedRevenue: summary?.projected_sales.find(m => m.month === item.month)?.revenue || 0,
      isProjected: !!summary?.projected_sales.find(m => m.month === item.month)
    }))
  }

  const prepareZoneData = () => {
    if (!summary) return []
    return Object.entries(summary.by_zone)
      .map(([zone, count]) => ({
        zone,
        count,
        revenue: summary.by_zone_revenue[zone] || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  const prepareLeadSourceData = () => {
    if (!summary) return []
    return Object.entries(summary.by_lead_source)
      .map(([source, count]) => ({
        source,
        count,
        revenue: summary.by_lead_source_revenue[source] || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }

  const prepareSoldByData = () => {
    if (!summary) return []
    return Object.entries(summary.by_sold_by)
      .map(([soldBy, count]) => ({
        soldBy,
        count,
        revenue: summary.by_sold_by_revenue[soldBy] || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
      </div>
    )
  }

  if (!summary) {
    return <div className="text-center py-12 dark:text-gray-400">No summary data available</div>
  }

  const monthlyData = prepareMonthlyData()
  const zoneData = prepareZoneData()
  const leadSourceData = prepareLeadSourceData()
  const soldByData = prepareSoldByData()

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Sales Summary</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive sales analytics and projections</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Zone</label>
            <input
              type="text"
              value={filters.zone || ''}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value || undefined })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Filter by zone"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sold By</label>
            <input
              type="text"
              value={filters.sold_by || ''}
              onChange={(e) => setFilters({ ...filters, sold_by: e.target.value || undefined })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Filter by salesperson"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date From</label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date To</label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({})}
            className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">#</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Orders</dt>
                  <dd className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total_records}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold text-xl">₹</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Revenue</dt>
                  <dd className="text-3xl font-bold text-gray-900 dark:text-white">
                    {summary.total_revenue ? `₹${Math.round(summary.total_revenue).toLocaleString()}` : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Avg Order Value</dt>
                  <dd className="text-3xl font-bold text-gray-900 dark:text-white">
                    {summary.average_order_value ? `₹${Math.round(summary.average_order_value).toLocaleString()}` : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold text-xl">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Projected Next Month</dt>
                  <dd className="text-3xl font-bold text-gray-900 dark:text-white">
                    {summary.projected_sales.length > 0 ? summary.projected_sales[0].count : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Breakdown */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Orders with Price</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.order_details.orders_with_price}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {summary.order_details.total_orders > 0 
                  ? `${Math.round((summary.order_details.orders_with_price / summary.order_details.total_orders) * 100)}% of total`
                  : '0%'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Highest Order</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{Math.round(summary.order_details.highest_order).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Lowest Order</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{Math.round(summary.order_details.lowest_order).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Trends with Projections */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sales Trends & Projections</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monthly order count and revenue with 3-month projections</p>
        </div>
        <div className="p-6">
          {monthlyData.length > 0 ? (
            <div className="space-y-8">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                    tick={{ fill: '#6b7280' }}
                    style={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="actualCount" 
                    name="Actual Orders" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projectedCount" 
                    name="Projected Orders" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    formatter={(value: number | undefined) => value ? `₹${Math.round(value).toLocaleString()}` : '₹0'}
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="actualRevenue" name="Actual Revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="projectedRevenue" name="Projected Revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No sales data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Breakdowns - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Breakdown by Zone */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Revenue by Zone</h3>
          </div>
          <div className="p-6">
            {zoneData.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={zoneData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis type="number" stroke="#6b7280" className="dark:stroke-gray-400" />
                    <YAxis 
                      dataKey="zone" 
                      type="category" 
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value: number | undefined) => value ? `₹${Math.round(value).toLocaleString()}` : '₹0'}
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {zoneData.map((item, index) => (
                    <div key={item.zone} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.zone}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">₹{Math.round(item.revenue).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.count} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No zone data available</p>
            )}
          </div>
        </div>

        {/* Breakdown by Lead Source */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Revenue by Lead Source</h3>
          </div>
          <div className="p-6">
            {leadSourceData.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const name = props.name || ''
                        const percent = props.percent || 0
                        return `${name}: ${(percent * 100).toFixed(0)}%`
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {leadSourceData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number | undefined) => value ? `₹${Math.round(value).toLocaleString()}` : '₹0'}
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {leadSourceData.map((item, index) => (
                    <div key={item.source} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.source}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">₹{Math.round(item.revenue).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.count} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No lead source data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown by Sold By */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance by Salesperson</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Orders and revenue breakdown by salesperson</p>
        </div>
        <div className="p-6">
          {soldByData.length > 0 ? (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={soldByData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="soldBy" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                    tick={{ fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:stroke-gray-400"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Salesperson</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {soldByData.map((item) => (
                      <tr key={item.soldBy} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{item.soldBy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                          ₹{Math.round(item.revenue).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {item.count > 0 ? `₹${Math.round(item.revenue / item.count).toLocaleString()}` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No salesperson data available</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesSummary
