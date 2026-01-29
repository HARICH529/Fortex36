import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  MapPin,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import Leaderboard from '../components/Leaderboard';

const Dashboard = () => {
  const { stats, loading, error } = useReports();
  const navigate = useNavigate();

  const handleSeverityClick = (data) => {
    if (data && data.name) {
      const severityMap = {
        'Minor issue': 'LOW',
        'Moderate issue': 'MEDIUM', 
        'Severe issue': 'HIGH'
      };
      const severity = severityMap[data.name] || data.name.toUpperCase();
      navigate(`/reports?severity=${severity}`);
    }
  };

  const handleDepartmentClick = (data) => {
    if (data && data.name) {
      const departmentMap = {
        'Sanitation and Waste Management': 'Sanitation',
        'Roads and Transport': 'Roads',
        'Electricity and Streetlights': 'Electricity',
        'Water Supply and Drainage': 'Water',
        'Public Health': 'Health',
        'Environment': 'Environment',
        'Public Safety': 'Safety'
      };
      const department = departmentMap[data.name] || data.name;
      navigate(`/reports?department=${department}`);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200">
        Error: {error}
      </div>
    </div>
  );

  const departmentData = Object.entries(stats.byDepartment).map(([name, value]) => ({
    name,
    value
  }));

  const severityData = Object.entries(stats.bySeverity).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, trend, onClick }) => (
    <div 
      className="glass-panel p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer" 
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bgClass} transition-colors group-hover:scale-110 duration-300`}>
          <Icon size={24} className={colorClass} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-sm">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-emerald-600 font-semibold">{trend}</span>
          <span className="text-gray-400 font-medium">vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-1">Monitor key metrics and ongoing civic operations</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-gray-200 text-sm text-gray-500 shadow-sm">
          <Clock size={16} className="text-blue-500" />
          Last updated: <span className="font-medium text-gray-700">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reports"
          value={stats.total}
          icon={FileText}
          colorClass="text-blue-600"
          bgClass="bg-blue-50 group-hover:bg-blue-100"
          trend="+12.5%"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Pending Review"
          value={stats.submitted}
          icon={Clock}
          colorClass="text-amber-600"
          bgClass="bg-amber-50 group-hover:bg-amber-100"
          onClick={() => navigate('/reports?status=SUBMITTED')}
        />
        <StatCard
          title="In Progress"
          value={stats.acknowledged}
          icon={Activity}
          colorClass="text-orange-600"
          bgClass="bg-orange-50 group-hover:bg-orange-100"
          onClick={() => navigate('/reports?status=ACKNOWLEDGED')}
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50 group-hover:bg-emerald-100"
          trend="+8.2%"
          onClick={() => navigate('/reports?status=RESOLVED')}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution - Takes up 2 columns */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Reports by Department</h3>
              <p className="text-sm text-gray-500">Distribution of issues across different sectors • Click bars to filter</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <MapPin size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#colorValue)"
                  radius={[6, 6, 0, 0]}
                  barSize={50}
                  onClick={handleDepartmentClick}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution - Takes up 1 column */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Severity Levels</h3>
              <p className="text-sm text-gray-500">Breakdown by priority • Click segments to filter</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <AlertTriangle size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="h-[350px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={handleSeverityClick}
                  style={{ cursor: 'pointer' }}
                >
                  {severityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-800">{stats.total}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Actions & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-panel p-6 rounded-2xl h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/reports')}
              className="w-full group flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 hover:from-blue-100 hover:to-blue-50 rounded-xl border border-blue-100 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <FileText size={18} />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-blue-700">View All Reports</span>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/reports?status=SUBMITTED')}
              className="w-full group flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-50/50 hover:from-amber-100 hover:to-amber-50 rounded-xl border border-amber-100 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                  <Clock size={18} />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-gray-700 group-hover:text-amber-700">Review Pending</span>
                  <span className="text-xs text-amber-600/80 font-medium">{stats.submitted} reports waiting</span>
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/reports?severity=HIGH')}
              className="w-full group flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-50/50 hover:from-red-100 hover:to-red-50 rounded-xl border border-red-100 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg text-white shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                  <AlertTriangle size={18} />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-red-700">Critical Issues</span>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* Leaderboard - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;