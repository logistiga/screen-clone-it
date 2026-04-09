import { Bell, Package, FileText, DollarSign, AlertTriangle, Check, Trash2, Ship, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationType } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  'conteneur.synced': { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  'facture.created': { icon: FileText, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  'caisse.mouvement': { icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  'anomalie.detectee': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  'armateur.synced': { icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  'sync.error': { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll } = useRealtimeNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications temps réel</p>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-72">
              <div className="space-y-1 p-1">
                {notifications.map(notif => {
                  const cfg = typeConfig[notif.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 rounded-md px-3 py-2 transition-colors ${
                        notif.read ? 'opacity-60' : 'bg-muted/50'
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full p-1.5 ${cfg.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-tight">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DropdownMenuSeparator />
            <div className="flex items-center gap-1 p-1">
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-8" onClick={markAllRead}>
                <Check className="h-3.5 w-3.5 mr-1" /> Tout marquer comme lu
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Vider
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
