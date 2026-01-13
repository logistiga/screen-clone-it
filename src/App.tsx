import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LoginPage from "./pages/Login";
import NotFound from "./pages/NotFound";
import DashboardPage from "./pages/Dashboard";
import ClientsPage from "./pages/Clients";
import ClientDetailPage from "./pages/ClientDetail";
import DevisPage from "./pages/Devis";
import NouveauDevisPage from "./pages/NouveauDevis";
import DevisDetailPage from "./pages/DevisDetail";
import DevisPDFPage from "./pages/DevisPDF";
import ModifierDevisPage from "./pages/ModifierDevis";
import NouveauClientPage from "./pages/NouveauClient";
import OrdresTravailPage from "./pages/OrdresTravail";
import NouvelOrdrePage from "./pages/NouvelOrdre";
import OrdreDetailPage from "./pages/OrdreDetail";
import OrdrePDFPage from "./pages/OrdrePDF";
import ConnaissementPDFPage from "./pages/ConnaissementPDF";
import ModifierOrdrePage from "./pages/ModifierOrdre";
import FacturesPage from "./pages/Factures";
import NouvelleFacturePage from "./pages/NouvelleFacture";
import FactureDetailPage from "./pages/FactureDetail";
import FacturePDFPage from "./pages/FacturePDF";
import ModifierFacturePage from "./pages/ModifierFacture";

import AnnulationsPage from "./pages/Annulations";
import AvoirPDFPage from "./pages/AvoirPDF";
import CaissePage from "./pages/Caisse";
import BanquePage from "./pages/Banque";
import CaisseGlobalePage from "./pages/CaisseGlobale";
import ReportingPage from "./pages/Reporting";
import PrevisionsPage from "./pages/Previsions";
import CreditsPage from "./pages/Credits";
import CreditDetailPage from "./pages/CreditDetail";
import UtilisateursPage from "./pages/Utilisateurs";
import RolesPage from "./pages/Roles";
import TracabilitePage from "./pages/Tracabilite";
import EmailsPage from "./pages/Emails";
import TaxesPage from "./pages/Taxes";
import BanquesPage from "./pages/Banques";
import NumerotationPage from "./pages/Numerotation";
import NotesDebutPage from "./pages/NotesDebut";
import NouvelleNoteDebutPage from "./pages/NouvelleNoteDebut";
import NouvelleNoteOuverturePortPage from "./pages/NouvelleNoteOuverturePort";
import NouvelleNoteDetentionPage from "./pages/NouvelleNoteDetention";
import NouvelleNoteReparationPage from "./pages/NouvelleNoteReparation";
import NouvelleNoteRelachePage from "./pages/NouvelleNoteRelache";
import NoteDebutDetailPage from "./pages/NoteDebutDetail";
import ModifierNoteDebutPage from "./pages/ModifierNoteDebut";
import VerificationDocumentPage from "./pages/VerificationDocument";
import PartenairesPage from "./pages/Partenaires";
import TransitaireDetailPage from "./pages/TransitaireDetail";
import RepresentantDetailPage from "./pages/RepresentantDetail";
import ArmateurDetailPage from "./pages/ArmateurDetail";
import CategoriesDepensesPage from "./pages/CategoriesDepenses";
import CategorieDepenseDetailPage from "./pages/CategorieDepenseDetail";
import RecuPrimePDFPage from "./pages/RecuPrimePDF";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="lojistiga-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
