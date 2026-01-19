import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Record } from '../types'
import api from '../services/api'

interface RecordDetailModalProps {
  record: Record
  isOpen: boolean
  onClose: () => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

function RecordDetailModal({ record, isOpen, onClose, onEdit, onDelete }: RecordDetailModalProps) {
  const [relatedRecords, setRelatedRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<Record>(record)

  useEffect(() => {
    setCurrentRecord(record)
  }, [record])

  useEffect(() => {
    if (isOpen && currentRecord.client_phone) {
      fetchRelatedRecords()
    } else {
      setRelatedRecords([])
    }
  }, [isOpen, currentRecord.client_phone, currentRecord.id])

  const fetchRelatedRecords = async () => {
    if (!currentRecord.client_phone) {
      setRelatedRecords([])
      return
    }
    
    setLoading(true)
    try {
      const response = await api.get(`/records/history/${encodeURIComponent(currentRecord.client_phone)}?exclude_id=${currentRecord.id}&limit=10`)
      setRelatedRecords(response.data.records)
    } catch (error) {
      console.error('Error fetching related records:', error)
      setRelatedRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewRelatedRecord = async (relatedRecord: Record) => {
    try {
      // Fetch full record details
      const response = await api.get(`/records/${relatedRecord.id}`)
      setCurrentRecord(response.data)
      setRelatedRecords([]) // Clear history to avoid confusion
    } catch (error) {
      console.error('Error fetching record:', error)
      // Fallback to edit if fetch fails
      onEdit(relatedRecord.id)
      onClose()
    }
  }

  const calculateWarrantyStatus = () => {
    if (!currentRecord.date_of_delivery) return { status: 'out_of_warranty', expiry: null, daysRemaining: 0 }
    
    const delivery = new Date(currentRecord.date_of_delivery)
    const expiry = new Date(delivery)
    expiry.setFullYear(expiry.getFullYear() + 1)
    const today = new Date()
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining < 0) return { status: 'out_of_warranty', expiry, daysRemaining: Math.abs(daysRemaining) }
    if (daysRemaining <= 30) return { status: 'expiring_soon', expiry, daysRemaining }
    return { status: 'in_warranty', expiry, daysRemaining }
  }

  const warranty = calculateWarrantyStatus()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity duration-300"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{currentRecord.client_name}</h3>
                <p className="text-sm text-primary-100 dark:text-primary-200 font-mono">{currentRecord.record_id}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 dark:hover:text-gray-300 text-3xl font-light leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Current Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b-2 border-primary-500 dark:border-primary-400">Current Information</h4>
                
                {/* Warranty Status Card */}
                <div className={`mb-6 p-5 rounded-xl border-2 ${
                  warranty.status === 'out_of_warranty' 
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700' 
                    : warranty.status === 'expiring_soon'
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'
                    : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                }`}>
                  <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Warranty Status</h5>
                  {warranty.status === 'out_of_warranty' && (
                    <div className="text-red-800 dark:text-red-300">
                      <span className="text-lg font-bold">Out of Warranty</span>
                      {warranty.expiry && (
                        <p className="text-sm mt-1">Expired {Math.floor(warranty.daysRemaining)} days ago</p>
                      )}
                      {warranty.expiry && (
                        <p className="text-xs mt-1 opacity-75">Expired: {format(warranty.expiry, 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                  )}
                  {warranty.status === 'expiring_soon' && (
                    <div className="text-yellow-800 dark:text-yellow-300">
                      <span className="text-lg font-bold">Expiring Soon</span>
                      <p className="text-sm mt-1">{warranty.daysRemaining} days remaining</p>
                      {warranty.expiry && (
                        <p className="text-xs mt-1 opacity-75">Expires: {format(warranty.expiry, 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                  )}
                  {warranty.status === 'in_warranty' && (
                    <div className="text-green-800 dark:text-green-300">
                      <span className="text-lg font-bold">In Warranty</span>
                      <p className="text-sm mt-1">{warranty.daysRemaining} days remaining</p>
                      {warranty.expiry && (
                        <p className="text-xs mt-1 opacity-75">Expires: {format(warranty.expiry, 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Dates Section */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Delivery Date</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {format(new Date(currentRecord.date_of_delivery), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  {currentRecord.date_of_installation && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Installation Date</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {format(new Date(currentRecord.date_of_installation), 'MMMM dd, yyyy')}
                      </p>
                      {currentRecord.installation_done_by && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">By: {currentRecord.installation_done_by}</p>
                      )}
                    </div>
                  )}
                  {currentRecord.date_of_site_visit && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Site Visit Date</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {format(new Date(currentRecord.date_of_site_visit), 'MMMM dd, yyyy')}
                      </p>
                      {currentRecord.site_visit_done_by && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">By: {currentRecord.site_visit_done_by}</p>
                      )}
                    </div>
                  )}
                  {currentRecord.commission_done_by && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Commission Done By</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{currentRecord.commission_done_by}</p>
                    </div>
                  )}
                </div>

                {/* Machine Details */}
                {(currentRecord.capacity_kw || currentRecord.heater || currentRecord.controller || currentRecord.card || currentRecord.body) && (
                  <div className="mb-6">
                    <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Machine Details</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {currentRecord.capacity_kw && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Capacity</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRecord.capacity_kw} KW</p>
                        </div>
                      )}
                      {currentRecord.heater && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Heater</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRecord.heater}</p>
                        </div>
                      )}
                      {currentRecord.controller && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Controller</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRecord.controller}</p>
                        </div>
                      )}
                      {currentRecord.card && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Card</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRecord.card}</p>
                        </div>
                      )}
                      {currentRecord.body && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Body</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRecord.body}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Commercial */}
                {(currentRecord.sale_price || currentRecord.sold_by || currentRecord.lead_source) && (
                  <div className="mb-6">
                    <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Commercial</h5>
                    <div className="space-y-3">
                      {currentRecord.sale_price && (
                        <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-lg border border-primary-200 dark:border-primary-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sale Price</p>
                          <p className="text-lg font-bold text-primary-700 dark:text-primary-400">₹{currentRecord.sale_price.toLocaleString()}</p>
                        </div>
                      )}
                      {currentRecord.sold_by && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sold By</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRecord.sold_by}</p>
                        </div>
                      )}
                      {currentRecord.lead_source && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lead Source</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRecord.lead_source}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Client & History */}
              <div>
                {/* Client Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b-2 border-primary-500 dark:border-primary-400">Client Information</h4>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Client Name</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{currentRecord.client_name}</p>
                    </div>
                    {currentRecord.client_phone && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentRecord.client_phone}</p>
                      </div>
                    )}
                    {currentRecord.client_address && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Address</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{currentRecord.client_address}</p>
                      </div>
                    )}
                    {currentRecord.zone && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Zone</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentRecord.zone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* History */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b-2 border-primary-500 dark:border-primary-400">History</h4>
                  {currentRecord.client_phone ? (
                    <>
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading history...</p>
                        </div>
                      ) : relatedRecords.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {relatedRecords.map((relatedRecord) => (
                            <div 
                              key={relatedRecord.id}
                              className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                              onClick={() => {
                                handleViewRelatedRecord(relatedRecord)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{relatedRecord.client_name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{relatedRecord.record_id}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {format(new Date(relatedRecord.date_of_delivery), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <span className="text-primary-600 dark:text-primary-400 font-bold ml-3">→</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No previous records found for this client</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No phone number available to fetch history</p>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                {currentRecord.remarks && (
                  <div className="mt-8">
                    <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Remarks</h5>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{currentRecord.remarks}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => onEdit(currentRecord.id)}
              className="w-full inline-flex justify-center items-center rounded-lg shadow-sm px-5 py-2.5 bg-primary-600 dark:bg-primary-700 text-base font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all sm:ml-3 sm:w-auto sm:text-sm"
            >
              Edit Record
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this record?')) {
                  onDelete(currentRecord.id)
                  onClose()
                }
              }}
              className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-5 py-2.5 bg-white dark:bg-gray-700 text-base font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all sm:mt-0 sm:w-auto sm:text-sm"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-5 py-2.5 bg-white dark:bg-gray-700 text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecordDetailModal
