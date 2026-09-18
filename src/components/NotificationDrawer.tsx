import React from 'react';
import { AppNotification } from '../types';
import {
  X,
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  CheckCheck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectPuFromNotif: (puId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectPuFromNotif,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'alert':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-emerald-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Notifikasi Otomatis Tim</h2>
              <p className="text-[11px] text-slate-400">
                Peringatan berkala data kritis & pembaruan evaluasi DAS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action toolbar */}
        <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold text-[11px]"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
              <Bell className="w-8 h-8 text-slate-700 mb-2" />
              <span>Belum ada notifikasi terkini.</span>
            </div>
          ) : (
            notifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) onMarkRead(notif.id);
                    if (notif.petakUkurId) {
                      onSelectPuFromNotif(notif.petakUkurId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer relative group ${
                    notif.isRead
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-80'
                      : 'bg-slate-850 border-slate-700/80 text-slate-200 shadow-md ring-1 ring-cyan-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-100 text-xs truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.timestamp.split(' ')[1] || notif.timestamp}
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">
                        {notif.message}
                      </p>

                      {notif.petakUkurId && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 group-hover:text-cyan-300">
                          <span>Buka Petak Ukur Terkait</span>
                          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {!notif.isRead && (
                    <div className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Sinkronisasi otomatis aktif &bull; Semua peringatan dicatat real-time
        </div>
      </div>
    </div>
  );
};
