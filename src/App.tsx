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
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="logistiga-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
          <OfflineIndicator />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Route publique */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Routes protégées */}
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
                <Route path="/clients/nouveau" element={<ProtectedRoute><NouveauClientPage /></ProtectedRoute>} />
                <Route path="/clients/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
                <Route path="/clients/:id/modifier" element={<ProtectedRoute><NouveauClientPage /></ProtectedRoute>} />
                <Route path="/devis" element={<ProtectedRoute><DevisPage /></ProtectedRoute>} />
                <Route path="/devis/nouveau" element={<ProtectedRoute><NouveauDevisPage /></ProtectedRoute>} />
                <Route path="/devis/:id" element={<ProtectedRoute><DevisDetailPage /></ProtectedRoute>} />
                <Route path="/devis/:id/pdf" element={<ProtectedRoute><DevisPDFPage /></ProtectedRoute>} />
                <Route path="/devis/:id/modifier" element={<ProtectedRoute><ModifierDevisPage /></ProtectedRoute>} />
                <Route path="/ordres" element={<ProtectedRoute><OrdresTravailPage /></ProtectedRoute>} />
                <Route path="/ordres/nouveau" element={<ProtectedRoute><NouvelOrdrePage /></ProtectedRoute>} />
                <Route path="/ordres/:id" element={<ProtectedRoute><OrdreDetailPage /></ProtectedRoute>} />
                <Route path="/ordres/:id/pdf" element={<ProtectedRoute><OrdrePDFPage /></ProtectedRoute>} />
                <Route path="/ordres/:id/connaissement" element={<ProtectedRoute><ConnaissementPDFPage /></ProtectedRoute>} />
                <Route path="/ordres/:id/modifier" element={<ProtectedRoute><ModifierOrdrePage /></ProtectedRoute>} />
                <Route path="/factures" element={<ProtectedRoute><FacturesPage /></ProtectedRoute>} />
                <Route path="/factures/nouvelle" element={<ProtectedRoute><NouvelleFacturePage /></ProtectedRoute>} />
                <Route path="/factures/:id" element={<ProtectedRoute><FactureDetailPage /></ProtectedRoute>} />
                <Route path="/factures/:id/pdf" element={<ProtectedRoute><FacturePDFPage /></ProtectedRoute>} />
                <Route path="/factures/:id/modifier" element={<ProtectedRoute><ModifierFacturePage /></ProtectedRoute>} />
                
                <Route path="/annulations" element={<ProtectedRoute><AnnulationsPage /></ProtectedRoute>} />
                <Route path="/annulations/:id/avoir" element={<ProtectedRoute><AvoirPDFPage /></ProtectedRoute>} />
                <Route path="/notes-debut" element={<ProtectedRoute><NotesDebutPage /></ProtectedRoute>} />
                <Route path="/notes-debut/nouvelle" element={<ProtectedRoute><NouvelleNoteDebutPage /></ProtectedRoute>} />
                <Route path="/notes-debut/ouverture-port" element={<ProtectedRoute><NouvelleNoteOuverturePortPage /></ProtectedRoute>} />
                <Route path="/notes-debut/detention" element={<ProtectedRoute><NouvelleNoteDetentionPage /></ProtectedRoute>} />
                <Route path="/notes-debut/reparation" element={<ProtectedRoute><NouvelleNoteReparationPage /></ProtectedRoute>} />
                <Route path="/notes-debut/relache" element={<ProtectedRoute><NouvelleNoteRelachePage /></ProtectedRoute>} />
                <Route path="/notes-debut/:id" element={<ProtectedRoute><NoteDebutDetailPage /></ProtectedRoute>} />
                <Route path="/notes-debut/:id/pdf" element={<ProtectedRoute><NoteDebutPDFPage /></ProtectedRoute>} />
                <Route path="/notes-debut/:id/modifier" element={<ProtectedRoute><ModifierNoteDebutPage /></ProtectedRoute>} />
                <Route path="/caisse" element={<ProtectedRoute><CaissePage /></ProtectedRoute>} />
                <Route path="/banque" element={<ProtectedRoute><BanquePage /></ProtectedRoute>} />
                <Route path="/caisse-globale" element={<ProtectedRoute><CaisseGlobalePage /></ProtectedRoute>} />
                <Route path="/reporting" element={<ProtectedRoute><ReportingPage /></ProtectedRoute>} />
                <Route path="/previsions" element={<ProtectedRoute><PrevisionsPage /></ProtectedRoute>} />
                <Route path="/credits" element={<ProtectedRoute><CreditsPage /></ProtectedRoute>} />
                <Route path="/credits/:id" element={<ProtectedRoute><CreditDetailPage /></ProtectedRoute>} />
                <Route path="/utilisateurs" element={<ProtectedRoute><UtilisateursPage /></ProtectedRoute>} />
                <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
                <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/tracabilite" element={<ProtectedRoute><TracabilitePage /></ProtectedRoute>} />
                <Route path="/emails" element={<ProtectedRoute><EmailsPage /></ProtectedRoute>} />
                <Route path="/taxes" element={<ProtectedRoute><TaxesPage /></ProtectedRoute>} />
                <Route path="/banques" element={<ProtectedRoute><BanquesPage /></ProtectedRoute>} />
                <Route path="/numerotation" element={<ProtectedRoute><NumerotationPage /></ProtectedRoute>} />
                <Route path="/categories-depenses" element={<ProtectedRoute><CategoriesDepensesPage /></ProtectedRoute>} />
                <Route path="/categories-depenses/:id" element={<ProtectedRoute><CategorieDepenseDetailPage /></ProtectedRoute>} />
                <Route path="/verification" element={<ProtectedRoute><VerificationDocumentPage /></ProtectedRoute>} />
                <Route path="/partenaires" element={<ProtectedRoute><PartenairesPage /></ProtectedRoute>} />
                <Route path="/partenaires/transitaires/:id" element={<ProtectedRoute><TransitaireDetailPage /></ProtectedRoute>} />
                <Route path="/partenaires/representants/:id" element={<ProtectedRoute><RepresentantDetailPage /></ProtectedRoute>} />
                <Route path="/partenaires/armateurs/:id" element={<ProtectedRoute><ArmateurDetailPage /></ProtectedRoute>} />
                <Route path="/partenaires/recu-prime/:id" element={<ProtectedRoute><RecuPrimePDFPage /></ProtectedRoute>} />
                <Route path="/guide" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} />
                <Route path="/securite/connexions-suspectes" element={<ProtectedRoute><ConnexionsSuspectesPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
