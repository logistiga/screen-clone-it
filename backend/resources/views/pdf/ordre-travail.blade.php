<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Ordre de travail {{ $ordre->numero }}</title></head>
<body>
@include('pdf.partials.document-officiel', [
    'doc' => $ordre,
    'client' => $client ?? $ordre->client,
    'titre' => 'ORDRE DE TRAVAIL',
    'date1' => $ordre->date_creation ?? $ordre->created_at,
    'label2' => null,
    'date2' => null,
    'clientTitre' => 'CLIENT',
    'tableau' => \App\Support\DocumentPdfLignes::build($ordre),
    'libelleLigne' => 'Prestation',
    'libelleMontant' => 'Montant',
    'conditions' => ['Paiement à réception. En cas de retard, des pénalités seront appliquées conformément à la réglementation en vigueur.'],
    'avecPaiement' => true,
    'avecCachet' => true,
    'annule' => strtolower((string) $ordre->statut) === 'annule',
])
</body>
</html>
