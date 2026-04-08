import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Search, Users, BarChart3 } from "lucide-react";
import { useUtilisateursData, containerVariants, itemVariants } from "./utilisateurs/useUtilisateursData";
import { UtilisateursStatsCards } from "./utilisateurs/UtilisateursStatsCards";
import { UtilisateursTable } from "./utilisateurs/UtilisateursTable";
import { UtilisateursStats } from "./utilisateurs/UtilisateursStats";
import { UtilisateursModals } from "./utilisateurs/UtilisateursModals";

export default function UtilisateursPage() {
  const d = useUtilisateursData();

  return (
    <MainLayout title="Gestion des Utilisateurs">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <UtilisateursStatsCards stats={d.stats} isLoadingStats={d.isLoadingStats} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={d.activeTab} onValueChange={d.setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="liste" className="gap-2"><Users className="h-4 w-4" />Liste</TabsTrigger>
                <TabsTrigger value="statistiques" className="gap-2"><BarChart3 className="h-4 w-4" />Statistiques</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={d.searchTerm} onChange={(e) => { d.setSearchTerm(e.target.value); d.setCurrentPage(1); }} className="pl-9" />
                </div>
                <Button variant="outline" size="icon" onClick={() => d.refetchUsers()} disabled={d.isFetching}>
                  <RefreshCw className={`h-4 w-4 ${d.isFetching ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={d.handleOpenAdd} className="gap-2"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nouvel utilisateur</span></Button>
              </div>
            </div>

            <TabsContent value="liste" className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                <Select value={d.filterStatut} onValueChange={(v) => { d.setFilterStatut(v); d.setCurrentPage(1); }}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>{d.statutOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={d.filterRole} onValueChange={(v) => { d.setFilterRole(v); d.setCurrentPage(1); }}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Rôle" /></SelectTrigger>
                  <SelectContent>{d.roleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                {(d.filterStatut !== 'all' || d.filterRole !== 'all' || d.searchTerm) && (
                  <Button variant="ghost" size="sm" onClick={() => { d.setSearchTerm(''); d.setFilterStatut('all'); d.setFilterRole('all'); d.setCurrentPage(1); }}>Réinitialiser</Button>
                )}
              </div>
              <UtilisateursTable
                users={d.users} totalUsers={d.totalUsers} totalPages={d.totalPages}
                currentPage={d.currentPage} setCurrentPage={d.setCurrentPage}
                isLoadingUsers={d.isLoadingUsers} searchTerm={d.searchTerm}
                filterRole={d.filterRole} filterStatut={d.filterStatut}
                getInitials={d.getInitials} getRoleName={d.getRoleName} formatDate={d.formatDate}
                handleOpenAdd={d.handleOpenAdd} handleOpenEdit={d.handleOpenEdit}
                handleOpenDelete={d.handleOpenDelete} handleToggleActif={d.handleToggleActif}
                toggleActifPending={d.toggleActif.isPending}
              />
            </TabsContent>

            <TabsContent value="statistiques" className="mt-6">
              <UtilisateursStats stats={d.stats} pieChartData={d.pieChartData} isLoadingStats={d.isLoadingStats} />
            </TabsContent>
          </Tabs>
        </motion.div>

        <UtilisateursModals
          showModal={d.showModal} setShowModal={d.setShowModal}
          showDeleteDialog={d.showDeleteDialog} setShowDeleteDialog={d.setShowDeleteDialog}
          selectedUser={d.selectedUser} isEditing={d.isEditing}
          showPassword={d.showPassword} setShowPassword={d.setShowPassword}
          formData={d.formData} setFormData={d.setFormData} roles={d.roles}
          validateForm={d.validateForm} handleSubmit={d.handleSubmit} handleDelete={d.handleDelete}
          createPending={d.createUser.isPending} updatePending={d.updateUser.isPending} deletePending={d.deleteUser.isPending}
        />
      </motion.div>
    </MainLayout>
  );
}
