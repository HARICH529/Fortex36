import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Star, RefreshCw } from 'lucide-react';
import api from '../services/api';

const Leaderboard = () => {
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaderboard/monthly');

      if (response.data.success) {
        setMonthlyLeaderboard(response.data.data.leaderboard);
      } else {
        setError('Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Error fetching leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown size={20} className="text-yellow-400 drop-shadow-sm" />;
      case 2: return <Medal size={20} className="text-gray-300 drop-shadow-sm" />;
      case 3: return <Award size={20} className="text-amber-600 drop-shadow-sm" />;
      default: return <Star size={16} className="text-gray-400" />;
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Platinum': return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <div className="text-red-500 mb-4 font-medium">Error: {error}</div>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">Monthly Leaderboard</h3>
            <p className="text-xs text-gray-500 font-medium">Top active citizens</p>
          </div>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-all"
          title="Refresh Leaderboard"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {monthlyLeaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Trophy size={48} className="mb-2 opacity-20" />
            <p>No data available yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthlyLeaderboard.map((user, index) => (
              <div
                key={user._id}
                className={`flex items-center p-3 rounded-xl transition-all border ${index < 3
                    ? 'bg-gradient-to-r from-white to-gray-50 border-gray-100 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white/50'
                  }`}
              >
                <div className="flex items-center justify-center w-8 h-8 shrink-0">
                  {getRankIcon(index + 1)}
                  <span className={`ml-2 text-sm font-bold ${index < 3 ? 'text-gray-800' : 'text-gray-500'}`}>
                    #{index + 1}
                  </span>
                </div>

                <div className="flex-1 ml-3 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getBadgeColor(user.badge)}`}>
                    {user.badge}
                  </span>
                  <div className="text-sm font-bold text-blue-600 min-w-[3ch] text-right">
                    {user.monthlyPoints}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;