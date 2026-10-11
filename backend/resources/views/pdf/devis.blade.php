<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>@page { margin: 10mm 10mm 30mm 10mm; }</style><title>Devis {{ $devis->numero }}</title></head>
<body>
@include('pdf.partials.document-officiel', [
    'doc' => $devis,
    'client' => $client ?? $devis->client,
    'titre' => 'DEVIS',
    'date1' => $devis->date_creation ?? $devis->created_at,
    'label2' => 'Validité',
    'date2' => $devis->date_validite,
    'clientTitre' => 'CLIENT',
    'tableau' => \App\Support\DocumentPdfLignes::build($devis),
    'libelleLigne' => 'Description',
    'libelleMontant' => 'Montant HT',
    'conditions' => [
        'Devis valable jusqu\'au ' . ($devis->date_validite ? \Carbon\Carbon::parse($devis->date_validite)->format('d/m/Y') : '-'),
        'Paiement: 50% à la commande, 50% à la livraison',
        'Délai de réalisation: selon disponibilité',
    ],
    'avecPaiement' => false,
    'avecCachet' => false,
    'annule' => in_array($devis->statut, ['refuse', 'expire'], true),
])
</body>
</html>
