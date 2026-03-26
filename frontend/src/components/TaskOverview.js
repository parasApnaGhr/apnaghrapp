import React from 'react';
import { ClipboardList, Users, Building2 } from 'lucide-react';

const TaskOverview = ({ stats }) => {
  const progress = {
    boards: (stats.boards_today / stats.target_boards) * 100,
    brokers: (stats.brokers_today / stats.target_brokers) * 100,
    visits: (stats.visits_today / stats.target_visits) * 100,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
        TODAY'S TASKS
      </h2>

      <div className="space-y-4">
        <div data-testid="boards-progress">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              <span className="font-medium">To-Let Boards</span>
            </div>
            <span className="text-lg font-bold">
              {stats.boards_today} / {stats.target_boards}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(progress.boards, 100)}%` }}
            />
          </div>
        </div>

        <div data-testid="brokers-progress">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Broker Visits</span>
            </div>
            <span className="text-lg font-bold">
              {stats.brokers_today} / {stats.target_brokers}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${Math.min(progress.brokers, 100)}%` }}
            />
          </div>
        </div>

        <div data-testid="visits-progress">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              <span className="font-medium">Site Visits</span>
            </div>
            <span className="text-lg font-bold">
              {stats.visits_today} / {stats.target_visits}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${Math.min(progress.visits, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {progress.boards >= 100 && progress.brokers >= 100 && progress.visits >= 100 && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-700 font-bold text-center">🎉 Daily Target Achieved! +₹500 Incentive</p>
        </div>
      )}
    </div>
  );
};

export default TaskOverview;