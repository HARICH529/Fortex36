import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
    Bell,
    MapPin,
    Clock,
    AlertTriangle,
    CheckCircle,
    X,
    Shield,
    Activity,
    ZoomIn
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const LiveReports = () => {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        resolved: 0
    });
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [chartData, setChartData] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    const [timeRange, setTimeRange] = useState('24h');
    const timeRangeRef = useRef('24h');

    // Audio ref for notifications
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    const fetchChartData = async (range = timeRangeRef.current) => {
        try {
            const response = await fetch(`http://localhost:3000/api/v1/reports/traffic?range=${range}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                setChartData(result.data);
            } else if (response.status === 401 || response.status === 403) {
                console.warn('Authentication failed fetching chart:', response.status);
                // Redirect to login if token is invalid/expired
                localStorage.removeItem('adminToken');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Failed to fetch traffic data', error);
        }
    };

    useEffect(() => {
        const newSocket = io('http://localhost:3000');

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setConnectionStatus('connected');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setConnectionStatus('disconnected');
        });

        // Check for admin token on mount
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.warn('No admin token found, redirecting to login');
            localStorage.removeItem('adminToken'); // Ensure it's cleared
            window.location.href = '/login';
            return;
        }

        newSocket.on('initialReports', (data) => {
            setReports(data);
            updateStats(data);
            fetchChartData();
        });

        newSocket.on('newReport', (report) => {
            setReports(prev => {
                const newReports = [report, ...prev];
                updateStats(newReports);
                return newReports;
            });

            // Play notification sound
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));

            // Refetch chart data to ensure accuracy
            fetchChartData();
        });

        newSocket.on('reportStatusUpdated', (updatedReport) => {
            setReports(prev => prev.map(r =>
                r._id === updatedReport._id ? updatedReport : r
            ));
            setReports(currentReports => {
                const updated = currentReports.map(r =>
                    r._id === updatedReport._id ? updatedReport : r
                );
                updateStats(updated);
                return updated;
            });
        });

        return () => newSocket.close();
    }, []); // Persistent connection - no reconnect on timeRange change

    // Effect to fetch chart data when timeRange changes
    useEffect(() => {
        timeRangeRef.current = timeRange;
        fetchChartData(timeRange);
    }, [timeRange]);

    const updateStats = (currentReports) => {
        const newStats = currentReports.reduce((acc, curr) => {
            acc.total++;
            if (curr.reportStatus === 'RESOLVED') acc.resolved++;
            else acc.active++;
            return acc;
        }, { total: 0, active: 0, resolved: 0 });
        setStats(newStats);
    };

    const handleAcknowledge = async (reportId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/v1/reports/${reportId}/acknowledge`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                // Optimistic update
                setReports(prev => prev.map(r =>
                    r._id === reportId ? { ...r, reportStatus: 'ACKNOWLEDGED' } : r
                ));
            } else if (response.status === 401 || response.status === 403) {
                console.error('Authentication failed:', response.status);
                // Redirect to login if token is invalid/expired
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error acknowledging report:', error);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-500 shadow-red-500/50';
            case 'high': return 'bg-orange-500 shadow-orange-500/50';
            case 'medium': return 'bg-yellow-500 shadow-yellow-500/50';
            default: return 'bg-blue-500 shadow-blue-500/50';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'ACKNOWLEDGED': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Live Operations Center
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Activity size={16} className="text-blue-500 animate-pulse" />
                        Real-time incident monitoring and response
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${connectionStatus === 'connected'
                    ? 'bg-green-50 text-green-700 border-green-200 shadow-green-100'
                    : 'bg-red-50 text-red-700 border-red-200'
                    } shadow-sm transition-all duration-300`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`} />
                    <span className="text-sm font-medium capitalize">
                        Status: {connectionStatus}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl bg-white/40 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                            <Bell size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            +12% <Activity size={12} />
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-sm text-gray-500 font-medium">Total Incidents</div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl bg-white/40 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{stats.active}</div>
                    <div className="text-sm text-gray-500 font-medium">Active Threats</div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl bg-white/40 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{stats.resolved}</div>
                    <div className="text-sm text-gray-500 font-medium">Resolved Cases</div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl bg-white/40 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                            <Shield size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">98%</div>
                    <div className="text-sm text-gray-500 font-medium">System Uptime</div>
                </div>
            </div>

            {/* Live Chart Section */}
            <div className="glass-panel p-6 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl bg-white/60">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        Incident Traffic
                    </h2>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-white/50 border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="time"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Reports Feed */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 px-1">
                    <div className="w-2 h-8 bg-blue-500 rounded-full" />
                    Incoming Reports
                </h2>

                {reports.length === 0 ? (
                    <div className="text-center py-20 glass-panel rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">Waiting for new reports...</p>
                    </div>
                ) : (
                    reports.map((report, index) => {
                        const isEven = index % 2 === 0;
                        return (
                            <div
                                key={report._id || index}
                                className="glass-panel group p-6 rounded-2xl border border-white/20 shadow-sm hover:shadow-xl transition-all duration-300 bg-white/60 hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getSeverityColor(report.severity)}`} />

                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Image Section */}
                                    {report.image_url && (
                                        <div
                                            className="group/image relative shrink-0 cursor-zoom-in overflow-hidden rounded-xl w-full md:w-[180px] h-[120px] shadow-sm border border-gray-100"
                                            onClick={() => setSelectedImage(report.image_url)}
                                        >
                                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors duration-300 z-10 flex items-center justify-center">
                                                <ZoomIn className="text-white opacity-0 group-hover/image:opacity-100 transform scale-75 group-hover/image:scale-100 transition-all duration-300" size={24} />
                                            </div>
                                            <img
                                                src={report.image_url}
                                                alt="Evidence"
                                                className="w-full h-full object-cover transform group-hover/image:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    )}

                                    {/* Content Section */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${report.severity?.toLowerCase() === 'critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        report.severity?.toLowerCase() === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}>
                                                        {report.severity || 'Normal'} priority
                                                    </span>
                                                    <span className="text-gray-400 text-xs flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(report.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                                    {report.description}
                                                </h3>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.reportStatus)} shadow-sm`}>
                                                {report.reportStatus}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50/50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                                            <MapPin size={14} className="text-gray-400" />
                                            {report.address || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <button
                                                onClick={() => handleAcknowledge(report._id)}
                                                disabled={report.reportStatus !== 'SUBMITTED'}
                                                className={`
                                                    px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm
                                                    ${report.reportStatus === 'SUBMITTED'
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/20 active:scale-95'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                {report.reportStatus === 'SUBMITTED' ? (
                                                    <>
                                                        <CheckCircle size={16} />
                                                        Acknowledge Alert
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={16} />
                                                        {report.reportStatus === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Processed'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size evidence"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}


        </div>
    );
};

export default LiveReports;
