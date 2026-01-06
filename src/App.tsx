import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import ClientsPage from "./pages/Clients";
import ClientDetailPage from "./pages/ClientDetail";
import DevisPage from "./pages/Devis";
import OrdresTravailPage from "./pages/OrdresTravail";
import NouvelOrdrePage from "./pages/NouvelOrdre";
import FacturesPage from "./pages/Factures";
import AnnulationsPage from "./pages/Annulations";
import CaissePage from "./pages/Caisse";
import BanquePage from "./pages/Banque";
import CaisseGlobalePage from "./pages/CaisseGlobale";
import ReportingPage from "./pages/Reporting";
import PrevisionsPage from "./pages/Previsions";
import CreditsPage from "./pages/Credits";
import UtilisateursPage from "./pages/Utilisateurs";
import RolesPage from "./pages/Roles";
import TracabilitePage from "./pages/Tracabilite";
import EmailsPage from "./pages/Emails";
import TaxesPage from "./pages/Taxes";
import BanquesPage from "./pages/Banques";
import NumerotationPage from "./pages/Numerotation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/ordres" replace />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/devis" element={<DevisPage />} />
          <Route path="/ordres" element={<OrdresTravailPage />} />
          <Route path="/ordres/nouveau" element={<NouvelOrdrePage />} />
          <Route path="/factures" element={<FacturesPage />} />
          <Route path="/annulations" element={<AnnulationsPage />} />
          <Route path="/caisse" element={<CaissePage />} />
          <Route path="/banque" element={<BanquePage />} />
          <Route path="/caisse-globale" element={<CaisseGlobalePage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/previsions" element={<PrevisionsPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/utilisateurs" element={<UtilisateursPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/tracabilite" element={<TracabilitePage />} />
          <Route path="/emails" element={<EmailsPage />} />
          <Route path="/taxes" element={<TaxesPage />} />
          <Route path="/banques" element={<BanquesPage />} />
          <Route path="/numerotation" element={<NumerotationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
