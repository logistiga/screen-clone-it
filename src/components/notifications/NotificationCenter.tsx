import { useState } from "react";
import { Bell, Check, Trash2, X, AlertTriangle, Info, CheckCircle, CreditCard, Receipt, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  icon?: "facture" | "credit" | "devis" | "client";
}

// Notifications de démonstration
const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "warning",
    title: "Facture en retard",
    message: "La facture FAC-2026-0003 de TOTAL GABON est en retard de paiement.",
    date: "2026-01-06T10:30:00",
    read: false,
    icon: "facture"
  },
  {
    id: "2",
    type: "info",
    title: "Échéance crédit",
    message: "Une échéance de crédit arrive à terme dans 3 jours.",
    date: "2026-01-06T09:15:00",
    read: false,
    icon: "credit"
  },
  {
    id: "3",
    type: "success",
    title: "Paiement reçu",
    message: "Paiement de 1 249 500 FCFA reçu pour la facture FAC-2026-0001.",
    date: "2026-01-05T16:45:00",
    read: true,
    icon: "facture"
  },
  {
    id: "4",
    type: "info",
    title: "Nouveau devis créé",
    message: "Le devis DEV-2026-0003 a été créé pour MAUREL & PROM.",
    date: "2026-01-05T14:20:00",
    read: true,
    icon: "devis"
  },
  {
    id: "5",
    type: "warning",
    title: "Devis expirant",
    message: "Le devis DEV-2026-0001 expire dans 2 jours.",
    date: "2026-01-05T11:00:00",
    read: true,
    icon: "devis"
  },
];

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

const getTypeStyles = (type: Notification["type"]) => {
  switch (type) {
    case "warning":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "success":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "error":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return "Hier";
    return `Il y a ${days} jours`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nouvelles
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Tout lire
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground">
                <Trash2 className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => {
                const Icon = getIconForNotification(notification);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={cn("p-2 rounded-full shrink-0", getTypeStyles(notification.type))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-medium", !notification.read && "text-foreground")}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.date)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
