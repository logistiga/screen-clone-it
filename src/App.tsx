import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PWAInstallPrompt, PWAUpdatePrompt, OfflineIndicator } from "@/components/pwa";
import { Loader2 } from "lucide-react";

// Permissions par module
const P = {
  // Dashboard
  dashboard: { view: 'dashboard.voir' },
  // Clients
  clients: { view: 'clients.voir', create: 'clients.creer', edit: 'clients.modifier' },
  // Devis
  devis: { view: 'devis.voir', create: 'devis.creer', edit: 'devis.modifier' },
  // Ordres
  ordres: { view: 'ordres.voir', create: 'ordres.creer', edit: 'ordres.modifier' },
  // Factures
  factures: { view: 'factures.voir', create: 'factures.creer', edit: 'factures.modifier', cancel: 'factures.annuler' },
  // Notes
  notes: { view: 'notes.voir', create: 'notes.creer', edit: 'notes.modifier' },
  // Finance
  caisse: { view: 'caisse.voir' },
  banques: { view: 'banques.voir' },
  credits: { view: 'credits.voir' },
  // Reporting
  reporting: { view: 'reporting.voir' },
  // Administration
  utilisateurs: { view: 'utilisateurs.voir' },
  roles: { view: 'roles.voir' },
  configuration: { view: 'configuration.voir' },
  audit: { view: 'audit.voir' },
  securite: { view: 'securite.voir' },
  // Partenaires
  partenaires: { view: 'partenaires.voir' },
  transitaires: { view: 'transitaires.voir' },
};

// Loading component pour le lazy loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Pages chargées immédiatement (critiques)
import LoginPage from "./pages/Login";
import PendingApprovalPage from "./pages/PendingApproval";
import SecurityActionPage from "./pages/SecurityAction";
import NotFound from "./pages/NotFound";
import DashboardPage from "./pages/Dashboard";

// Pages chargées en lazy loading (non critiques)
const ClientsPage = lazy(() => import("./pages/Clients"));
const ClientDetailPage = lazy(() => import("./pages/ClientDetail"));
const NouveauClientPage = lazy(() => import("./pages/NouveauClient"));

const DevisPage = lazy(() => import("./pages/Devis"));
const NouveauDevisPage = lazy(() => import("./pages/NouveauDevis"));
const DevisDetailPage = lazy(() => import("./pages/DevisDetail"));
const DevisPDFPage = lazy(() => import("./pages/DevisPDF"));
const ModifierDevisPage = lazy(() => import("./pages/ModifierDevis"));

const OrdresTravailPage = lazy(() => import("./pages/OrdresTravail"));
const NouvelOrdrePage = lazy(() => import("./pages/NouvelOrdre"));
const OrdreDetailPage = lazy(() => import("./pages/OrdreDetail"));
const OrdrePDFPage = lazy(() => import("./pages/OrdrePDF"));
const ConnaissementPDFPage = lazy(() => import("./pages/ConnaissementPDF"));
const ModifierOrdrePage = lazy(() => import("./pages/ModifierOrdre"));

const FacturesPage = lazy(() => import("./pages/Factures"));
const NouvelleFacturePage = lazy(() => import("./pages/NouvelleFacture"));
const FactureDetailPage = lazy(() => import("./pages/FactureDetail"));
const FacturePDFPage = lazy(() => import("./pages/FacturePDF"));
const ModifierFacturePage = lazy(() => import("./pages/ModifierFacture"));

const AnnulationsPage = lazy(() => import("./pages/Annulations"));
const AvoirPDFPage = lazy(() => import("./pages/AvoirPDF"));

const NotesDebutPage = lazy(() => import("./pages/NotesDebut"));
const NouvelleNoteDebutPage = lazy(() => import("./pages/NouvelleNoteDebut"));
const NouvelleNoteOuverturePortPage = lazy(() => import("./pages/NouvelleNoteOuverturePort"));
const NouvelleNoteDetentionPage = lazy(() => import("./pages/NouvelleNoteDetention"));
const NouvelleNoteReparationPage = lazy(() => import("./pages/NouvelleNoteReparation"));
const NouvelleNoteRelachePage = lazy(() => import("./pages/NouvelleNoteRelache"));
const NoteDebutDetailPage = lazy(() => import("./pages/NoteDebutDetail"));
const NoteDebutPDFPage = lazy(() => import("./pages/NoteDebutPDF"));
const ModifierNoteDebutPage = lazy(() => import("./pages/ModifierNoteDebut"));

const CaissePage = lazy(() => import("./pages/Caisse"));
const BanquePage = lazy(() => import("./pages/Banque"));
const CaisseGlobalePage = lazy(() => import("./pages/CaisseGlobale"));
const ReportingPage = lazy(() => import("./pages/Reporting"));
const PrevisionsPage = lazy(() => import("./pages/Previsions"));
const CreditsPage = lazy(() => import("./pages/Credits"));
const CreditDetailPage = lazy(() => import("./pages/CreditDetail"));

const UtilisateursPage = lazy(() => import("./pages/Utilisateurs"));
const RolesPage = lazy(() => import("./pages/Roles"));
const RoleFormPage = lazy(() => import("./pages/RoleForm"));
const ProfilPage = lazy(() => import("./pages/Profil"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const TracabilitePage = lazy(() => import("./pages/Tracabilite"));
const EmailsPage = lazy(() => import("./pages/Emails"));
const TaxesPage = lazy(() => import("./pages/Taxes"));
const BanquesPage = lazy(() => import("./pages/Banques"));
const NumerotationPage = lazy(() => import("./pages/Numerotation"));
const CategoriesDepensesPage = lazy(() => import("./pages/CategoriesDepenses"));
const CategorieDepenseDetailPage = lazy(() => import("./pages/CategorieDepenseDetail"));
const VerificationDocumentPage = lazy(() => import("./pages/VerificationDocument"));
const PartenairesPage = lazy(() => import("./pages/Partenaires"));
const TransitaireDetailPage = lazy(() => import("./pages/TransitaireDetail"));
const RepresentantDetailPage = lazy(() => import("./pages/RepresentantDetail"));
const ArmateurDetailPage = lazy(() => import("./pages/ArmateurDetail"));
const RecuPrimePDFPage = lazy(() => import("./pages/RecuPrimePDF"));
const GuidePage = lazy(() => import("./pages/Guide"));
const ConnexionsSuspectesPage = lazy(() => import("./pages/ConnexionsSuspectes"));

// Configuration optimisée de React Query pour production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (anciennement cacheTime)
      // IMPORTANT: éviter d'aggraver les rate-limits (429)
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 429) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error: any) => {
        const status = error?.response?.status;
        const retryAfterHeader = error?.response?.headers?.['retry-after'];

        if (status === 429) {
          const retryAfterSec = Number(retryAfterHeader);
          if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) return retryAfterSec * 1000;
          return 30000; // fallback 30s
        }

        // Backoff exponentiel (max 30s)
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="logistiga-theme">
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <PWAUpdatePrompt />
            <OfflineIndicator />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Routes publiques */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pending-approval" element={<PendingApprovalPage />} />
                <Route path="/security/:token/:action" element={<SecurityActionPage />} />
                
                {/* Routes protégées - Dashboard (accessible à tous les utilisateurs authentifiés) */}
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Clients */}
                <Route path="/clients" element={<ProtectedRoute requiredPermission={P.clients.view}><ClientsPage /></ProtectedRoute>} />
                <Route path="/clients/nouveau" element={<ProtectedRoute requiredPermission={P.clients.create}><NouveauClientPage /></ProtectedRoute>} />
                <Route path="/clients/:id" element={<ProtectedRoute requiredPermission={P.clients.view}><ClientDetailPage /></ProtectedRoute>} />
                <Route path="/clients/:id/modifier" element={<ProtectedRoute requiredPermission={P.clients.edit}><NouveauClientPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Devis */}
                <Route path="/devis" element={<ProtectedRoute requiredPermission={P.devis.view}><DevisPage /></ProtectedRoute>} />
                <Route path="/devis/nouveau" element={<ProtectedRoute requiredPermission={P.devis.create}><NouveauDevisPage /></ProtectedRoute>} />
                <Route path="/devis/:id" element={<ProtectedRoute requiredPermission={P.devis.view}><DevisDetailPage /></ProtectedRoute>} />
                <Route path="/devis/:id/pdf" element={<ProtectedRoute requiredPermission={P.devis.view}><DevisPDFPage /></ProtectedRoute>} />
                <Route path="/devis/:id/modifier" element={<ProtectedRoute requiredPermission={P.devis.edit}><ModifierDevisPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Ordres de travail */}
                <Route path="/ordres" element={<ProtectedRoute requiredPermission={P.ordres.view}><OrdresTravailPage /></ProtectedRoute>} />
                <Route path="/ordres/nouveau" element={<ProtectedRoute requiredPermission={P.ordres.create}><NouvelOrdrePage /></ProtectedRoute>} />
                <Route path="/ordres/:id" element={<ProtectedRoute requiredPermission={P.ordres.view}><OrdreDetailPage /></ProtectedRoute>} />
                <Route path="/ordres/:id/pdf" element={<ProtectedRoute requiredPermission={P.ordres.view}><OrdrePDFPage /></ProtectedRoute>} />
                <Route path="/ordres/:id/connaissement" element={<ProtectedRoute requiredPermission={P.ordres.view}><ConnaissementPDFPage /></ProtectedRoute>} />
                <Route path="/ordres/:id/modifier" element={<ProtectedRoute requiredPermission={P.ordres.edit}><ModifierOrdrePage /></ProtectedRoute>} />
                
                {/* Routes protégées - Factures */}
                <Route path="/factures" element={<ProtectedRoute requiredPermission={P.factures.view}><FacturesPage /></ProtectedRoute>} />
                <Route path="/factures/nouvelle" element={<ProtectedRoute requiredPermission={P.factures.create}><NouvelleFacturePage /></ProtectedRoute>} />
                <Route path="/factures/:id" element={<ProtectedRoute requiredPermission={P.factures.view}><FactureDetailPage /></ProtectedRoute>} />
                <Route path="/factures/:id/pdf" element={<ProtectedRoute requiredPermission={P.factures.view}><FacturePDFPage /></ProtectedRoute>} />
                <Route path="/factures/:id/modifier" element={<ProtectedRoute requiredPermission={P.factures.edit}><ModifierFacturePage /></ProtectedRoute>} />
                
                {/* Routes protégées - Annulations */}
                <Route path="/annulations" element={<ProtectedRoute requiredPermission={P.factures.cancel}><AnnulationsPage /></ProtectedRoute>} />
                <Route path="/annulations/:id/avoir" element={<ProtectedRoute requiredPermission={P.factures.view}><AvoirPDFPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Notes de débit */}
                <Route path="/notes-debut" element={<ProtectedRoute requiredPermission={P.notes.view}><NotesDebutPage /></ProtectedRoute>} />
                <Route path="/notes-debut/nouvelle" element={<ProtectedRoute requiredPermission={P.notes.create}><NouvelleNoteDebutPage /></ProtectedRoute>} />
                <Route path="/notes-debut/ouverture-port" element={<ProtectedRoute requiredPermission={P.notes.create}><NouvelleNoteOuverturePortPage /></ProtectedRoute>} />
                <Route path="/notes-debut/detention" element={<ProtectedRoute requiredPermission={P.notes.create}><NouvelleNoteDetentionPage /></ProtectedRoute>} />
                <Route path="/notes-debut/reparation" element={<ProtectedRoute requiredPermission={P.notes.create}><NouvelleNoteReparationPage /></ProtectedRoute>} />
                <Route path="/notes-debut/relache" element={<ProtectedRoute requiredPermission={P.notes.create}><NouvelleNoteRelachePage /></ProtectedRoute>} />
                <Route path="/notes-debut/:id" element={<ProtectedRoute requiredPermission={P.notes.view}><NoteDebutDetailPage /></ProtectedRoute>} />
                <Route path="/notes-debut/:id/pdf" element={<ProtectedRoute requiredPermission={P.notes.view}><NoteDebutPDFPage /></ProtectedRoute>} />
                <Route path="/notes-debut/:id/modifier" element={<ProtectedRoute requiredPermission={P.notes.edit}><ModifierNoteDebutPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Finance */}
                <Route path="/caisse" element={<ProtectedRoute requiredPermission={P.caisse.view}><CaissePage /></ProtectedRoute>} />
                <Route path="/banque" element={<ProtectedRoute requiredPermission={P.banques.view}><BanquePage /></ProtectedRoute>} />
                <Route path="/caisse-globale" element={<ProtectedRoute requiredPermission={P.caisse.view}><CaisseGlobalePage /></ProtectedRoute>} />
                
                {/* Routes protégées - Reporting */}
                <Route path="/reporting" element={<ProtectedRoute requiredPermission={P.reporting.view}><ReportingPage /></ProtectedRoute>} />
                <Route path="/previsions" element={<ProtectedRoute requiredPermission={P.reporting.view}><PrevisionsPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Crédits */}
                <Route path="/credits" element={<ProtectedRoute requiredPermission={P.credits.view}><CreditsPage /></ProtectedRoute>} />
                <Route path="/credits/:id" element={<ProtectedRoute requiredPermission={P.credits.view}><CreditDetailPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Administration (rôle admin requis) */}
                <Route path="/utilisateurs" element={<ProtectedRoute requiredPermission={P.utilisateurs.view} requiredRole="administrateur"><UtilisateursPage /></ProtectedRoute>} />
                <Route path="/roles" element={<ProtectedRoute requiredPermission={P.roles.view} requiredRole="administrateur"><RolesPage /></ProtectedRoute>} />
                <Route path="/roles/nouveau" element={<ProtectedRoute requiredPermission={P.roles.view} requiredRole="administrateur"><RoleFormPage /></ProtectedRoute>} />
                <Route path="/roles/:id/modifier" element={<ProtectedRoute requiredPermission={P.roles.view} requiredRole="administrateur"><RoleFormPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Profil et Notifications (accessibles à tous les utilisateurs connectés) */}
                <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Configuration */}
                <Route path="/tracabilite" element={<ProtectedRoute requiredPermission={P.audit.view}><TracabilitePage /></ProtectedRoute>} />
                <Route path="/emails" element={<ProtectedRoute requiredPermission={P.configuration.view}><EmailsPage /></ProtectedRoute>} />
                <Route path="/taxes" element={<ProtectedRoute requiredPermission={P.configuration.view}><TaxesPage /></ProtectedRoute>} />
                <Route path="/banques" element={<ProtectedRoute requiredPermission={P.banques.view}><BanquesPage /></ProtectedRoute>} />
                <Route path="/numerotation" element={<ProtectedRoute requiredPermission={P.configuration.view}><NumerotationPage /></ProtectedRoute>} />
                <Route path="/categories-depenses" element={<ProtectedRoute requiredPermission={P.configuration.view}><CategoriesDepensesPage /></ProtectedRoute>} />
                <Route path="/categories-depenses/:id" element={<ProtectedRoute requiredPermission={P.configuration.view}><CategorieDepenseDetailPage /></ProtectedRoute>} />
                <Route path="/verification" element={<ProtectedRoute requiredPermission={P.factures.view}><VerificationDocumentPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Partenaires */}
                <Route path="/partenaires" element={<ProtectedRoute requiredPermission={P.partenaires.view}><PartenairesPage /></ProtectedRoute>} />
                <Route path="/partenaires/transitaires/:id" element={<ProtectedRoute requiredPermission={P.transitaires.view}><TransitaireDetailPage /></ProtectedRoute>} />
                <Route path="/partenaires/representants/:id" element={<ProtectedRoute requiredPermission={P.partenaires.view}><RepresentantDetailPage /></ProtectedRoute>} />
                <Route path="/partenaires/armateurs/:id" element={<ProtectedRoute requiredPermission={P.partenaires.view}><ArmateurDetailPage /></ProtectedRoute>} />
                <Route path="/partenaires/recu-prime/:id" element={<ProtectedRoute requiredPermission={P.partenaires.view}><RecuPrimePDFPage /></ProtectedRoute>} />
                
                {/* Routes protégées - Autres */}
                <Route path="/guide" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} />
                <Route path="/securite/connexions-suspectes" element={<ProtectedRoute requiredPermission={P.securite.view} requiredRole="administrateur"><ConnexionsSuspectesPage /></ProtectedRoute>} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
