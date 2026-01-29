import React, { useState } from 'react';
import { X, Calendar, MapPin, AlertTriangle, Eye } from 'lucide-react';

const ReportsModal = ({ isOpen, onClose, reports, filterType, filterValue }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  if (!isOpen) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800';
      case 'ACKNOWLEDGED': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ReportDetailModal = ({ report, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Report Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Title</h4>
            <p className="text-gray-600">{report.title}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
            <p className="text-gray-600">{report.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Department</h4>
              <p className="text-gray-600">{report.department}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Severity</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                {report.severity}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Status</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.reportStatus)}`}>
                {report.reportStatus}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Upvotes</h4>
              <p className="text-gray-600">{report.upvotes}</p>
            </div>
          </div>
          
          {report.address && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Address</h4>
              <p className="text-gray-600">{report.address}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Coordinates</h4>
            <p className="text-gray-600">
              {report.location?.coordinates?.[1]}, {report.location?.coordinates?.[0]}
            </p>
          </div>
          
          {report.image_url && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Image</h4>
              <img 
                src={report.image_url} 
                alt="Report" 
                className="w-full max-w-md h-auto rounded-lg"
              />
            </div>
          )}
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Reported by</h4>
            <p className="text-gray-600">
              {report.userId?.name || 'Unknown'} ({report.userId?.email})
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Created</h4>
            <p className="text-gray-600">{formatDate(report.createdAt)}</p>
          </div>
          
          {report.mlClassified && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">ML Classification</h4>
              <div className="space-y-1 text-sm">
                <p>Department: {report.mlDepartment}</p>
                <p>Severity: {report.mlSeverity}</p>
                <p>Confidence: {report.mlConfidence?.department}% (Dept), {report.mlConfidence?.severity}% (Severity)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {filterType === 'severity' ? `${filterValue} Severity Reports` : `${filterValue} Department Reports`}
              </h2>
              <p className="text-sm text-gray-500">{reports.length} reports found</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reports found for this filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{report.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </button>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.reportStatus)}`}>
                          {report.reportStatus}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {report.address || 'Location not specified'}
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {report.department}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </>
  );
};

export default ReportsModal;