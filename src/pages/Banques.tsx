import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Building2, Plus, CreditCard, CheckCircle, Wallet } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";
import { DocumentFilters } from "@/components/shared/documents/DocumentFilters";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import { useBanquesData } from "./banque/useBanquesData";
import { BanquesTable } from "./banque/BanquesTable";
import { BanqueFormModal, BanqueDeleteDialog } from "./banque/BanquesModals";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function BanquesPage() {
  const d = useBanquesData();

  if (d.isLoading) return <MainLayout title="Gestion des Banques"><DocumentLoadingState message="Chargement des banques..." /></MainLayout>;

  if (d.error) {
    return (
      <MainLayout title="Gestion des Banques">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erreur lors du chargement des banques</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">Réessayer</Button>
        </div>
      </MainLayout>
    );
  }

  if (d.banques.length === 0) {
    return (
      <MainLayout title="Gestion des Banques">
        <DocumentEmptyState icon={Building2} title="Aucun compte bancaire" description="Ajoutez vos comptes bancaires pour gérer les paiements par virement et chèque." actionLabel="Nouvelle banque" onAction={d.handleOpenAdd} />
        <BanqueFormModal open={d.showModal} onOpenChange={d.setShowModal} isEditing={false} formData={d.formData} setFormData={d.setFormData} onSubmit={d.handleSubmit} isPending={d.createBanqueMutation.isPending} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Gestion des Banques">
      <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10"><Building2 className="h-6 w-6 text-primary" /></div>
              Gestion des Banques
            </h1>
            <p className="text-muted-foreground mt-1">Gérez vos comptes bancaires</p>
          </div>
          <Button onClick={d.handleOpenAdd} className="transition-all duration-200 hover:scale-105"><Plus className="h-4 w-4 mr-2" />Nouvelle banque</Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentStatCard title="Total Comptes" value={d.banques.length} icon={CreditCard} subtitle="comptes bancaires" variant="primary" delay={0} />
          <DocumentStatCard title="Comptes Actifs" value={d.comptesActifs} icon={CheckCircle} subtitle="en service" variant="success" delay={0.1} />
          <DocumentStatCard title="Comptes Inactifs" value={d.comptesInactifs} icon={Building2} subtitle="désactivés" variant="warning" delay={0.2} />
          <DocumentStatCard title="Solde Total" value={formatMontant(d.totalSolde)} icon={Wallet} subtitle="comptes actifs" variant={d.totalSolde >= 0 ? "info" : "danger"} delay={0.3} />
        </div>

        <motion.div variants={itemVariants}>
          <DocumentFilters searchTerm={d.searchTerm} onSearchChange={d.setSearchTerm} searchPlaceholder="Rechercher par nom, n° compte, IBAN..." />
        </motion.div>

        <BanquesTable
          banques={d.filteredBanques} onEdit={d.handleOpenEdit}
          onDelete={(b) => { d.setSelectedBanque(b); d.setShowDeleteDialog(true); }}
          onToggleActif={d.handleToggleActif} onClearSearch={() => d.setSearchTerm("")}
        />
      </motion.div>

      <BanqueFormModal open={d.showModal} onOpenChange={d.setShowModal} isEditing={d.isEditing} formData={d.formData} setFormData={d.setFormData} onSubmit={d.handleSubmit} isPending={d.createBanqueMutation.isPending || d.updateBanqueMutation.isPending} />
      <BanqueDeleteDialog open={d.showDeleteDialog} onOpenChange={d.setShowDeleteDialog} banque={d.selectedBanque} onDelete={d.handleDelete} isPending={d.deleteBanqueMutation.isPending} />
    </MainLayout>
  );
}
