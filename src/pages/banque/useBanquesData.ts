import { useState } from "react";
import { useBanques, useCreateBanque, useUpdateBanque, useDeleteBanque } from "@/hooks/use-commercial";
import { Banque } from "@/lib/api/commercial";

export function useBanquesData() {
  const { data: banques = [], isLoading, error } = useBanques();
  const createBanqueMutation = useCreateBanque();
  const updateBanqueMutation = useUpdateBanque();
  const deleteBanqueMutation = useDeleteBanque();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBanque, setSelectedBanque] = useState<Banque | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    nom: "", numero_compte: "", iban: "", swift: "", solde: "", actif: true,
  });

  const resetForm = () => {
    setFormData({ nom: "", numero_compte: "", iban: "", swift: "", solde: "", actif: true });
  };

  const handleOpenAdd = () => { resetForm(); setIsEditing(false); setSelectedBanque(null); setShowModal(true); };

  const handleOpenEdit = (banque: Banque) => {
    setFormData({
      nom: banque.nom, numero_compte: banque.numero_compte || "",
      iban: banque.iban || "", swift: banque.swift || "",
      solde: String(banque.solde || 0), actif: banque.actif,
    });
    setSelectedBanque(banque); setIsEditing(true); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom) return;
    const data = {
      nom: formData.nom, numero_compte: formData.numero_compte,
      iban: formData.iban, swift: formData.swift.toUpperCase(),
      solde: parseFloat(formData.solde) || 0, actif: formData.actif,
    };
    if (isEditing && selectedBanque) await updateBanqueMutation.mutateAsync({ id: selectedBanque.id, data });
    else await createBanqueMutation.mutateAsync(data);
    setShowModal(false); resetForm();
  };

  const handleDelete = async () => {
    if (selectedBanque) await deleteBanqueMutation.mutateAsync(selectedBanque.id);
    setShowDeleteDialog(false); setSelectedBanque(null);
  };

  const handleToggleActif = async (banque: Banque) => {
    await updateBanqueMutation.mutateAsync({ id: banque.id, data: { actif: !banque.actif } });
  };

  const filteredBanques = banques.filter((banque) => {
    return !searchTerm ||
      banque.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banque.numero_compte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banque.iban?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalSolde = banques.filter((b) => b.actif).reduce((sum, b) => sum + (b.solde || 0), 0);
  const comptesActifs = banques.filter((b) => b.actif).length;
  const comptesInactifs = banques.filter((b) => !b.actif).length;

  return {
    banques, isLoading, error, filteredBanques,
    totalSolde, comptesActifs, comptesInactifs,
    showModal, setShowModal, showDeleteDialog, setShowDeleteDialog,
    selectedBanque, setSelectedBanque, isEditing,
    formData, setFormData, searchTerm, setSearchTerm,
    handleOpenAdd, handleOpenEdit, handleSubmit, handleDelete, handleToggleActif,
    createBanqueMutation, updateBanqueMutation, deleteBanqueMutation,
  };
}
