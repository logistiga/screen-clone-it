import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Ship, Truck, User } from "lucide-react";
import { NouveauTransitaireModal } from "@/components/NouveauTransitaireModal";
import { NouveauRepresentantModal } from "@/components/NouveauRepresentantModal";
import { ViewToggle } from "@/components/partenaires";
import { usePartenairesData } from "./partenaires/usePartenairesData";
import { PrimesBanner } from "./partenaires/PrimesBanner";
import { TransitairesTab } from "./partenaires/TransitairesTab";
import { RepresentantsTab } from "./partenaires/RepresentantsTab";
import { ArmateursTab } from "./partenaires/ArmateursTab";

export default function PartenairesPage() {
  const d = usePartenairesData();

  return (
    <MainLayout title="Partenaires">
      <div className="space-y-6">
        <PrimesBanner totalPrimesAPayer={d.totalPrimesAPayer} primesTransitaires={d.primesTransitaires} primesRepresentants={d.primesRepresentants} />

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un partenaire..." value={d.searchTerm} onChange={(e) => d.handleSearchChange(e.target.value)} className="pl-9" />
          </div>
          <ViewToggle view={d.viewMode} onChange={d.setViewMode} />
        </div>

        <Tabs defaultValue="transitaires" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="transitaires" className="gap-2 data-[state=active]:shadow-sm">
              <Truck className="h-4 w-4" /><span className="hidden sm:inline">Transitaires</span>
              <Badge variant="secondary" className="ml-1">{d.transitaires.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="representants" className="gap-2 data-[state=active]:shadow-sm">
              <User className="h-4 w-4" /><span className="hidden sm:inline">Représentants</span>
              <Badge variant="secondary" className="ml-1">{d.representants.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="armateurs" className="gap-2 data-[state=active]:shadow-sm">
              <Ship className="h-4 w-4" /><span className="hidden sm:inline">Armateurs</span>
              <Badge variant="secondary" className="ml-1">{d.armateurs.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transitaires">
            <TransitairesTab
              transitaires={d.transitaires} paginatedTransitaires={d.paginatedTransitaires} filteredTransitaires={d.filteredTransitaires}
              isLoading={d.isLoadingTransitaires} error={d.errorTransitaires} refetch={d.refetchTransitaires}
              viewMode={d.viewMode} transitairesActifs={d.transitairesActifs} primesTransitaires={d.primesTransitaires}
              page={d.transitairesPage} setPage={d.setTransitairesPage} pageSize={d.transitairesPageSize} setPageSize={d.setTransitairesPageSize} totalPages={d.transitairesTotalPages}
              onAdd={() => d.setShowTransitaireModal(true)} onDelete={d.setDeleteConfirm}
            />
          </TabsContent>

          <TabsContent value="representants">
            <RepresentantsTab
              representants={d.representants} paginatedRepresentants={d.paginatedRepresentants} filteredRepresentants={d.filteredRepresentants}
              isLoading={d.isLoadingRepresentants} error={d.errorRepresentants} refetch={d.refetchRepresentants}
              viewMode={d.viewMode} representantsActifs={d.representantsActifs} primesRepresentants={d.primesRepresentants}
              page={d.representantsPage} setPage={d.setRepresentantsPage} pageSize={d.representantsPageSize} setPageSize={d.setRepresentantsPageSize} totalPages={d.representantsTotalPages}
              onAdd={() => d.setShowRepresentantModal(true)} onDelete={d.setDeleteConfirm}
            />
          </TabsContent>

          <TabsContent value="armateurs">
            <ArmateursTab
              armateurs={d.armateurs} paginatedArmateurs={d.paginatedArmateurs} filteredArmateurs={d.filteredArmateurs}
              isLoading={d.isLoadingArmateurs} error={d.errorArmateurs} refetch={d.refetchArmateurs}
              viewMode={d.viewMode} armateursActifs={d.armateursActifs}
              page={d.armateursPage} setPage={d.setArmateursPage} pageSize={d.armateursPageSize} setPageSize={d.setArmateursPageSize} totalPages={d.armateursTotalPages}
              syncArmateursMutation={d.syncArmateursMutation} editingTypeConteneur={d.editingTypeConteneur} setEditingTypeConteneur={d.setEditingTypeConteneur} updateTypeConteneur={d.updateTypeConteneur}
            />
          </TabsContent>
        </Tabs>

        <NouveauTransitaireModal open={d.showTransitaireModal} onOpenChange={d.setShowTransitaireModal} />
        <NouveauRepresentantModal open={d.showRepresentantModal} onOpenChange={d.setShowRepresentantModal} />

        <AlertDialog open={!!d.deleteConfirm} onOpenChange={() => d.setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {d.deleteConfirm?.type.toLowerCase()} "{d.deleteConfirm?.nom}" ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={d.handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
