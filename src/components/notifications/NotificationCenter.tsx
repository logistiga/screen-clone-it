import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, X, AlertTriangle, Info, CheckCircle, CreditCard, Receipt, FileText, Users, RefreshCw, Loader2, Wallet, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotificationCenter, useNewNotificationDetector } from "@/hooks/use-notifications";
import type { Notification } from "@/services/notificationsService";
import { useState } from "react";

const getIconForNotification = (notification: Notification) => {
  switch (notification.icon) {
    case "facture":
      return Receipt;
    case "credit":
      return CreditCard;
    case "devis":
      return FileText;
    case "client":
      return Users;
    case "paiement":
      return Wallet;
    case "ordre":
      return ClipboardList;
    default:
      switch (notification.type) {
        case "warning":
          return AlertTriangle;
        case "success":
          return CheckCircle;
        case "error":
          return AlertTriangle;
        default:
          return Info;
      }
  }
};

const getIconStyles = (type: Notification["type"]) => {
  switch (type) {
    case "warning":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/50",
        border: "border-amber-200 dark:border-amber-800",
        icon: "text-amber-600 dark:text-amber-400",
      };
    case "success":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        border: "border-emerald-200 dark:border-emerald-800",
        icon: "text-emerald-600 dark:text-emerald-400",
      };
    case "error":
      return {
        bg: "bg-red-50 dark:bg-red-950/50",
        border: "border-red-200 dark:border-red-800",
        icon: "text-red-600 dark:text-red-400",
      };
    default:
      return {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-800",
        icon: "text-blue-600 dark:text-blue-400",
      };
  }
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
  } = useNotificationCenter();
  
  // Détecteur de nouvelles notifications (affiche un toast)
  useNewNotificationDetector();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigation basée sur le type de notification
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    } else if (notification.icon === 'facture') {
      navigate('/factures');
      setOpen(false);
    } else if (notification.icon === 'credit') {
      navigate('/credits');
      setOpen(false);
    } else if (notification.icon === 'devis') {
      navigate('/devis');
      setOpen(false);
    } else if (notification.icon === 'paiement') {
      navigate('/paiements');
      setOpen(false);
    } else if (notification.icon === 'ordre') {
      navigate('/ordres');
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={refresh}
              disabled={isLoading}
              title="Actualiser"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead} 
                className="h-7 text-xs px-2 gap-1"
                title="Tout marquer comme lu"
              >
                <Check className="h-3 w-3" />
                Tout lire
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={clearAll}
                title="Effacer tout"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Liste des notifications */}
        <ScrollArea className="max-h-[420px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 mb-3 animate-spin opacity-40" />
              <p className="text-sm">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Bell className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-xs mt-1 opacity-70">Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification, index) => {
                const Icon = getIconForNotification(notification);
                const styles = getIconStyles(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative px-4 py-3 hover:bg-muted/50 transition-all cursor-pointer group",
                      !notification.read && "bg-primary/[0.03]",
                      index !== notifications.length - 1 && "border-b border-border/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Indicateur non lu */}
                      {!notification.read && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2">
                          <span className="block w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                      
                      {/* Icône */}
                      <div className={cn(
                        "shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center",
                        styles.bg,
                        styles.border
                      )}>
                        <Icon className={cn("h-5 w-5", styles.icon)} />
                      </div>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={cn(
                          "text-sm font-medium leading-tight",
                          !notification.read ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-medium">
                          {formatDate(notification.date)}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/20">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-primary hover:text-primary font-medium h-8"
              onClick={() => {
                navigate('/notifications');
                setOpen(false);
              }}
            >
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
