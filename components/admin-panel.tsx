'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Users, 
  Ban, 
  UserCheck, 
  Trash2, 
  Crown, 
  Search,
  Activity,
  MessageSquare,
  Clock,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Timer,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface AdminPanelProps {
  adminEmail: string;
  onClose: () => void;
}

interface User {
  _id: string;
  email: string;
  name?: string;
  role?: string;
  isBanned?: boolean;
  bannedAt?: number;
  bannedReason?: string;
  isTimedOut?: boolean;
  timeoutUntil?: number;
  timeoutReason?: string;
  timedOutBy?: string;
  focusMinutes: number;
  streak: {
    currentStreak: number;
    bestStreak: number;
    lastActivityDate: string;
  };
  lastActiveAt: number;
}

export function AdminPanel({ adminEmail, onClose }: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [banReason, setBanReason] = useState('');
  const [timeoutReason, setTimeoutReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [expandedStats, setExpandedStats] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Queries
  const users = useQuery(api.admin.getAllUsers, { adminEmail });
  const stats = useQuery(api.admin.getAdminStats, { adminEmail });

  // Mutations
  const banUser = useMutation(api.admin.banUser);
  const unbanUser = useMutation(api.admin.unbanUser);
  const makeAdmin = useMutation(api.admin.makeAdmin);
  const makeModerator = useMutation(api.admin.makeModerator);
  const removeRole = useMutation(api.admin.removeRole);
  const deleteUserMessages = useMutation(api.admin.deleteUserMessages);
  const timeoutUser = useMutation(api.admin.timeoutUser);
  const removeTimeout = useMutation(api.admin.removeTimeout);

  // Filter users based on search
  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    setActionLoading('ban');
    try {
      await banUser({
        adminEmail,
        userEmail: selectedUser.email,
        reason: banReason || 'Violated community guidelines',
      });
      showNotification(`${selectedUser.name || selectedUser.email} has been banned`, 'success');
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
    } catch (error: any) {
      showNotification(error.message || 'Failed to ban user', 'error');
    }
    setActionLoading(null);
  };

  const handleTimeoutUser = async (duration?: number) => {
    if (!selectedUser) return;
    const loadingKey = duration ? `timeout-${duration}` : 'timeout-lifetime';
    setActionLoading(loadingKey);
    try {
      await timeoutUser({
        moderatorEmail: adminEmail,
        userEmail: selectedUser.email,
        durationMinutes: duration,
        reason: timeoutReason || 'Chat violation',
      });
      const durationText = duration ? `${duration} minutes` : 'permanently';
      showNotification(`${selectedUser.name || selectedUser.email} timed out for ${durationText}`, 'success');
      setShowTimeoutModal(false);
      setTimeoutReason('');
      setSelectedUser(null);
    } catch (error: any) {
      showNotification(error.message || 'Failed to timeout user', 'error');
    }
    setActionLoading(null);
  };

  const handleRemoveTimeout = async (user: User) => {
    setActionLoading(user._id + '-untimeout');
    try {
      await removeTimeout({ moderatorEmail: adminEmail, userEmail: user.email });
      showNotification(`Timeout removed from ${user.name || user.email}`, 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to remove timeout', 'error');
    }
    setActionLoading(null);
  };

  const handleUnbanUser = async (user: User) => {
    setActionLoading(user._id);
    try {
      await unbanUser({ adminEmail, userEmail: user.email });
      showNotification(`${user.name || user.email} has been unbanned`, 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to unban user', 'error');
    }
    setActionLoading(null);
  };

  const handleMakeAdmin = async (user: User) => {
    setActionLoading(user._id + '-admin');
    try {
      await makeAdmin({ adminEmail, userEmail: user.email });
      showNotification(`${user.name || user.email} is now an admin`, 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to make admin', 'error');
    }
    setActionLoading(null);
  };

  const handleMakeModerator = async (user: User) => {
    setActionLoading(user._id + '-mod');
    try {
      await makeModerator({ adminEmail, userEmail: user.email });
      showNotification(`${user.name || user.email} is now a moderator`, 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to make moderator', 'error');
    }
    setActionLoading(null);
  };

  const handleRemoveRole = async (user: User) => {
    setActionLoading(user._id + '-role');
    try {
      await removeRole({ adminEmail, userEmail: user.email });
      showNotification(`Role removed from ${user.name || user.email}`, 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to remove role', 'error');
    }
    setActionLoading(null);
  };

  const handleDeleteMessages = async (user: User) => {
    if (!confirm(`Delete ALL forum messages from ${user.name || user.email}?`)) return;
    setActionLoading(user._id + '-msg');
    try {
      const result = await deleteUserMessages({ adminEmail, userEmail: user.email });
      showNotification(result.message, 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to delete messages', 'error');
    }
    setActionLoading(null);
  };

  const formatLastActive = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatTimeoutRemaining = (until?: number) => {
    if (!until) return 'Permanent';
    const remaining = until - Date.now();
    if (remaining <= 0) return 'Expired';
    const minutes = Math.ceil(remaining / 60000);
    if (minutes < 60) return `${minutes}m left`;
    const hours = Math.ceil(remaining / 3600000);
    return `${hours}h left`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[110] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/90 text-white' 
            : 'bg-red-500/90 text-white'
        }`}>
          {notification.type === 'success' ? <UserCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Panel */}
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
              <p className="text-xs text-white/50">Manage users, moderators & community</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Stats Section */}
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() => setExpandedStats(!expandedStats)}
              className="w-full flex items-center justify-between text-white/80 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Quick Stats</span>
              </div>
              {expandedStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {expandedStats && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
                <StatCard icon={<Users className="h-4 w-4" />} label="Users" value={stats.totalUsers} color="blue" />
                <StatCard icon={<Activity className="h-4 w-4" />} label="Active" value={stats.activeToday} color="green" />
                <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Mods" value={stats.moderators} color="cyan" />
                <StatCard icon={<Ban className="h-4 w-4" />} label="Banned" value={stats.bannedUsers} color="red" />
                <StatCard icon={<Timer className="h-4 w-4" />} label="Timed Out" value={stats.timedOutUsers} color="orange" />
                <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Messages" value={stats.totalMessages} color="purple" />
                <StatCard icon={<Clock className="h-4 w-4" />} label="Focus Hrs" value={stats.totalFocusHours} color="amber" />
              </div>
            )}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="p-4">
            <div className="space-y-2">
              {filteredUsers?.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  isCurrentAdmin={user.email.toLowerCase() === adminEmail.toLowerCase()}
                  actionLoading={actionLoading}
                  onBan={() => { setSelectedUser(user); setShowBanModal(true); }}
                  onUnban={() => handleUnbanUser(user)}
                  onTimeout={() => { setSelectedUser(user); setShowTimeoutModal(true); }}
                  onRemoveTimeout={() => handleRemoveTimeout(user)}
                  onMakeAdmin={() => handleMakeAdmin(user)}
                  onMakeModerator={() => handleMakeModerator(user)}
                  onRemoveRole={() => handleRemoveRole(user)}
                  onDeleteMessages={() => handleDeleteMessages(user)}
                  formatLastActive={formatLastActive}
                  formatTimeoutRemaining={formatTimeoutRemaining}
                />
              ))}
              
              {filteredUsers?.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 rounded-xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Lifetime Ban</h3>
                <p className="text-sm text-white/50">{selectedUser.name || selectedUser.email}</p>
              </div>
            </div>
            
            <p className="text-sm text-white/60 mb-4">
              This will permanently ban the user from the entire app. They won't be able to sign in.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-2">Ban Reason (optional)</label>
              <Input
                type="text"
                placeholder="Violated community guidelines..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => { setShowBanModal(false); setSelectedUser(null); setBanReason(''); }}
                className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBanUser}
                disabled={actionLoading === 'ban'}
                className="flex-1 bg-red-500/80 hover:bg-red-500 text-white"
              >
                {actionLoading === 'ban' ? 'Banning...' : 'Ban Forever'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeout Modal */}
      {showTimeoutModal && selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 rounded-xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Timer className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Timeout User</h3>
                <p className="text-sm text-white/50">{selectedUser.name || selectedUser.email}</p>
              </div>
            </div>
            
            <p className="text-sm text-white/60 mb-4">
              Timeout prevents the user from posting in the forum for a set duration.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-2">Reason (optional)</label>
              <Input
                type="text"
                placeholder="Spamming, inappropriate messages..."
                value={timeoutReason}
                onChange={(e) => setTimeoutReason(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-xs text-white/50">Select duration:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleTimeoutUser(10)}
                  disabled={actionLoading?.startsWith('timeout')}
                  className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 border border-orange-500/30"
                >
                  {actionLoading === 'timeout-10' ? '...' : '10 min'}
                </Button>
                <Button
                  onClick={() => handleTimeoutUser(20)}
                  disabled={actionLoading?.startsWith('timeout')}
                  className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 border border-orange-500/30"
                >
                  {actionLoading === 'timeout-20' ? '...' : '20 min'}
                </Button>
                <Button
                  onClick={() => handleTimeoutUser(30)}
                  disabled={actionLoading?.startsWith('timeout')}
                  className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 border border-orange-500/30"
                >
                  {actionLoading === 'timeout-30' ? '...' : '30 min'}
                </Button>
              </div>
              <Button
                onClick={() => handleTimeoutUser(undefined)}
                disabled={actionLoading?.startsWith('timeout')}
                className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30"
              >
                {actionLoading === 'timeout-lifetime' ? 'Applying...' : '⚠️ Lifetime Timeout (Admin Only)'}
              </Button>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => { setShowTimeoutModal(false); setSelectedUser(null); setTimeoutReason(''); }}
              className="w-full text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
    orange: 'bg-orange-500/20 text-orange-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };
  
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
      <div className={`inline-flex p-1.5 rounded-md mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

// User Card Component
function UserCard({ 
  user, 
  isCurrentAdmin,
  actionLoading,
  onBan, 
  onUnban, 
  onTimeout,
  onRemoveTimeout,
  onMakeAdmin, 
  onMakeModerator,
  onRemoveRole,
  onDeleteMessages,
  formatLastActive,
  formatTimeoutRemaining
}: { 
  user: User;
  isCurrentAdmin: boolean;
  actionLoading: string | null;
  onBan: () => void;
  onUnban: () => void;
  onTimeout: () => void;
  onRemoveTimeout: () => void;
  onMakeAdmin: () => void;
  onMakeModerator: () => void;
  onRemoveRole: () => void;
  onDeleteMessages: () => void;
  formatLastActive: (ts: number) => string;
  formatTimeoutRemaining: (until?: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAdmin = user.role === 'admin';
  const isMod = user.role === 'moderator';
  const isBanned = user.isBanned;
  const isTimedOut = user.isTimedOut;

  return (
    <div className={`rounded-lg border transition-all ${
      isBanned 
        ? 'bg-red-500/10 border-red-500/30' 
        : isTimedOut
          ? 'bg-orange-500/10 border-orange-500/30'
          : isAdmin 
            ? 'bg-purple-500/10 border-purple-500/30'
            : isMod
              ? 'bg-cyan-500/10 border-cyan-500/30'
              : 'bg-white/5 border-white/10'
    }`}>
      {/* Main Row */}
      <div 
        className="p-3 flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
          isBanned 
            ? 'bg-red-500/20 text-red-400'
            : isTimedOut
              ? 'bg-orange-500/20 text-orange-400'
              : isAdmin
                ? 'bg-purple-500/20 text-purple-400'
                : isMod
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-white/10 text-white/70'
        }`}>
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white truncate">{user.name || user.email.split('@')[0]}</span>
            {isAdmin && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-300 flex items-center gap-1">
                <Crown className="h-2.5 w-2.5" /> ADMIN
              </span>
            )}
            {isMod && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/30 text-cyan-300 flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> MOD
              </span>
            )}
            {isBanned && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/30 text-red-300">
                BANNED
              </span>
            )}
            {isTimedOut && !isBanned && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/30 text-orange-300">
                TIMEOUT ({formatTimeoutRemaining(user.timeoutUntil)})
              </span>
            )}
            {isCurrentAdmin && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-300">
                YOU
              </span>
            )}
          </div>
          <div className="text-xs text-white/40 truncate">{user.email}</div>
        </div>
        
        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-white/50">
          <div className="text-right">
            <div className="text-white/70">{user.focusMinutes}m</div>
            <div>focused</div>
          </div>
          <div className="text-right">
            <div className="text-white/70">{user.streak?.currentStreak || 0}🔥</div>
            <div>streak</div>
          </div>
          <div className="text-right">
            <div className="text-white/70">{formatLastActive(user.lastActiveAt)}</div>
            <div>active</div>
          </div>
        </div>
        
        {/* Expand Icon */}
        <div className="text-white/30">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      
      {/* Expanded Actions */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          {/* Mobile Stats */}
          <div className="sm:hidden flex items-center gap-4 text-xs text-white/50 mb-3">
            <span>{user.focusMinutes}m focused</span>
            <span>{user.streak?.currentStreak || 0}🔥 streak</span>
            <span>{formatLastActive(user.lastActiveAt)}</span>
          </div>
          
          {/* Ban/Timeout Info */}
          {isBanned && user.bannedReason && (
            <div className="mb-3 p-2 rounded bg-red-500/10 text-xs text-red-300">
              <strong>Ban reason:</strong> {user.bannedReason}
            </div>
          )}
          {isTimedOut && user.timeoutReason && (
            <div className="mb-3 p-2 rounded bg-orange-500/10 text-xs text-orange-300">
              <strong>Timeout reason:</strong> {user.timeoutReason}
              {user.timedOutBy && <span className="text-white/40"> (by {user.timedOutBy})</span>}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!isCurrentAdmin && (
              <>
                {/* Ban/Unban */}
                {isBanned ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onUnban(); }}
                    disabled={actionLoading === user._id}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                    {actionLoading === user._id ? 'Unbanning...' : 'Unban'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onBan(); }}
                    disabled={isAdmin}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 disabled:opacity-30"
                  >
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    Lifetime Ban
                  </Button>
                )}
                
                {/* Timeout/Untimeout */}
                {isTimedOut ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onRemoveTimeout(); }}
                    disabled={actionLoading === user._id + '-untimeout'}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <Timer className="h-3.5 w-3.5 mr-1.5" />
                    {actionLoading === user._id + '-untimeout' ? 'Removing...' : 'Remove Timeout'}
                  </Button>
                ) : !isBanned && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onTimeout(); }}
                    disabled={isAdmin}
                    className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 disabled:opacity-30"
                  >
                    <Timer className="h-3.5 w-3.5 mr-1.5" />
                    Timeout
                  </Button>
                )}
                
                {/* Role Management */}
                {isAdmin ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onRemoveRole(); }}
                    disabled={actionLoading === user._id + '-role'}
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                    {actionLoading === user._id + '-role' ? 'Removing...' : 'Demote'}
                  </Button>
                ) : isMod ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onMakeAdmin(); }}
                      disabled={actionLoading === user._id + '-admin' || isBanned}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 disabled:opacity-30"
                    >
                      <Crown className="h-3.5 w-3.5 mr-1.5" />
                      {actionLoading === user._id + '-admin' ? 'Promoting...' : 'Make Admin'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onRemoveRole(); }}
                      disabled={actionLoading === user._id + '-role'}
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                      {actionLoading === user._id + '-role' ? 'Removing...' : 'Remove Mod'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onMakeModerator(); }}
                      disabled={actionLoading === user._id + '-mod' || isBanned}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-30"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                      {actionLoading === user._id + '-mod' ? 'Promoting...' : 'Make Mod'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onMakeAdmin(); }}
                      disabled={actionLoading === user._id + '-admin' || isBanned}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 disabled:opacity-30"
                    >
                      <Crown className="h-3.5 w-3.5 mr-1.5" />
                      {actionLoading === user._id + '-admin' ? 'Promoting...' : 'Make Admin'}
                    </Button>
                  </>
                )}
                
                {/* Delete Messages (Admin only) */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onDeleteMessages(); }}
                  disabled={actionLoading === user._id + '-msg'}
                  className="text-white/50 hover:text-white hover:bg-white/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {actionLoading === user._id + '-msg' ? 'Deleting...' : 'Delete All Msgs'}
                </Button>
              </>
            )}
            
            {isCurrentAdmin && (
              <span className="text-xs text-white/30 py-2">This is your account</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Button for Nav
export function AdminButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 gap-1.5"
    >
      <Shield className="h-4 w-4" />
      <span className="hidden sm:inline">Admin</span>
    </Button>
  );
}
