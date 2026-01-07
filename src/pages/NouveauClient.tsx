import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Users, Plus, Trash2, Save, User, Mail, Phone, CreditCard, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { useClient, useCreateClient, useUpdateClient } from "@/hooks/use-commercial";

interface Contact {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  fonction: string;
}

const getInitialContact = (): Contact => ({
  id: Date.now().toString(),
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  fonction: "",
});

export default function NouveauClientPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Mode édition si id existe
  const isEditMode = !!id;
  
  // Fetch client data if in edit mode
  const { data: existingClient, isLoading: isLoadingClient } = useClient(id || '');
  
  // Mutations
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();

  // Informations du client
  const [nom, setNom] = useState("");
  const [type, setType] = useState("Entreprise");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("Gabon");
  const [rccm, setRccm] = useState("");
  const [nif, setNif] = useState("");
  const [notes, setNotes] = useState("");
  const [limiteCredit, setLimiteCredit] = useState<number>(0);

  // Contacts/Partenaires
  const [contacts, setContacts] = useState<Contact[]>([getInitialContact()]);

  // Populate form when editing
  useEffect(() => {
    if (existingClient && isEditMode) {
      setNom(existingClient.nom || "");
      setType(existingClient.type || "entreprise");
      setEmail(existingClient.email || "");
      setTelephone(existingClient.telephone || "");
      setAdresse(existingClient.adresse || "");
      setVille(existingClient.ville || "");
      setPays(existingClient.pays || "Gabon");
      setRccm(existingClient.rccm || "");
      setNif(existingClient.nif || "");
      setNotes(existingClient.notes || "");
      setLimiteCredit(existingClient.limite_credit || 0);
    }
  }, [existingClient, isEditMode]);

  const handleAddContact = () => {
    setContacts([...contacts, getInitialContact()]);
  };

  const handleRemoveContact = (contactId: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(c => c.id !== contactId));
    }
  };

  const handleContactChange = (contactId: string, field: keyof Contact, value: string) => {
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nom) {
      return;
    }

    const clientData = {
      nom,
      type,
      email: email || null,
      telephone: telephone || null,
      adresse: adresse || null,
      ville: ville || null,
      pays,
      rccm: rccm || null,
      nif: nif || null,
      notes: notes || null,
      limite_credit: limiteCredit,
    };

    try {
      if (isEditMode && id) {
        await updateClientMutation.mutateAsync({ id, data: clientData });
      } else {
        await createClientMutation.mutateAsync(clientData);
      }
      navigate("/clients");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createClientMutation.isPending || updateClientMutation.isPending;

  if (isEditMode && isLoadingClient) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditMode ? "Modifier client" : "Nouveau client"}>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {isEditMode ? `Modifier ${existingClient?.nom}` : "Nouveau client"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditMode ? "Modifier les informations du client" : "Créer un nouveau client avec ses contacts"}
            </p>
          </div>
        </div>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nom">Nom du client *</Label>
                  <Input
                    id="nom"
                    placeholder="Ex: TOTAL GABON"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="text-lg font-medium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type de client</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entreprise">Entreprise</SelectItem>
                      <SelectItem value="Particulier">Particulier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email principal</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@entreprise.ga"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone principal</Label>
                  <Input
                    id="telephone"
                    placeholder="+241 01 00 00 00"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    placeholder="Adresse complète"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    placeholder="Libreville"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <Input
                    id="pays"
                    placeholder="Gabon"
                    value={pays}
                    onChange={(e) => setPays(e.target.value)}
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rccm">RCCM</Label>
                  <Input
                    id="rccm"
                    placeholder="LBV-2020-B-12345"
                    value={rccm}
                    onChange={(e) => setRccm(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    placeholder="123456789"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plafond de crédit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Conditions financières
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plafond" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Limite de crédit (FCFA)
                  </Label>
                  <Input
                    id="plafond"
                    type="number"
                    placeholder="0"
                    value={limiteCredit || ""}
                    onChange={(e) => setLimiteCredit(parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                  <p className="text-xs text-muted-foreground">
                    Montant maximum que le client peut avoir en crédit. Laisser à 0 pour illimité.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts / Partenaires */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Contacts / Interlocuteurs
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddContact}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un contact
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Ajoutez les personnes avec qui vous communiquez chez ce client (pour l'envoi de devis, factures, etc.)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {contacts.map((contact, index) => (
                  <div key={contact.id} className="space-y-4">
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contact {index + 1}
                      </span>
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveContact(contact.id)}
                          className="text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Prénom</Label>
                        <Input
                          placeholder="Jean"
                          value={contact.prenom}
                          onChange={(e) => handleContactChange(contact.id, 'prenom', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          placeholder="DUPONT"
                          value={contact.nom}
                          onChange={(e) => handleContactChange(contact.id, 'nom', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fonction</Label>
                        <Input
                          placeholder="Responsable logistique"
                          value={contact.fonction}
                          onChange={(e) => handleContactChange(contact.id, 'fonction', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </Label>
                        <Input
                          type="email"
                          placeholder="jean.dupont@entreprise.ga"
                          value={contact.email}
                          onChange={(e) => handleContactChange(contact.id, 'email', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Téléphone
                        </Label>
                        <Input
                          placeholder="+241 07 00 00 00"
                          value={contact.telephone}
                          onChange={(e) => handleContactChange(contact.id, 'telephone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notes internes sur ce client..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/clients")} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" className="gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditMode ? "Enregistrer les modifications" : "Créer le client"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
