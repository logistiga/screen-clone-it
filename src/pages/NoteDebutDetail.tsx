import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Download,
  Mail,
  CreditCard,
  Trash2,
  Anchor,
  Container,
  Wrench,
  Calendar,
  Clock,
  FileText,
  User,
  Receipt,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { PaiementNoteModal } from "@/components/notes/PaiementNoteModal";
import { EmailNoteModal } from "@/components/notes/EmailNoteModal";

interface NoteDebut {
  id: string;
  number: string;
  client: string;
  clientId: string;
  clientEmail: string;
  type: "ouverture_port" | "detention" | "reparation";
  ordresTravail: string[];
  blNumber: string;
  containerNumber: string;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  tarifJournalier: number;
  montantTotal: number;
  paid: number;
  advance: number;
  status: "pending" | "invoiced" | "paid" | "cancelled" | "partial";
  description: string;
  paiements: {
    id: string;
    date: string;
    montant: number;
    methode: string;
    reference?: string;
  }[];
}

const mockNote: NoteDebut = {
  id: "1",
  number: "ND-2024-001",
  client: "MAERSK LINE",
  clientId: "1",
  clientEmail: "contact@maersk.com",
  type: "ouverture_port",
  ordresTravail: ["OT-2024-001"],
  blNumber: "BL-2024-001",
  containerNumber: "MSKU1234567",
  dateDebut: "2024-01-15",
  dateFin: "2024-01-20",
  nombreJours: 6,
  tarifJournalier: 25000,
  montantTotal: 150000,
  paid: 0,
  advance: 50000,
  status: "pending",
  description: "Ouverture port standard pour conteneur 20 pieds",
  paiements: [
    {
      id: "p1",
      date: "2024-01-15",
      montant: 50000,
      methode: "Avance espèces",
      reference: "AV-001",
    },
  ],
};

const typeConfig = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

const statusConfig = {
  pending: { label: "En attente", class: "bg-warning/20 text-warning" },
  invoiced: { label: "Facturée", class: "bg-primary/20 text-primary" },
  paid: { label: "Payée", class: "bg-success/20 text-success" },
  cancelled: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  partial: { label: "Partielle", class: "bg-cyan-500/20 text-cyan-600" },
};

export default function NoteDebutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<NoteDebut>(mockNote);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const typeInfo = typeConfig[note.type];
  const TypeIcon = typeInfo.icon;
  const status = statusConfig[note.status];
  const remaining = note.montantTotal - note.paid - note.advance;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-GA", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = () => {
    toast({
      title: "Note supprimée",
      description: `La note ${note.number} a été supprimée.`,
    });
    navigate("/notes-debut");
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Téléchargement PDF",
      description: `Le PDF de la note ${note.number} est en cours de génération...`,
    });
  };

  const handlePaiementSuccess = (montant: number) => {
    setNote((prev) => ({
      ...prev,
      paid: prev.paid + montant,
      status: prev.paid + montant + prev.advance >= prev.montantTotal ? "paid" : "partial",
      paiements: [
        ...prev.paiements,
        {
          id: `p${prev.paiements.length + 1}`,
          date: new Date().toISOString().split("T")[0],
          montant,
          methode: "Paiement",
        },
      ],
    }));
  };

  return (
    <MainLayout title={`Note ${note.number}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/notes-debut")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">{note.number}</h1>
                <Badge className={status.class}>{status.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{note.client}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/notes-debut/${id}/modifier`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => setShowEmailModal(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            {remaining > 0 && (
              <Button onClick={() => setShowPaiementModal(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Paiement
              </Button>
            )}
            {note.paid === 0 && note.advance === 0 && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations de la note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge className={`${typeInfo.color} border text-base px-4 py-2`}>
                  <TypeIcon className="h-5 w-5 mr-2" />
                  {typeInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" /> Client
                  </p>
                  <p className="font-medium">{note.client}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">N° Conteneur</p>
                  <p className="font-mono font-medium">{note.containerNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">N° BL</p>
                  <p className="font-medium">{note.blNumber}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Date début
                  </p>
                  <p className="font-medium">{note.dateDebut}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Date fin
                  </p>
                  <p className="font-medium">{note.dateFin}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Nombre de jours
                  </p>
                  <p className="font-bold text-xl">{note.nombreJours}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tarif journalier</p>
                  <p className="font-medium">{formatCurrency(note.tarifJournalier)} FCFA</p>
                </div>
              </div>

              {note.description && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{note.description}</p>
                  </div>
                </>
              )}

              {note.ordresTravail.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ordres de travail liés</p>
                    <div className="flex flex-wrap gap-2">
                      {note.ordresTravail.map((ot) => (
                        <Badge key={ot} variant="outline" className="cursor-pointer hover:bg-muted">
                          {ot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Résumé financier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Résumé financier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Montant total</span>
                  <span className="font-bold text-xl">{formatCurrency(note.montantTotal)} FCFA</span>
                </div>
                <Separator />
                {note.advance > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="text-cyan-600 font-medium">
                      -{formatCurrency(note.advance)} FCFA
                    </span>
                  </div>
                )}
                {note.paid > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payé</span>
                    <span className="text-success font-medium">
                      -{formatCurrency(note.paid)} FCFA
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Reste à payer</span>
                  <span className={`font-bold text-xl ${remaining > 0 ? "text-destructive" : "text-success"}`}>
                    {formatCurrency(remaining)} FCFA
                  </span>
                </div>
              </div>

              {remaining > 0 && (
                <Button className="w-full" onClick={() => setShowPaiementModal(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Enregistrer un paiement
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historique des paiements */}
        {note.paiements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {note.paiements.map((paiement) => (
                    <TableRow key={paiement.id}>
                      <TableCell>{paiement.date}</TableCell>
                      <TableCell>{paiement.methode}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {paiement.reference || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(paiement.montant)} FCFA
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <PaiementNoteModal
        open={showPaiementModal}
        onOpenChange={setShowPaiementModal}
        noteNumero={note.number}
        montantRestant={remaining}
        onSuccess={handlePaiementSuccess}
      />

      <EmailNoteModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        noteNumero={note.number}
        clientEmail={note.clientEmail}
        clientNom={note.client}
        noteType={typeInfo.label}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note {note.number} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
