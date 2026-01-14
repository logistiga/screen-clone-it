import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  Check, 
  Trash2, 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  CreditCard, 
  Receipt, 
  FileText, 
  Users, 
  RefreshCw, 
  Loader2, 
  Wallet,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationCenter } from "@/hooks/use-notifications";
import { Notification } from "@/services/notificationsService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      return FileText;
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

const getTypeBadge = (type: Notification["type"]) => {
  switch (type) {
    case "warning":
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Alerte</Badge>;
    case "success":
      return <Badge variant="outline" className="border-green-500 text-green-600">Succès</Badge>;
    case "error":
      return <Badge variant="outline" className="border-red-500 text-red-600">Erreur</Badge>;
    default:
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Info</Badge>;
  }
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.icon === 'facture') {
      navigate('/factures');
    } else if (notification.icon === 'credit') {
      navigate('/credits');
    } else if (notification.icon === 'devis') {
      navigate('/devis');
    } else if (notification.icon === 'paiement') {
      navigate('/paiements');
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread" && n.read) return false;
    if (activeTab === "read" && !n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    warning: notifications.filter(n => n.type === 'warning').length,
    success: notifications.filter(n => n.type === 'success').length,
    info: notifications.filter(n => n.type === 'info').length,
    error: notifications.filter(n => n.type === 'error').length,
  };

  return (
    <MainLayout title="Notifications">
      <div className="space-y-6">
        {/* En-tête avec stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-600">
                  <Info className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Non lues</p>
                  <p className="text-2xl font-bold">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/10 text-amber-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alertes</p>
                  <p className="text-2xl font-bold">{stats.warning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Succès</p>
                  <p className="text-2xl font-bold">{stats.success}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions et filtres */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualiser
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Tout supprimer
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="info">Informations</SelectItem>
                <SelectItem value="warning">Alertes</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="error">Erreurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des notifications */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  Toutes
                  <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Non lues
                  {stats.unread > 0 && (
                    <Badge className="ml-2 bg-primary">{stats.unread}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read">Lues</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading && filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-10 w-10 mb-3 animate-spin opacity-50" />
                <p className="text-sm">Chargement des notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucune notification</p>
                <p className="text-sm">
                  {activeTab === "unread" 
                    ? "Vous avez lu toutes vos notifications !" 
                    : "Aucune notification à afficher."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map(notification => {
                  const Icon = getIconForNotification(notification);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer relative group",
                        !notification.read && "bg-primary/5 border-primary/20"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className={cn("p-3 rounded-full shrink-0 h-fit", getTypeStyles(notification.type))}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={cn(
                                "font-medium",
                                !notification.read ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {notification.title}
                              </p>
                              {getTypeBadge(notification.type)}
                              {!notification.read && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
