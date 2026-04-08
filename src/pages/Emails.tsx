import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DocumentStatCard,
} from "@/components/shared/documents";
import {
  Mail, Settings, FileText, Zap, Send, Check, Plus, TestTube,
  Server, Users, RefreshCw, CheckCircle, Bell, Loader2,
} from "lucide-react";
import {
  useEmailTemplates, useEmailAutomations, useEmailConfig,
  useCreateEmailTemplate, useUpdateEmailTemplate, useDeleteEmailTemplate,
  useDuplicateEmailTemplate, useToggleEmailTemplate, usePreviewEmailTemplate,
  useCreateEmailAutomation, useUpdateEmailAutomation, useDeleteEmailAutomation,
  useToggleEmailAutomation, useUpdateEmailConfig, useSendTestEmail,
  useEmailDeclencheurs, useEmailDelaiUnites,
} from "@/hooks/use-emails";
import type { EmailTemplate, EmailAutomation, EmailConfig } from "@/services/emailService";
import { EmailTemplatesList } from "./emails/EmailTemplatesList";
import { EmailAutomationsList } from "./emails/EmailAutomationsList";
import { TemplateModal, PreviewModal, AutomationModal, TestEmailModal } from "./emails/EmailModals";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function EmailsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [automationSearch, setAutomationSearch] = useState("");
  const [automationStatusFilter, setAutomationStatusFilter] = useState("all");

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<EmailAutomation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewData, setPreviewData] = useState<{ objet: string; contenu: string } | null>(null);

  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({ nom: "", type: "custom", objet: "", contenu: "", actif: true });
  const [automationForm, setAutomationForm] = useState<Partial<EmailAutomation>>({ nom: "", declencheur: "creation_devis", template_id: 0, delai: 0, delai_unite: "minutes", actif: true, conditions: "" });
  const [testEmail, setTestEmail] = useState("");
  const [testTemplateId, setTestTemplateId] = useState<number | null>(null);
  const [quickTestEmail, setQuickTestEmail] = useState("");
  const [configForm, setConfigForm] = useState<Partial<EmailConfig>>({});

  const { data: templatesData, isLoading: isLoadingTemplates, refetch: refetchTemplates } = useEmailTemplates({ search: searchTerm || undefined, type: typeFilter !== "all" ? typeFilter : undefined, actif: statusFilter === "actif" ? true : statusFilter === "inactif" ? false : undefined });
  const { data: automationsData, isLoading: isLoadingAutomations, refetch: refetchAutomations } = useEmailAutomations({ search: automationSearch || undefined, actif: automationStatusFilter === "actif" ? true : automationStatusFilter === "inactif" ? false : undefined });
  const { data: configData, isLoading: isLoadingConfig } = useEmailConfig();
  const { data: declencheurs } = useEmailDeclencheurs();
  const { data: delaiUnites } = useEmailDelaiUnites();

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
  const sendTestEmailMutation = useSendTestEmail();

  useEffect(() => { if (configData) setConfigForm(configData); }, [configData]);

  const templates = templatesData?.data || [];
  const automations = automationsData?.data || [];
  const stats = useMemo(() => ({ totalTemplates: templatesData?.total || templates.length, activeTemplates: templates.filter(t => t.actif).length, totalAutomations: automationsData?.total || automations.length, activeAutomations: automations.filter(a => a.actif).length }), [templates, automations, templatesData, automationsData]);

  const getDeclencheurLabel = (key: string) => declencheurs?.[key] || key;
  const getDelaiUniteLabel = (key: string) => delaiUnites?.[key] || key;

  // Template handlers
  const handleOpenAddTemplate = () => { setTemplateForm({ nom: "", type: "custom", objet: "", contenu: "", actif: true }); setIsEditing(false); setShowTemplateModal(true); };
  const handleOpenEditTemplate = (t: EmailTemplate) => { setTemplateForm(t); setSelectedTemplate(t); setIsEditing(true); setShowTemplateModal(true); };
  const handlePreviewTemplate = async (t: EmailTemplate) => { setSelectedTemplate(t); try { const r = await previewTemplate.mutateAsync(t.id); setPreviewData(r.preview); } catch { setPreviewData(null); } setShowPreviewModal(true); };
  const handleSaveTemplate = () => { if (!templateForm.nom || !templateForm.objet || !templateForm.contenu) return; if (isEditing && selectedTemplate) updateTemplate.mutate({ id: selectedTemplate.id, data: templateForm }, { onSuccess: () => setShowTemplateModal(false) }); else createTemplate.mutate(templateForm, { onSuccess: () => setShowTemplateModal(false) }); };

  // Automation handlers
  const handleOpenAddAutomation = () => { setAutomationForm({ nom: "", declencheur: "creation_devis", template_id: templates[0]?.id || 0, delai: 0, delai_unite: "minutes", actif: true, conditions: "" }); setIsEditing(false); setShowAutomationModal(true); };
  const handleOpenEditAutomation = (a: EmailAutomation) => { setAutomationForm(a); setSelectedAutomation(a); setIsEditing(true); setShowAutomationModal(true); };
  const handleSaveAutomation = () => { if (!automationForm.nom || !automationForm.template_id) return; if (isEditing && selectedAutomation) updateAutomation.mutate({ id: selectedAutomation.id, data: automationForm }, { onSuccess: () => setShowAutomationModal(false) }); else createAutomation.mutate(automationForm, { onSuccess: () => setShowAutomationModal(false) }); };

  const handleSendTestEmail = () => { if (!testEmail || !testTemplateId) return; sendTestEmailMutation.mutate({ email: testEmail, templateId: testTemplateId }, { onSuccess: () => { setShowTestModal(false); setTestEmail(""); setTestTemplateId(null); } }); };

  const isRefreshing = isLoadingTemplates || isLoadingAutomations;

  return (
    <MainLayout title="Gestion des Emails">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestion des Emails</h1><p className="text-muted-foreground">Gérez vos modèles d'emails et automatisations</p></div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { refetchTemplates(); refetchAutomations(); }} disabled={isRefreshing} className="gap-2"><RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />Actualiser</Button>
            <Button onClick={() => setShowTestModal(true)} variant="outline" className="gap-2"><TestTube className="h-4 w-4" />Email de test</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DocumentStatCard title="Total modèles" value={stats.totalTemplates} icon={FileText} variant="primary" delay={0} />
          <DocumentStatCard title="Modèles actifs" value={stats.activeTemplates} icon={CheckCircle} variant="success" delay={0.1} />
          <DocumentStatCard title="Automatisations" value={stats.totalAutomations} icon={Zap} variant="warning" delay={0.2} />
          <DocumentStatCard title="Auto. actives" value={stats.activeAutomations} icon={Bell} variant="info" delay={0.3} />
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="templates" className="gap-2"><FileText className="h-4 w-4" />Modèles</TabsTrigger>
            <TabsTrigger value="automations" className="gap-2"><Zap className="h-4 w-4" />Automatisation</TabsTrigger>
            <TabsTrigger value="config" className="gap-2"><Settings className="h-4 w-4" />Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <EmailTemplatesList
              templates={templates} isLoading={isLoadingTemplates} searchTerm={searchTerm} onSearchChange={setSearchTerm}
              typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
              onAdd={handleOpenAddTemplate} onEdit={handleOpenEditTemplate} onPreview={handlePreviewTemplate}
              onDuplicate={(t) => duplicateTemplate.mutate(t.id)} onDelete={(t) => deleteTemplate.mutate(t.id)} onToggle={(t) => toggleTemplate.mutate(t.id)}
              togglePending={toggleTemplate.isPending} previewPending={previewTemplate.isPending}
              duplicatePending={duplicateTemplate.isPending} deletePending={deleteTemplate.isPending} selectedTemplateId={selectedTemplate?.id}
            />
          </TabsContent>

          <TabsContent value="automations">
            <EmailAutomationsList
              automations={automations} templates={templates} isLoading={isLoadingAutomations}
              searchTerm={automationSearch} onSearchChange={setAutomationSearch}
              statusFilter={automationStatusFilter} onStatusFilterChange={setAutomationStatusFilter}
              onAdd={handleOpenAddAutomation} onEdit={handleOpenEditAutomation}
              onDelete={(a) => deleteAutomation.mutate(a.id)} onToggle={(a) => toggleAutomation.mutate(a.id)}
              togglePending={toggleAutomation.isPending} deletePending={deleteAutomation.isPending}
              getDeclencheurLabel={getDeclencheurLabel} getDelaiUniteLabel={getDelaiUniteLabel}
            />
          </TabsContent>

          <TabsContent value="config">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" />Configuration SMTP</CardTitle><CardDescription>Paramètres du serveur de messagerie</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingConfig ? <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Serveur SMTP</Label><Input value={configForm.smtp_host || ""} onChange={e => setConfigForm({ ...configForm, smtp_host: e.target.value })} placeholder="smtp.example.com" /></div>
                          <div className="space-y-2"><Label>Port</Label><Input value={configForm.smtp_port || ""} onChange={e => setConfigForm({ ...configForm, smtp_port: e.target.value })} placeholder="587" /></div>
                          <div className="space-y-2"><Label>Utilisateur</Label><Input value={configForm.smtp_user || ""} onChange={e => setConfigForm({ ...configForm, smtp_user: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Mot de passe</Label><Input type="password" value={configForm.smtp_password || ""} onChange={e => setConfigForm({ ...configForm, smtp_password: e.target.value })} /></div>
                        </div>
                        <div className="flex items-center gap-2 pt-2"><Switch checked={configForm.ssl || false} onCheckedChange={checked => setConfigForm({ ...configForm, ssl: checked })} /><Label>Utiliser SSL/TLS</Label></div>
                        <div className="border-t pt-4 mt-4">
                          <Label className="text-sm font-medium mb-2 block">Tester la configuration SMTP</Label>
                          <div className="flex gap-2">
                            <Input type="email" value={quickTestEmail} onChange={e => setQuickTestEmail(e.target.value)} placeholder="votre-email@example.com" className="flex-1" />
                            <Button variant="outline" onClick={() => { if (quickTestEmail) sendTestEmailMutation.mutate({ email: quickTestEmail }); }} disabled={!quickTestEmail || sendTestEmailMutation.isPending} className="gap-2">
                              {sendTestEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Envoyer un test
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Informations de l'expéditeur</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingConfig ? <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div> : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Nom de l'expéditeur</Label><Input value={configForm.expediteur_nom || ""} onChange={e => setConfigForm({ ...configForm, expediteur_nom: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Email de l'expéditeur</Label><Input type="email" value={configForm.expediteur_email || ""} onChange={e => setConfigForm({ ...configForm, expediteur_email: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Répondre à (Reply-To)</Label><Input type="email" value={configForm.reply_to || ""} onChange={e => setConfigForm({ ...configForm, reply_to: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Copie archive (BCC)</Label><Input type="email" value={configForm.copie_archive || ""} onChange={e => setConfigForm({ ...configForm, copie_archive: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Signature par défaut</Label><Textarea value={configForm.signature || ""} onChange={e => setConfigForm({ ...configForm, signature: e.target.value })} rows={4} /></div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-end">
                <Button onClick={() => updateConfig.mutate(configForm)} className="gap-2 shadow-md" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Sauvegarder la configuration
                </Button>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <TemplateModal open={showTemplateModal} onOpenChange={setShowTemplateModal} isEditing={isEditing} form={templateForm} onFormChange={setTemplateForm} onSave={handleSaveTemplate} isPending={createTemplate.isPending || updateTemplate.isPending} />
        <PreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} template={selectedTemplate} previewData={previewData} />
        <AutomationModal open={showAutomationModal} onOpenChange={setShowAutomationModal} isEditing={isEditing} form={automationForm} onFormChange={setAutomationForm} onSave={handleSaveAutomation} isPending={createAutomation.isPending || updateAutomation.isPending} templates={templates} declencheurs={declencheurs} delaiUnites={delaiUnites} />
        <TestEmailModal open={showTestModal} onOpenChange={setShowTestModal} testEmail={testEmail} onTestEmailChange={setTestEmail} testTemplateId={testTemplateId} onTestTemplateIdChange={setTestTemplateId} onSend={handleSendTestEmail} isPending={sendTestEmailMutation.isPending} templates={templates} />
      </motion.div>
    </MainLayout>
  );
}
