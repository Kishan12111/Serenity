'use client';

import { useConvexStats } from '@/lib/useConvexStats';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DayStat {
  date: string;
  totalMinutes: number;
  sessions: number;
}

export function StatsDashboard() {
  const { 
    todayStats, 
    streak, 
    lifetimeTotals, 
    statsRange,
    isLoading 
  } = useConvexStats();

  // Process weekly data (last 7 days)
  const weeklyChartData = (statsRange as DayStat[]).slice(-7).map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    minutes: day.totalMinutes,
  }));

  // Process monthly data (last 30 days)
  const monthlyChartData = (statsRange as DayStat[]).map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    minutes: day.totalMinutes,
  }));

  // Calculate weekly and monthly totals
  const weeklyFocus = (statsRange as DayStat[]).slice(-7).reduce((sum, day) => sum + day.totalMinutes, 0);
  const monthlyFocus = (statsRange as DayStat[]).reduce((sum, day) => sum + day.totalMinutes, 0);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-3 md:px-4 flex items-center justify-center h-full">
        <div className="text-white/60">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-3 md:px-4 flex flex-col gap-4 h-full overflow-hidden">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 flex-shrink-0">
        {/* Today's Focus */}
        <div className="bg-black/35 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-white/70 text-sm font-medium mb-2">Today&apos;s Focus</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {todayStats.totalMinutes}
            <span className="text-lg text-white/60 ml-2">min</span>
          </p>
        </div>

        {/* Weekly Focus */}
        <div className="bg-black/35 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-white/70 text-sm font-medium mb-2">This Week</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {weeklyFocus}
            <span className="text-lg text-white/60 ml-2">min</span>
          </p>
        </div>

        {/* Monthly Focus */}
        <div className="bg-black/35 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-white/70 text-sm font-medium mb-2">This Month</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {monthlyFocus}
            <span className="text-lg text-white/60 ml-2">min</span>
          </p>
        </div>

        {/* Lifetime Focus */}
        <div className="bg-black/35 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-white/70 text-sm font-medium mb-2">Lifetime Focus</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
            {lifetimeTotals.focusMinutes}
            <span className="text-lg text-white/60 ml-2">min</span>
          </p>
        </div>

        {/* Streak Info - Fixed overflow */}
        <div className="bg-black/35 p-4 rounded-2xl border border-orange-400/30 backdrop-blur-sm bg-gradient-to-br from-orange-500/10 to-red-500/10 col-span-2 md:col-span-1 overflow-hidden">
          <p className="text-white/70 text-sm font-medium mb-2">Your Streak</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-2xl shrink-0">🔥</div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-white truncate">{streak.currentStreak}</p>
                <p className="text-xs text-white/60">current</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-yellow-400">{streak.bestStreak}</p>
              <p className="text-xs text-white/60">best</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 flex-1 min-h-0">
        {/* Weekly Chart */}
        <div className="bg-black/35 p-4 rounded-2xl border border-white/10 backdrop-blur-sm min-h-0">
          <h3 className="text-lg font-bold text-white mb-2">📊 Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)',
                }}
                cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
              />
              <Bar
                dataKey="minutes"
                fill="url(#gradientBar)"
                radius={[12, 12, 0, 0]}
              />
              <defs>
                <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                  <stop offset="100%" stopColor="rgb(236, 72, 153)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Chart */}
        <div className="bg-black/35 p-4 rounded-2xl border border-white/10 backdrop-blur-sm min-h-0">
          <h3 className="text-lg font-bold text-white mb-2">📈 Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.4)"
                style={{ fontSize: '11px' }}
                interval={3}
              />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="rgb(59, 130, 246)"
                strokeWidth={3}
                dot={{ fill: 'rgb(59, 130, 246)', r: 5 }}
                activeDot={{ r: 7, fill: 'rgb(59, 130, 246)' }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Motivational Section */}
      <div className="bg-black/35 p-4 rounded-2xl border border-white/10 backdrop-blur-sm flex-shrink-0">
        <h3 className="text-lg font-bold text-white mb-3">💡 Quick Focus Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/80 text-sm leading-relaxed">
          <div className="flex gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="font-semibold text-white mb-1">25/5 cadence</p>
              <p className="text-white/70">Short sprints with tiny breaks keep energy high.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-semibold text-white mb-1">Keep the streak</p>
              <p className="text-white/70">Even a 5-minute win protects your chain.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">🌙</span>
            <div>
              <p className="font-semibold text-white mb-1">Calm setting</p>
              <p className="text-white/70">Pick a soft scene, mute alerts, and breathe.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
