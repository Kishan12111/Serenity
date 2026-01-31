'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth, useUserIdentifier } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X, Flame, ArrowLeft, Trash2, Timer, ShieldCheck, Crown, AlertCircle, UserPlus } from 'lucide-react';

// Generate avatar color from username
function getAvatarColor(name: string): string {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from username
function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

interface FocusForumProps {
  onClose: () => void;
}

// Focus Forum - floating chat bubbles style
export function FocusForum({ onClose }: FocusForumProps) {
  const { user, isAuthenticated } = useAuth();
  const userIdentifier = useUserIdentifier();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [makingModEmail, setMakingModEmail] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState<{ email: string; name: string } | null>(null);
  const [timeoutReason, setTimeoutReason] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.forum.getMessages, { limit: 30 });
  const sendMessageMutation = useMutation(api.forum.sendMessage);
  const deleteMessageMutation = useMutation(api.admin.deleteMessage);
  const timeoutUserMutation = useMutation(api.admin.timeoutUser);
  const makeModeratorMutation = useMutation(api.admin.makeModerator);
  
  // Check if current user is admin or moderator
  const modStatus = useQuery(api.admin.checkModeratorStatus, 
    user?.email ? { email: user.email } : "skip"
  );
  const isAdminOrMod = modStatus?.isAdmin || modStatus?.isModerator;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || !userIdentifier) return;

    setIsSending(true);
    setSendError(null);
    try {
      await sendMessageMutation({
        ...userIdentifier,
        message: message.trim(),
      });
      setMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setSendError(parseErrorMessage(error.message || 'Failed to send message'));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user?.email || !isAdminOrMod) return;
    setDeletingId(messageId);
    try {
      await deleteMessageMutation({
        moderatorEmail: user.email,
        messageId: messageId as Id<"forumMessages">,
      });
      setSelectedMessage(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTimeoutUser = async (duration?: number) => {
    if (!user?.email || !showTimeoutModal) return;
    try {
      await timeoutUserMutation({
        moderatorEmail: user.email,
        userEmail: showTimeoutModal.email,
        durationMinutes: duration,
        reason: timeoutReason || 'Forum violation',
      });
      setShowTimeoutModal(null);
      setTimeoutReason('');
    } catch (error: any) {
      console.error('Failed to timeout user:', error);
    }
  };

  const handleMakeModerator = async (email: string) => {
    if (!user?.email || !modStatus?.isAdmin) return;
    setMakingModEmail(email);
    try {
      await makeModeratorMutation({
        adminEmail: user.email,
        userEmail: email,
      });
      setSelectedMessage(null);
    } catch (error: any) {
      console.error('Failed to make moderator:', error);
    } finally {
      setMakingModEmail(null);
    }
  };

  // Parse clean error messages from Convex errors
  const parseErrorMessage = (error: string): string => {
    // Remove Convex error prefix if present
    let msg = error.replace(/^Uncaught Error:\s*/i, '').trim();
    
    // Clean up common error patterns
    if (msg.toLowerCase().includes('you are banned')) {
      const reason = msg.split(':')[1]?.trim();
      return reason ? `Banned: ${reason}` : 'Your account has been banned';
    }
    if (msg.toLowerCase().includes('you are timed out')) {
      const match = msg.match(/timed out for (\d+ minute\(s\)|permanently)/i);
      if (match) {
        return `Timed out ${match[1]}. Please wait before sending messages.`;
      }
      return 'You are temporarily timed out from chat';
    }
    
    return msg || 'Failed to send message';
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <span className="text-white/30 text-xs">{messages?.length || 0} messages</span>
      </div>

      {/* Floating messages area - no scrollbar visible */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-end no-scrollbar"
      >
        <div className="space-y-4">
          {!messages ? (
            <div className="text-white/30 text-sm text-center py-8">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-white/30 text-sm text-center py-8">
              No messages yet. Be the first!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = user?.email === msg.userEmail;
              const avatarColor = getAvatarColor(msg.userName);
              const isSelected = selectedMessage === msg._id;
              
              return (
                <div
                  key={msg._id}
                  className={`flex items-start gap-3 animate-fade-in ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center border border-white/10`}>
                    <span className="text-white text-sm font-bold">{getInitials(msg.userName)}</span>
                  </div>
                  
                  {/* Message bubble */}
                  <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                      <span className="text-white text-sm font-medium drop-shadow-sm">{msg.userName}</span>
                      {/* Admin/Mod badges */}
                      {msg.userRole === 'admin' && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px]">
                          <Crown className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      )}
                      {msg.userRole === 'moderator' && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 text-[10px]">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Mod
                        </span>
                      )}
                      {msg.userStreak && msg.userStreak > 0 && (
                        <span className="text-orange-400 text-xs flex items-center gap-0.5 drop-shadow-sm">
                          <Flame className="h-3 w-3" />
                          {msg.userStreak}
                        </span>
                      )}
                    </div>
                    <div 
                      className={`inline-block rounded-2xl px-4 py-2.5 border backdrop-blur-md shadow-lg cursor-pointer transition-all ${
                        isOwnMessage ? 'bg-purple-500/30' : 'bg-black/40'
                      } ${isSelected ? 'border-red-500/50 ring-2 ring-red-500/30' : 'border-white/20'}`}
                      onClick={() => isAdminOrMod && setSelectedMessage(isSelected ? null : msg._id)}
                    >
                      <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                    </div>
                    
                    {/* Mod actions when message selected */}
                    {isSelected && isAdminOrMod && (
                      <div className={`flex items-center gap-2 mt-2 flex-wrap ${isOwnMessage ? 'justify-end' : ''}`}>
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          disabled={deletingId === msg._id}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingId === msg._id ? 'Deleting...' : 'Delete'}
                        </button>
                        {msg.userEmail && msg.userEmail !== user?.email && (
                          <>
                            <button
                              onClick={() => setShowTimeoutModal({ email: msg.userEmail!, name: msg.userName })}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs hover:bg-orange-500/30 transition-colors"
                            >
                              <Timer className="h-3 w-3" />
                              Timeout
                            </button>
                            {/* Only admins can make moderators */}
                            {modStatus?.isAdmin && (
                              <button
                                onClick={() => handleMakeModerator(msg.userEmail!)}
                                disabled={makingModEmail === msg.userEmail}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                              >
                                <UserPlus className="h-3 w-3" />
                                {makingModEmail === msg.userEmail ? 'Making...' : 'Make Mod'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="px-6 py-3 shrink-0">
        {/* Error message */}
        {sendError && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{sendError}</span>
            <button onClick={() => setSendError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        {/* Mod indicator */}
        {isAdminOrMod && (
          <div className="flex items-center gap-1.5 mb-2 text-xs">
            {modStatus?.isAdmin ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                <Crown className="h-3 w-3" /> Admin Mode
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                <ShieldCheck className="h-3 w-3" /> Mod Mode
              </span>
            )}
            <span className="text-white/30">Click messages to moderate</span>
          </div>
        )}
        
        {!isAuthenticated && (
          <p className="text-amber-400/50 text-xs mb-2 text-center">
            Sign in to chat with your identity
          </p>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something..."
            maxLength={500}
            className="flex-1 h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20 rounded-full px-4"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full h-8 w-8 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {/* Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-5 rounded-xl bg-slate-900/95 border border-white/10 shadow-2xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Timer className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Timeout User</h3>
                <p className="text-xs text-white/50">{showTimeoutModal.name}</p>
              </div>
            </div>
            
            <Input
              value={timeoutReason}
              onChange={(e) => setTimeoutReason(e.target.value)}
              placeholder="Reason (optional)..."
              className="mb-3 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => handleTimeoutUser(10)}
                className="px-3 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition-colors border border-orange-500/30"
              >
                10 min
              </button>
              <button
                onClick={() => handleTimeoutUser(20)}
                className="px-3 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition-colors border border-orange-500/30"
              >
                20 min
              </button>
              <button
                onClick={() => handleTimeoutUser(30)}
                className="px-3 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition-colors border border-orange-500/30"
              >
                30 min
              </button>
            </div>
            
            {modStatus?.isAdmin && (
              <button
                onClick={() => handleTimeoutUser(undefined)}
                className="w-full px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors border border-red-500/30 mb-3"
              >
                ⚠️ Lifetime Timeout
              </button>
            )}
            
            <button
              onClick={() => { setShowTimeoutModal(null); setTimeoutReason(''); }}
              className="w-full px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Floating chat button
interface FloatingChatBubbleProps {
  onClick: () => void;
  unreadCount: number;
  disabled?: boolean;
}

export function FloatingChatBubble({ onClick, unreadCount, disabled }: FloatingChatBubbleProps) {
  if (disabled) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full p-3.5 shadow-lg transition-all hover:scale-105 active:scale-95"
      title="Open Focus Forum"
    >
      <MessageCircle className="h-5 w-5 text-white/80" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// Floating messages during focus mode - messages float up and fade
interface FloatingMessagesProps {
  disabled?: boolean;
}

interface FloatingMessage {
  id: string;
  userName: string;
  message: string;
  userStreak?: number;
  timestamp: number;
}

export function FloatingMessages({ disabled }: FloatingMessagesProps) {
  const [visibleMessages, setVisibleMessages] = useState<FloatingMessage[]>([]);
  const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());
  const messages = useQuery(api.forum.getMessages, !disabled ? { limit: 10 } : "skip");
  const previousMessagesRef = useRef<string[]>([]);

  // Watch for new messages and show them
  useEffect(() => {
    if (!messages || disabled) return;

    const currentIds = messages.map(m => m._id);
    const previousIds = previousMessagesRef.current;
    
    // Find new messages
    const newMessages = messages.filter(m => 
      !previousIds.includes(m._id) && m.createdAt > lastMessageTime
    );

    if (newMessages.length > 0) {
      const newFloatingMessages: FloatingMessage[] = newMessages.map(m => ({
        id: m._id,
        userName: m.userName,
        message: m.message,
        userStreak: m.userStreak,
        timestamp: Date.now(),
      }));

      setVisibleMessages(prev => [...prev, ...newFloatingMessages].slice(-3));
      setLastMessageTime(Date.now());
    }

    previousMessagesRef.current = currentIds;
  }, [messages, disabled, lastMessageTime]);

  // Remove messages after 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages(prev => 
        prev.filter(m => Date.now() - m.timestamp < 8000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (disabled || visibleMessages.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-30 flex flex-col gap-3 max-w-xs pointer-events-none">
      {visibleMessages.map((msg) => {
        const age = Date.now() - msg.timestamp;
        const opacity = age > 6000 ? Math.max(0, 1 - (age - 6000) / 2000) : 1;
        const avatarColor = getAvatarColor(msg.userName);
        
        return (
          <div
            key={msg.id}
            className="flex items-start gap-3 p-3 rounded-2xl border border-white/20 bg-black/50 backdrop-blur-md shadow-lg transition-all duration-500"
            style={{ 
              opacity,
              transform: `translateY(${(1 - opacity) * -10}px)`,
            }}
          >
            {/* Avatar */}
            <div className={`shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center border border-white/20`}>
              <span className="text-white text-xs font-bold">{getInitials(msg.userName)}</span>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white drop-shadow-sm">{msg.userName}</span>
                {msg.userStreak && msg.userStreak > 0 && (
                  <span className="text-xs text-orange-400 flex items-center gap-0.5 drop-shadow-sm">
                    <Flame className="h-3 w-3" />
                    {msg.userStreak}
                  </span>
                )}
              </div>
              <p className="text-white text-sm leading-snug line-clamp-2">{msg.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mini chat panel
interface MiniChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
}

export function MiniChatPanel({ isOpen, onClose, onExpand }: MiniChatPanelProps) {
  const { user } = useAuth();
  const userIdentifier = useUserIdentifier();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.forum.getMessages, isOpen ? { limit: 20 } : "skip");
  const sendMessageMutation = useMutation(api.forum.sendMessage);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || !userIdentifier) return;

    setIsSending(true);
    try {
      await sendMessageMutation({
        ...userIdentifier,
        message: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 w-80 h-[400px] bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <span className="text-sm font-medium text-white/80">Focus Forum</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onExpand}
            className="text-white/40 hover:text-white/70 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            title="Expand"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/70 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages - hidden scrollbar */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col justify-end no-scrollbar"
      >
        <div className="space-y-3">
          {!messages ? (
            <div className="text-white/30 text-xs text-center py-4">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-white/30 text-xs text-center py-4">No messages yet</div>
          ) : (
            messages.slice(-20).map((msg) => {
              const isOwnMessage = user?.email === msg.userEmail;
              const avatarColor = getAvatarColor(msg.userName);
              
              return (
                <div
                  key={msg._id}
                  className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  {/* Mini Avatar */}
                  <div className={`shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center border border-white/10`}>
                    <span className="text-white text-[10px] font-bold">{getInitials(msg.userName)}</span>
                  </div>
                  
                  <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    {!isOwnMessage && (
                      <span className="text-[10px] text-white/60 mb-0.5 block">{msg.userName}</span>
                    )}
                    <span className={`inline-block rounded-xl px-3 py-1.5 text-xs max-w-[85%] border border-white/20 ${
                      isOwnMessage ? 'bg-purple-500/30 text-white' : 'bg-black/40 text-white'
                    }`}>
                      {msg.message}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/5 shrink-0">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Quick message..."
            maxLength={500}
            className="flex-1 h-8 text-xs bg-white/5 border-white/5 text-white placeholder:text-white/30 rounded-full px-4"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            size="sm"
            className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white border-0 rounded-full p-0"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </form>
    </div>
  );
}
