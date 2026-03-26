import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../utils/api';
import { Trophy, Medal, Award } from 'lucide-react';
import { toast } from 'sonner';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await dashboardAPI.getLeaderboard();
      setLeaderboard(response.data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-orange-600" />;
    return <Award className="w-5 h-5 text-slate-400" />;
  };

  const getRankBg = (rank) => {
    if (rank === 0) return 'bg-yellow-50 border-yellow-200';
    if (rank === 1) return 'bg-slate-50 border-slate-200';
    if (rank === 2) return 'bg-orange-50 border-orange-200';
    return 'bg-white border-slate-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-black" style={{ fontFamily: 'Barlow Condensed' }}>
              LEADERBOARD
            </h1>
          </div>
          <p className="text-slate-500">Top performing field riders</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <div className="space-y-3">
          {leaderboard.map((rider, index) => (
            <div
              key={rider.rider_id}
              className={`flex items-center gap-4 p-6 border rounded-xl transition-all ${getRankBg(
                index
              )}`}
              data-testid={`leaderboard-rank-${index + 1}`}
            >
              <div className="flex items-center justify-center w-12 h-12">
                {getRankIcon(index)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold">{rider.name}</h3>
                  <span className="badge-neutral text-xs">{rider.city}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-600">
                    <strong className="text-emerald-600">{rider.boards}</strong> Boards
                  </span>
                  <span className="text-slate-600">
                    <strong className="text-orange-600">{rider.brokers}</strong> Brokers
                  </span>
                  <span className="text-slate-600">
                    <strong className="text-sky-600">{rider.visits}</strong> Visits
                  </span>
                  {rider.packages_sold > 0 && (
                    <span className="text-slate-600">
                      <strong className="text-indigo-600">{rider.packages_sold}</strong> Sales
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-500">Score</p>
                <p
                  className="text-3xl font-black"
                  style={{ fontFamily: 'Barlow Condensed' }}
                  data-testid={`rider-score-${rider.rider_id}`}
                >
                  {rider.score}
                </p>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No riders in the leaderboard yet</p>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="font-bold mb-3" style={{ fontFamily: 'Barlow Condensed' }}>
            SCORING SYSTEM
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>• To-Let Board: <strong>+1 point</strong></p>
            <p>• Broker Visit: <strong>+2 points</strong></p>
            <p>• Site Visit: <strong>+3 points</strong></p>
            <p>• Package Sale: <strong>+10 points</strong></p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;