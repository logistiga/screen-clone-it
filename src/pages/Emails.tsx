import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DocumentStatCard,
  DocumentFilters,
  DocumentEmptyState
} from "@/components/shared/documents";
import { 
  Mail, 
  Settings, 
  FileText, 
  Zap, 
  Send, 
  Edit, 
  Eye,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  TestTube,
  Server,
  Clock,
  Users,
  FileCheck,
  Receipt,
  Truck,
  AlertCircle,
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

// Import React Query hooks
import {
  useEmailTemplates,
  useEmailAutomations,
  useEmailConfig,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useDuplicateEmailTemplate,
  useToggleEmailTemplate,
  usePreviewEmailTemplate,
  useCreateEmailAutomation,
  useUpdateEmailAutomation,
  useDeleteEmailAutomation,
  useToggleEmailAutomation,
  useUpdateEmailConfig,
  useSendTestEmail,
  useEmailDeclencheurs,
  useEmailDelaiUnites,
} from "@/hooks/use-emails";

import type { EmailTemplate, EmailAutomation, EmailConfig } from "@/services/emailService";

const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  devis: { label: "Devis", icon: <FileText className="h-4 w-4" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  ordre: { label: "Ordre de travail", icon: <Truck className="h-4 w-4" />, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  facture: { label: "Facture", icon: <Receipt className="h-4 w-4" />, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  relance: { label: "Relance", icon: <AlertCircle className="h-4 w-4" />, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  confirmation: { label: "Confirmation", icon: <Check className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  notification: { label: "Notification", icon: <Bell className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  custom: { label: "Personnalisé", icon: <FileText className="h-4 w-4" />, color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" }
};

const typeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "devis", label: "Devis" },
  { value: "ordre", label: "Ordre de travail" },
  { value: "facture", label: "Facture" },
  { value: "relance", label: "Relance" },
  { value: "confirmation", label: "Confirmation" },
  { value: "notification", label: "Notification" },
  { value: "custom", label: "Personnalisé" }
];

const statusFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function EmailsPage() {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [automationSearch, setAutomationSearch] = useState("");
  const [automationStatusFilter, setAutomationStatusFilter] = useState("all");
  
  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<EmailAutomation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewData, setPreviewData] = useState<{ objet: string; contenu: string } | null>(null);
  
  // Form states
  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({
    nom: "",
    type: "custom",
    objet: "",
    contenu: "",
    actif: true
  });
  
  const [automationForm, setAutomationForm] = useState<Partial<EmailAutomation>>({
    nom: "",
    declencheur: "creation_devis",
    template_id: 0,
    delai: 0,
    delai_unite: "minutes",
    actif: true,
    conditions: ""
  });
  
  const [testEmail, setTestEmail] = useState("");
  const [testTemplateId, setTestTemplateId] = useState<number | null>(null);
  
  // Config state
  const [configForm, setConfigForm] = useState<Partial<EmailConfig>>({});

  // React Query hooks
  const { 
    data: templatesData, 
    isLoading: isLoadingTemplates, 
    refetch: refetchTemplates 
  } = useEmailTemplates({
    search: searchTerm || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    actif: statusFilter === "actif" ? true : statusFilter === "inactif" ? false : undefined,
  });

  const { 
    data: automationsData, 
    isLoading: isLoadingAutomations, 
    refetch: refetchAutomations 
  } = useEmailAutomations({
    search: automationSearch || undefined,
    actif: automationStatusFilter === "actif" ? true : automationStatusFilter === "inactif" ? false : undefined,
  });

  const { 
    data: configData, 
    isLoading: isLoadingConfig 
  } = useEmailConfig();

  const { data: declencheurs } = useEmailDeclencheurs();
  const { data: delaiUnites } = useEmailDelaiUnites();

  // Mutations
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();
  const duplicateTemplate = useDuplicateEmailTemplate();
  const toggleTemplate = useToggleEmailTemplate();
  const previewTemplate = usePreviewEmailTemplate();
  
  const createAutomation = useCreateEmailAutomation();
  const updateAutomation = useUpdateEmailAutomation();
  const deleteAutomation = useDeleteEmailAutomation();
  const toggleAutomation = useToggleEmailAutomation();
  
  const updateConfig = useUpdateEmailConfig();
  const sendTestEmail = useSendTestEmail();

  // Update config form when data loads
  useEffect(() => {
    if (configData) {
      setConfigForm(configData);
    }
  }, [configData]);

  // Computed data
  const templates = templatesData?.data || [];
  const automations = automationsData?.data || [];

  const stats = useMemo(() => ({
    totalTemplates: templatesData?.total || templates.length,
    activeTemplates: templates.filter(t => t.actif).length,
    totalAutomations: automationsData?.total || automations.length,
    activeAutomations: automations.filter(a => a.actif).length
  }), [templates, automations, templatesData, automationsData]);

  const handleRefresh = () => {
    refetchTemplates();
    refetchAutomations();
  };

  // Template handlers
  const handleOpenAddTemplate = () => {
    setTemplateForm({
      nom: "",
      type: "custom",
      objet: "",
      contenu: "",
      actif: true
    });
    setIsEditing(false);
    setShowTemplateModal(true);
  };

  const handleOpenEditTemplate = (template: EmailTemplate) => {
    setTemplateForm(template);
    setSelectedTemplate(template);
    setIsEditing(true);
    setShowTemplateModal(true);
  };

  const handlePreviewTemplate = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    try {
      const result = await previewTemplate.mutateAsync(template.id);
      setPreviewData(result.preview);
    } catch (error) {
      setPreviewData(null);
    }
    setShowPreviewModal(true);
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    duplicateTemplate.mutate(template.id);
  };

  const handleDeleteTemplate = (template: EmailTemplate) => {
    deleteTemplate.mutate(template.id);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.nom || !templateForm.objet || !templateForm.contenu) {
      return;
    }

    if (isEditing && selectedTemplate) {
      updateTemplate.mutate({
        id: selectedTemplate.id,
        data: templateForm
      }, {
        onSuccess: () => setShowTemplateModal(false)
      });
    } else {
      createTemplate.mutate(templateForm, {
        onSuccess: () => setShowTemplateModal(false)
      });
    }
  };

  const handleToggleTemplate = (template: EmailTemplate) => {
    toggleTemplate.mutate(template.id);
  };

  // Automation handlers
  const handleOpenAddAutomation = () => {
    setAutomationForm({
      nom: "",
      declencheur: "creation_devis",
      template_id: templates[0]?.id || 0,
      delai: 0,
      delai_unite: "minutes",
      actif: true,
      conditions: ""
    });
    setIsEditing(false);
    setShowAutomationModal(true);
  };

  const handleOpenEditAutomation = (automation: EmailAutomation) => {
    setAutomationForm(automation);
    setSelectedAutomation(automation);
    setIsEditing(true);
    setShowAutomationModal(true);
  };

  const handleDeleteAutomation = (automation: EmailAutomation) => {
    deleteAutomation.mutate(automation.id);
  };

  const handleSaveAutomation = () => {
    if (!automationForm.nom || !automationForm.template_id) {
      return;
    }

    if (isEditing && selectedAutomation) {
      updateAutomation.mutate({
        id: selectedAutomation.id,
        data: automationForm
      }, {
        onSuccess: () => setShowAutomationModal(false)
      });
    } else {
      createAutomation.mutate(automationForm, {
        onSuccess: () => setShowAutomationModal(false)
      });
    }
  };

  const handleToggleAutomation = (automation: EmailAutomation) => {
    toggleAutomation.mutate(automation.id);
  };

  // Config handlers
  const handleSaveConfig = () => {
    updateConfig.mutate(configForm);
  };

  // Test email handler
  const handleSendTestEmail = () => {
    if (!testEmail || !testTemplateId) {
      return;
    }
    sendTestEmail.mutate(
      { email: testEmail, templateId: testTemplateId },
      {
        onSuccess: () => {
          setShowTestModal(false);
          setTestEmail("");
          setTestTemplateId(null);
        }
      }
    );
  };

  const getTemplateById = (id: number) => templates.find(t => t.id === id);
  const getDeclencheurLabel = (key: string) => declencheurs?.[key] || key;
  const getDelaiUniteLabel = (key: string) => delaiUnites?.[key] || key;

  const isRefreshing = isLoadingTemplates || isLoadingAutomations;

  return (
    <MainLayout title="Gestion des Emails">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestion des Emails</h1>
            <p className="text-muted-foreground">Gérez vos modèles d'emails et automatisations</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={() => setShowTestModal(true)} variant="outline" className="gap-2">
              <TestTube className="h-4 w-4" />
              Email de test
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DocumentStatCard
            title="Total modèles"
            value={stats.totalTemplates}
            icon={FileText}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Modèles actifs"
            value={stats.activeTemplates}
            icon={CheckCircle}
            variant="success"
            delay={0.1}
          />
          <DocumentStatCard
            title="Automatisations"
            value={stats.totalAutomations}
            icon={Zap}
            variant="warning"
            delay={0.2}
          />
          <DocumentStatCard
            title="Auto. actives"
            value={stats.activeAutomations}
            icon={Bell}
            variant="info"
            delay={0.3}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Modèles
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Zap className="h-4 w-4" />
              Automatisation
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Modèles d'emails</h2>
                <p className="text-sm text-muted-foreground">Gérez vos modèles d'emails pour chaque type de document</p>
              </div>
              <Button onClick={handleOpenAddTemplate} className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Nouveau modèle
              </Button>
            </div>

            <DocumentFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Rechercher un modèle..."
              statutFilter={statusFilter}
              onStatutChange={setStatusFilter}
              statutOptions={statusFilterOptions}
              categorieFilter={typeFilter}
              onCategorieChange={setTypeFilter}
              categorieOptions={typeFilterOptions}
            />

            {isLoadingTemplates ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <DocumentEmptyState
                icon={Mail}
                title="Aucun modèle trouvé"
                description="Aucun modèle d'email ne correspond à vos critères de recherche."
                actionLabel="Nouveau modèle"
                onAction={handleOpenAddTemplate}
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4"
              >
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    variants={itemVariants}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`transition-all duration-200 hover:shadow-md ${!template.actif ? "opacity-60" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl ${typeLabels[template.type]?.color || typeLabels.custom.color}`}>
                              {typeLabels[template.type]?.icon || typeLabels.custom.icon}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium">{template.nom}</h3>
                                <Badge variant="outline" className={typeLabels[template.type]?.color || typeLabels.custom.color}>
                                  {typeLabels[template.type]?.label || "Personnalisé"}
                                </Badge>
                                {!template.actif && (
                                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactif
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{template.objet}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(template.variables || []).slice(0, 4).map(v => (
                                  <Badge key={v} variant="outline" className="text-xs bg-muted/50">
                                    {`{{${v}}}`}
                                  </Badge>
                                ))}
                                {(template.variables || []).length > 4 && (
                                  <Badge variant="outline" className="text-xs bg-muted/50">
                                    +{template.variables.length - 4} autres
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={template.actif}
                              onCheckedChange={() => handleToggleTemplate(template)}
                              disabled={toggleTemplate.isPending}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handlePreviewTemplate(template)} 
                              className="hover:bg-primary/10"
                              disabled={previewTemplate.isPending}
                            >
                              {previewTemplate.isPending && selectedTemplate?.id === template.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditTemplate(template)} className="hover:bg-primary/10">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDuplicateTemplate(template)} 
                              className="hover:bg-primary/10"
                              disabled={duplicateTemplate.isPending}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteTemplate(template)} 
                              className="hover:bg-destructive/10"
                              disabled={deleteTemplate.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Automatisation des emails</h2>
                <p className="text-sm text-muted-foreground">Configurez l'envoi automatique des emails selon les événements</p>
              </div>
              <Button onClick={handleOpenAddAutomation} className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Nouvelle automatisation
              </Button>
            </div>

            <DocumentFilters
              searchTerm={automationSearch}
              onSearchChange={setAutomationSearch}
              searchPlaceholder="Rechercher une automatisation..."
              statutFilter={automationStatusFilter}
              onStatutChange={setAutomationStatusFilter}
              statutOptions={statusFilterOptions}
            />

            {isLoadingAutomations ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : automations.length === 0 ? (
              <DocumentEmptyState
                icon={Zap}
                title="Aucune automatisation trouvée"
                description="Aucune automatisation ne correspond à vos critères de recherche."
                actionLabel="Nouvelle automatisation"
                onAction={handleOpenAddAutomation}
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4"
              >
                {automations.map((automation, index) => {
                  const template = getTemplateById(automation.template_id);
                  return (
                    <motion.div
                      key={automation.id}
                      variants={itemVariants}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`transition-all duration-200 hover:shadow-md ${!automation.actif ? "opacity-60" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <Zap className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-medium">{automation.nom}</h3>
                                  {automation.actif ? (
                                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Actif
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inactif
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Déclencheur:</span> {getDeclencheurLabel(automation.declencheur)}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {automation.delai === 0 
                                      ? "Immédiat" 
                                      : `${automation.delai} ${getDelaiUniteLabel(automation.delai_unite)}`}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {template?.nom || automation.template?.nom || "Modèle inconnu"}
                                  </span>
                                </div>
                                {automation.conditions && (
                                  <p className="text-xs text-muted-foreground italic">{automation.conditions}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={automation.actif}
                                onCheckedChange={() => handleToggleAutomation(automation)}
                                disabled={toggleAutomation.isPending}
                              />
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEditAutomation(automation)} className="hover:bg-primary/10">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteAutomation(automation)} 
                                className="hover:bg-destructive/10"
                                disabled={deleteAutomation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      Configuration SMTP
                    </CardTitle>
                    <CardDescription>Paramètres du serveur de messagerie</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingConfig ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Serveur SMTP</Label>
                            <Input
                              value={configForm.smtp_host || ""}
                              onChange={e => setConfigForm({ ...configForm, smtp_host: e.target.value })}
                              placeholder="smtp.example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Port</Label>
                            <Input
                              value={configForm.smtp_port || ""}
                              onChange={e => setConfigForm({ ...configForm, smtp_port: e.target.value })}
                              placeholder="587"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Utilisateur</Label>
                            <Input
                              value={configForm.smtp_user || ""}
                              onChange={e => setConfigForm({ ...configForm, smtp_user: e.target.value })}
                              placeholder="user@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Mot de passe</Label>
                            <Input
                              type="password"
                              value={configForm.smtp_password || ""}
                              onChange={e => setConfigForm({ ...configForm, smtp_password: e.target.value })}
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Switch
                            checked={configForm.ssl || false}
                            onCheckedChange={checked => setConfigForm({ ...configForm, ssl: checked })}
                          />
                          <Label>Utiliser SSL/TLS</Label>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Informations de l'expéditeur
                    </CardTitle>
                    <CardDescription>Informations affichées dans les emails envoyés</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingConfig ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nom de l'expéditeur</Label>
                            <Input
                              value={configForm.expediteur_nom || ""}
                              onChange={e => setConfigForm({ ...configForm, expediteur_nom: e.target.value })}
                              placeholder="Mon Entreprise"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email de l'expéditeur</Label>
                            <Input
                              type="email"
                              value={configForm.expediteur_email || ""}
                              onChange={e => setConfigForm({ ...configForm, expediteur_email: e.target.value })}
                              placeholder="contact@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Répondre à (Reply-To)</Label>
                            <Input
                              type="email"
                              value={configForm.reply_to || ""}
                              onChange={e => setConfigForm({ ...configForm, reply_to: e.target.value })}
                              placeholder="support@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Copie archive (BCC)</Label>
                            <Input
                              type="email"
                              value={configForm.copie_archive || ""}
                              onChange={e => setConfigForm({ ...configForm, copie_archive: e.target.value })}
                              placeholder="archive@example.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Signature par défaut</Label>
                          <Textarea
                            value={configForm.signature || ""}
                            onChange={e => setConfigForm({ ...configForm, signature: e.target.value })}
                            rows={4}
                            placeholder="Votre signature..."
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-end">
                <Button 
                  onClick={handleSaveConfig} 
                  className="gap-2 shadow-md"
                  disabled={updateConfig.isPending}
                >
                  {updateConfig.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Sauvegarder la configuration
                </Button>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Template Modal */}
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {isEditing ? "Modifier le modèle" : "Nouveau modèle d'email"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du modèle *</Label>
                  <Input
                    value={templateForm.nom || ""}
                    onChange={e => setTemplateForm({ ...templateForm, nom: e.target.value })}
                    placeholder="Ex: Envoi de devis"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={templateForm.type}
                    onValueChange={value => setTemplateForm({ ...templateForm, type: value as EmailTemplate["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Objet de l'email *</Label>
                <Input
                  value={templateForm.objet || ""}
                  onChange={e => setTemplateForm({ ...templateForm, objet: e.target.value })}
                  placeholder="Ex: Votre devis {{numero_devis}}"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu de l'email *</Label>
                <Textarea
                  value={templateForm.contenu || ""}
                  onChange={e => setTemplateForm({ ...templateForm, contenu: e.target.value })}
                  rows={12}
                  placeholder="Rédigez le contenu de l'email..."
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez {`{{variable}}`} pour insérer des données dynamiques. 
                  Ex: {`{{nom_client}}`}, {`{{numero_facture}}`}, {`{{montant_ttc}}`}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={templateForm.actif || false}
                  onCheckedChange={checked => setTemplateForm({ ...templateForm, actif: checked })}
                />
                <Label>Modèle actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSaveTemplate} 
                className="gap-2"
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {(createTemplate.isPending || updateTemplate.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isEditing ? "Enregistrer" : "Créer le modèle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Aperçu: {selectedTemplate?.nom}
              </DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Objet:</p>
                  <p className="font-medium">{previewData?.objet || selectedTemplate.objet}</p>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                  <p className="text-sm text-muted-foreground mb-2">Contenu:</p>
                  <pre className="whitespace-pre-wrap text-sm font-sans">{previewData?.contenu || selectedTemplate.contenu}</pre>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Variables disponibles:</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedTemplate.variables || []).map(v => (
                      <Badge key={v} variant="outline" className="bg-primary/10">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Automation Modal */}
        <Dialog open={showAutomationModal} onOpenChange={setShowAutomationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {isEditing ? "Modifier l'automatisation" : "Nouvelle automatisation"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de l'automatisation *</Label>
                <Input
                  value={automationForm.nom || ""}
                  onChange={e => setAutomationForm({ ...automationForm, nom: e.target.value })}
                  placeholder="Ex: Envoi automatique facture"
                />
              </div>
              <div className="space-y-2">
                <Label>Déclencheur</Label>
                <Select
                  value={automationForm.declencheur}
                  onValueChange={value => setAutomationForm({ ...automationForm, declencheur: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {declencheurs && Object.entries(declencheurs).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modèle d'email *</Label>
                <Select
                  value={automationForm.template_id?.toString()}
                  onValueChange={value => setAutomationForm({ ...automationForm, template_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.actif).map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>{template.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Délai</Label>
                  <Input
                    type="number"
                    min="0"
                    value={automationForm.delai || 0}
                    onChange={e => setAutomationForm({ ...automationForm, delai: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unité</Label>
                  <Select
                    value={automationForm.delai_unite}
                    onValueChange={value => setAutomationForm({ ...automationForm, delai_unite: value as EmailAutomation["delai_unite"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {delaiUnites && Object.entries(delaiUnites).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conditions (optionnel)</Label>
                <Textarea
                  value={automationForm.conditions || ""}
                  onChange={e => setAutomationForm({ ...automationForm, conditions: e.target.value })}
                  placeholder="Description des conditions d'envoi..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={automationForm.actif || false}
                  onCheckedChange={checked => setAutomationForm({ ...automationForm, actif: checked })}
                />
                <Label>Automatisation active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAutomationModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSaveAutomation} 
                className="gap-2"
                disabled={createAutomation.isPending || updateAutomation.isPending}
              >
                {(createAutomation.isPending || updateAutomation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isEditing ? "Enregistrer" : "Créer l'automatisation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Email Modal */}
        <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary" />
                Envoyer un email de test
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Modèle à tester *</Label>
                <Select 
                  value={testTemplateId?.toString() || ""} 
                  onValueChange={value => setTestTemplateId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.actif).map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>{template.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adresse email de test *</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Un email sera envoyé avec des données de test pour vérifier le rendu du modèle.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTestModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSendTestEmail} 
                disabled={sendTestEmail.isPending} 
                className="gap-2"
              >
                {sendTestEmail.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer le test
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </MainLayout>
  );
}
