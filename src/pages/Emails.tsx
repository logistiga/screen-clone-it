import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
  Bell
} from "lucide-react";

interface EmailTemplate {
  id: string;
  nom: string;
  type: "devis" | "ordre" | "facture" | "relance" | "confirmation" | "notification" | "custom";
  objet: string;
  contenu: string;
  variables: string[];
  actif: boolean;
}

interface AutomationRule {
  id: string;
  nom: string;
  declencheur: string;
  templateId: string;
  delai: number;
  delaiUnite: "minutes" | "heures" | "jours";
  actif: boolean;
  conditions: string;
}

interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  expediteurNom: string;
  expediteurEmail: string;
  replyTo: string;
  signature: string;
  copieArchive: string;
  ssl: boolean;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "1",
    nom: "Envoi de devis",
    type: "devis",
    objet: "Votre devis {{numero_devis}} - {{nom_entreprise}}",
    contenu: `Bonjour {{nom_client}},

Veuillez trouver ci-joint le devis n°{{numero_devis}} d'un montant de {{montant_ttc}} TTC.

Ce devis est valable jusqu'au {{date_validite}}.

N'hésitez pas à nous contacter pour toute question.

Cordialement,
{{signature}}`,
    variables: ["nom_client", "numero_devis", "montant_ttc", "date_validite", "nom_entreprise", "signature"],
    actif: true
  },
  {
    id: "2",
    nom: "Envoi d'ordre de travail",
    type: "ordre",
    objet: "Ordre de travail {{numero_ordre}} - {{nom_entreprise}}",
    contenu: `Bonjour {{nom_client}},

Nous vous confirmons la prise en charge de votre ordre de travail n°{{numero_ordre}}.

Conteneur: {{numero_conteneur}}
Type d'intervention: {{type_travail}}
Date prévue: {{date_prevue}}

Nous vous tiendrons informé de l'avancement.

Cordialement,
{{signature}}`,
    variables: ["nom_client", "numero_ordre", "numero_conteneur", "type_travail", "date_prevue", "nom_entreprise", "signature"],
    actif: true
  },
  {
    id: "3",
    nom: "Envoi de facture",
    type: "facture",
    objet: "Facture {{numero_facture}} - {{nom_entreprise}}",
    contenu: `Bonjour {{nom_client}},

Veuillez trouver ci-joint la facture n°{{numero_facture}} d'un montant de {{montant_ttc}} TTC.

Date d'échéance: {{date_echeance}}

Mode de paiement: {{mode_paiement}}

Merci de votre confiance.

Cordialement,
{{signature}}`,
    variables: ["nom_client", "numero_facture", "montant_ttc", "date_echeance", "mode_paiement", "nom_entreprise", "signature"],
    actif: true
  },
  {
    id: "4",
    nom: "Relance paiement",
    type: "relance",
    objet: "Rappel - Facture {{numero_facture}} en attente",
    contenu: `Bonjour {{nom_client}},

Nous nous permettons de vous rappeler que la facture n°{{numero_facture}} d'un montant de {{montant_ttc}} TTC reste impayée.

Date d'échéance dépassée: {{date_echeance}}
Retard: {{jours_retard}} jours

Merci de procéder au règlement dans les meilleurs délais.

Cordialement,
{{signature}}`,
    variables: ["nom_client", "numero_facture", "montant_ttc", "date_echeance", "jours_retard", "nom_entreprise", "signature"],
    actif: true
  },
  {
    id: "5",
    nom: "Confirmation de paiement",
    type: "confirmation",
    objet: "Confirmation de paiement - Facture {{numero_facture}}",
    contenu: `Bonjour {{nom_client}},

Nous accusons réception de votre paiement de {{montant_paye}} pour la facture n°{{numero_facture}}.

Date de paiement: {{date_paiement}}
Mode de paiement: {{mode_paiement}}

Merci de votre confiance.

Cordialement,
{{signature}}`,
    variables: ["nom_client", "numero_facture", "montant_paye", "date_paiement", "mode_paiement", "nom_entreprise", "signature"],
    actif: true
  },
  {
    id: "6",
    nom: "Notification travaux terminés",
    type: "notification",
    objet: "Travaux terminés - Ordre {{numero_ordre}}",
    contenu: `Bonjour {{nom_client}},

Nous avons le plaisir de vous informer que les travaux concernant l'ordre n°{{numero_ordre}} sont terminés.

Conteneur: {{numero_conteneur}}
Date de fin: {{date_fin}}

Vous pouvez récupérer votre conteneur ou nous contacter pour organiser la livraison.

Cordialement,
{{signature}}`,
    variables: ["nom_client", "numero_ordre", "numero_conteneur", "date_fin", "nom_entreprise", "signature"],
    actif: true
  }
];

const defaultAutomations: AutomationRule[] = [
  {
    id: "1",
    nom: "Envoi automatique devis",
    declencheur: "creation_devis",
    templateId: "1",
    delai: 0,
    delaiUnite: "minutes",
    actif: true,
    conditions: "Envoi immédiat après création"
  },
  {
    id: "2",
    nom: "Envoi automatique facture",
    declencheur: "creation_facture",
    templateId: "3",
    delai: 0,
    delaiUnite: "minutes",
    actif: false,
    conditions: "Envoi immédiat après création"
  },
  {
    id: "3",
    nom: "Relance automatique J+7",
    declencheur: "facture_impayee",
    templateId: "4",
    delai: 7,
    delaiUnite: "jours",
    actif: true,
    conditions: "7 jours après date d'échéance"
  },
  {
    id: "4",
    nom: "Relance automatique J+15",
    declencheur: "facture_impayee",
    templateId: "4",
    delai: 15,
    delaiUnite: "jours",
    actif: true,
    conditions: "15 jours après date d'échéance"
  },
  {
    id: "5",
    nom: "Confirmation paiement reçu",
    declencheur: "paiement_recu",
    templateId: "5",
    delai: 0,
    delaiUnite: "minutes",
    actif: true,
    conditions: "Envoi immédiat après enregistrement du paiement"
  },
  {
    id: "6",
    nom: "Notification fin travaux",
    declencheur: "ordre_termine",
    templateId: "6",
    delai: 1,
    delaiUnite: "heures",
    actif: false,
    conditions: "1 heure après clôture de l'ordre"
  }
];

const defaultConfig: EmailConfig = {
  smtpHost: "smtp.gmail.com",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  expediteurNom: "LOJISTIGA",
  expediteurEmail: "contact@lojistiga.com",
  replyTo: "contact@lojistiga.com",
  signature: "L'équipe LOJISTIGA\nTél: +221 XX XXX XX XX\nEmail: contact@lojistiga.com",
  copieArchive: "",
  ssl: true
};

const typeLabels: Record<EmailTemplate["type"], { label: string; icon: React.ReactNode; color: string }> = {
  devis: { label: "Devis", icon: <FileText className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  ordre: { label: "Ordre de travail", icon: <Truck className="h-4 w-4" />, color: "bg-purple-100 text-purple-800" },
  facture: { label: "Facture", icon: <Receipt className="h-4 w-4" />, color: "bg-green-100 text-green-800" },
  relance: { label: "Relance", icon: <AlertCircle className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
  confirmation: { label: "Confirmation", icon: <Check className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-800" },
  notification: { label: "Notification", icon: <Bell className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-800" },
  custom: { label: "Personnalisé", icon: <FileText className="h-4 w-4" />, color: "bg-gray-100 text-gray-800" }
};

const declencheurLabels: Record<string, string> = {
  creation_devis: "Création d'un devis",
  creation_ordre: "Création d'un ordre de travail",
  creation_facture: "Création d'une facture",
  facture_impayee: "Facture impayée (après échéance)",
  paiement_recu: "Paiement reçu",
  ordre_termine: "Ordre de travail terminé",
  devis_accepte: "Devis accepté",
  devis_expire: "Devis expiré"
};

export default function EmailsPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [automations, setAutomations] = useState<AutomationRule[]>(defaultAutomations);
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  
  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({
    nom: "",
    type: "custom",
    objet: "",
    contenu: "",
    variables: [],
    actif: true
  });
  
  const [automationForm, setAutomationForm] = useState<Partial<AutomationRule>>({
    nom: "",
    declencheur: "creation_devis",
    templateId: "",
    delai: 0,
    delaiUnite: "minutes",
    actif: true,
    conditions: ""
  });
  
  const [testEmail, setTestEmail] = useState("");
  const [testTemplateId, setTestTemplateId] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Template handlers
  const handleOpenAddTemplate = () => {
    setTemplateForm({
      nom: "",
      type: "custom",
      objet: "",
      contenu: "",
      variables: [],
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

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: Date.now().toString(),
      nom: `${template.nom} (copie)`,
      actif: false
    };
    setTemplates([...templates, newTemplate]);
    toast({
      title: "Modèle dupliqué",
      description: `Le modèle "${newTemplate.nom}" a été créé`
    });
  };

  const handleDeleteTemplate = (template: EmailTemplate) => {
    // Check if template is used in automations
    const usedInAutomation = automations.find(a => a.templateId === template.id);
    if (usedInAutomation) {
      toast({
        title: "Suppression impossible",
        description: "Ce modèle est utilisé dans une automatisation",
        variant: "destructive"
      });
      return;
    }
    setTemplates(templates.filter(t => t.id !== template.id));
    toast({
      title: "Modèle supprimé",
      description: `Le modèle "${template.nom}" a été supprimé`
    });
  };

  const handleSaveTemplate = () => {
    if (!templateForm.nom || !templateForm.objet || !templateForm.contenu) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Extract variables from content
    const variableRegex = /\{\{(\w+)\}\}/g;
    const extractedVars: string[] = [];
    let match;
    const fullText = `${templateForm.objet} ${templateForm.contenu}`;
    while ((match = variableRegex.exec(fullText)) !== null) {
      if (!extractedVars.includes(match[1])) {
        extractedVars.push(match[1]);
      }
    }

    if (isEditing && selectedTemplate) {
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, ...templateForm, variables: extractedVars } as EmailTemplate
          : t
      ));
      toast({
        title: "Modèle modifié",
        description: `Le modèle "${templateForm.nom}" a été mis à jour`
      });
    } else {
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        nom: templateForm.nom!,
        type: templateForm.type as EmailTemplate["type"],
        objet: templateForm.objet!,
        contenu: templateForm.contenu!,
        variables: extractedVars,
        actif: templateForm.actif!
      };
      setTemplates([...templates, newTemplate]);
      toast({
        title: "Modèle créé",
        description: `Le modèle "${newTemplate.nom}" a été ajouté`
      });
    }
    setShowTemplateModal(false);
  };

  const handleToggleTemplate = (template: EmailTemplate) => {
    setTemplates(templates.map(t =>
      t.id === template.id ? { ...t, actif: !t.actif } : t
    ));
  };

  // Automation handlers
  const handleOpenAddAutomation = () => {
    setAutomationForm({
      nom: "",
      declencheur: "creation_devis",
      templateId: templates[0]?.id || "",
      delai: 0,
      delaiUnite: "minutes",
      actif: true,
      conditions: ""
    });
    setIsEditing(false);
    setShowAutomationModal(true);
  };

  const handleOpenEditAutomation = (automation: AutomationRule) => {
    setAutomationForm(automation);
    setSelectedAutomation(automation);
    setIsEditing(true);
    setShowAutomationModal(true);
  };

  const handleDeleteAutomation = (automation: AutomationRule) => {
    setAutomations(automations.filter(a => a.id !== automation.id));
    toast({
      title: "Automatisation supprimée",
      description: `L'automatisation "${automation.nom}" a été supprimée`
    });
  };

  const handleSaveAutomation = () => {
    if (!automationForm.nom || !automationForm.templateId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (isEditing && selectedAutomation) {
      setAutomations(automations.map(a =>
        a.id === selectedAutomation.id
          ? { ...a, ...automationForm } as AutomationRule
          : a
      ));
      toast({
        title: "Automatisation modifiée",
        description: `L'automatisation "${automationForm.nom}" a été mise à jour`
      });
    } else {
      const newAutomation: AutomationRule = {
        id: Date.now().toString(),
        nom: automationForm.nom!,
        declencheur: automationForm.declencheur!,
        templateId: automationForm.templateId!,
        delai: automationForm.delai!,
        delaiUnite: automationForm.delaiUnite!,
        actif: automationForm.actif!,
        conditions: automationForm.conditions || ""
      };
      setAutomations([...automations, newAutomation]);
      toast({
        title: "Automatisation créée",
        description: `L'automatisation "${newAutomation.nom}" a été ajoutée`
      });
    }
    setShowAutomationModal(false);
  };

  const handleToggleAutomation = (automation: AutomationRule) => {
    setAutomations(automations.map(a =>
      a.id === automation.id ? { ...a, actif: !a.actif } : a
    ));
  };

  // Config handlers
  const handleSaveConfig = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres SMTP ont été mis à jour"
    });
  };

  // Test email handler
  const handleSendTestEmail = async () => {
    if (!testEmail || !testTemplateId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un modèle et entrer une adresse email",
        variant: "destructive"
      });
      return;
    }

    setIsSendingTest(true);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSendingTest(false);
    
    const template = templates.find(t => t.id === testTemplateId);
    toast({
      title: "Email de test envoyé",
      description: `Le modèle "${template?.nom}" a été envoyé à ${testEmail}`
    });
    setShowTestModal(false);
    setTestEmail("");
    setTestTemplateId("");
  };

  const getTemplateById = (id: string) => templates.find(t => t.id === id);

  return (
    <MainLayout title="Gestion des Emails">
      <Tabs defaultValue="templates" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
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
          
          <Button onClick={() => setShowTestModal(true)} variant="outline" className="gap-2">
            <TestTube className="h-4 w-4" />
            Envoyer un email de test
          </Button>
        </div>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Modèles d'emails</h2>
              <p className="text-muted-foreground">Gérez vos modèles d'emails pour chaque type de document</p>
            </div>
            <Button onClick={handleOpenAddTemplate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau modèle
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map(template => (
              <Card key={template.id} className={!template.actif ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${typeLabels[template.type].color}`}>
                        {typeLabels[template.type].icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.nom}</h3>
                          <Badge variant="outline" className={typeLabels[template.type].color}>
                            {typeLabels[template.type].label}
                          </Badge>
                          {!template.actif && <Badge variant="secondary">Inactif</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{template.objet}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.slice(0, 4).map(v => (
                            <Badge key={v} variant="outline" className="text-xs">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                          {template.variables.length > 4 && (
                            <Badge variant="outline" className="text-xs">
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
                      />
                      <Button variant="ghost" size="icon" onClick={() => handlePreviewTemplate(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditTemplate(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Automatisation des emails</h2>
              <p className="text-muted-foreground">Configurez l'envoi automatique des emails selon les événements</p>
            </div>
            <Button onClick={handleOpenAddAutomation} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle automatisation
            </Button>
          </div>

          <div className="grid gap-4">
            {automations.map(automation => {
              const template = getTemplateById(automation.templateId);
              return (
                <Card key={automation.id} className={!automation.actif ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{automation.nom}</h3>
                            {!automation.actif && <Badge variant="secondary">Inactif</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Déclencheur:</span> {declencheurLabels[automation.declencheur]}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {automation.delai === 0 
                                ? "Immédiat" 
                                : `${automation.delai} ${automation.delaiUnite}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {template?.nom || "Modèle inconnu"}
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
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditAutomation(automation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAutomation(automation)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Configuration SMTP
              </CardTitle>
              <CardDescription>Paramètres du serveur d'envoi d'emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serveur SMTP</Label>
                  <Input
                    value={config.smtpHost}
                    onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    value={config.smtpPort}
                    onChange={e => setConfig({ ...config, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Utilisateur SMTP</Label>
                  <Input
                    value={config.smtpUser}
                    onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe SMTP</Label>
                  <Input
                    type="password"
                    value={config.smtpPassword}
                    onChange={e => setConfig({ ...config, smtpPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.ssl}
                  onCheckedChange={checked => setConfig({ ...config, ssl: checked })}
                />
                <Label>Utiliser SSL/TLS</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informations de l'expéditeur
              </CardTitle>
              <CardDescription>Informations affichées dans les emails envoyés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de l'expéditeur</Label>
                  <Input
                    value={config.expediteurNom}
                    onChange={e => setConfig({ ...config, expediteurNom: e.target.value })}
                    placeholder="Mon Entreprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de l'expéditeur</Label>
                  <Input
                    type="email"
                    value={config.expediteurEmail}
                    onChange={e => setConfig({ ...config, expediteurEmail: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Répondre à (Reply-To)</Label>
                  <Input
                    type="email"
                    value={config.replyTo}
                    onChange={e => setConfig({ ...config, replyTo: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Copie archive (BCC)</Label>
                  <Input
                    type="email"
                    value={config.copieArchive}
                    onChange={e => setConfig({ ...config, copieArchive: e.target.value })}
                    placeholder="archive@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Signature par défaut</Label>
                <Textarea
                  value={config.signature}
                  onChange={e => setConfig({ ...config, signature: e.target.value })}
                  rows={4}
                  placeholder="Votre signature..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfig} className="gap-2">
              <Check className="h-4 w-4" />
              Sauvegarder la configuration
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le modèle" : "Nouveau modèle d'email"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du modèle *</Label>
                <Input
                  value={templateForm.nom}
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
                value={templateForm.objet}
                onChange={e => setTemplateForm({ ...templateForm, objet: e.target.value })}
                placeholder="Ex: Votre devis {{numero_devis}}"
              />
            </div>
            <div className="space-y-2">
              <Label>Contenu de l'email *</Label>
              <Textarea
                value={templateForm.contenu}
                onChange={e => setTemplateForm({ ...templateForm, contenu: e.target.value })}
                rows={12}
                placeholder="Rédigez le contenu de l'email..."
              />
              <p className="text-xs text-muted-foreground">
                Utilisez {`{{variable}}`} pour insérer des données dynamiques. 
                Ex: {`{{nom_client}}`}, {`{{numero_facture}}`}, {`{{montant_ttc}}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={templateForm.actif}
                onCheckedChange={checked => setTemplateForm({ ...templateForm, actif: checked })}
              />
              <Label>Modèle actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveTemplate}>
              {isEditing ? "Enregistrer" : "Créer le modèle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aperçu: {selectedTemplate?.nom}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Objet:</p>
                <p className="font-medium">{selectedTemplate.objet}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Contenu:</p>
                <pre className="whitespace-pre-wrap text-sm font-sans">{selectedTemplate.contenu}</pre>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map(v => (
                    <Badge key={v} variant="outline">{`{{${v}}}`}</Badge>
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
            <DialogTitle>
              {isEditing ? "Modifier l'automatisation" : "Nouvelle automatisation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'automatisation *</Label>
              <Input
                value={automationForm.nom}
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
                  {Object.entries(declencheurLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modèle d'email *</Label>
              <Select
                value={automationForm.templateId}
                onValueChange={value => setAutomationForm({ ...automationForm, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.actif).map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.nom}</SelectItem>
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
                  value={automationForm.delai}
                  onChange={e => setAutomationForm({ ...automationForm, delai: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Select
                  value={automationForm.delaiUnite}
                  onValueChange={value => setAutomationForm({ ...automationForm, delaiUnite: value as AutomationRule["delaiUnite"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="heures">Heures</SelectItem>
                    <SelectItem value="jours">Jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conditions (optionnel)</Label>
              <Textarea
                value={automationForm.conditions}
                onChange={e => setAutomationForm({ ...automationForm, conditions: e.target.value })}
                placeholder="Description des conditions d'envoi..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={automationForm.actif}
                onCheckedChange={checked => setAutomationForm({ ...automationForm, actif: checked })}
              />
              <Label>Automatisation active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutomationModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveAutomation}>
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
              <TestTube className="h-5 w-5" />
              Envoyer un email de test
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Modèle à tester *</Label>
              <Select value={testTemplateId} onValueChange={setTestTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.actif).map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.nom}</SelectItem>
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
            <Button onClick={handleSendTestEmail} disabled={isSendingTest} className="gap-2">
              {isSendingTest ? (
                <>Envoi en cours...</>
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
    </MainLayout>
  );
}
