<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>@page { margin: 10mm 10mm 30mm 10mm; }</style><title>Facture {{ $facture->numero }}</title></head>
<body>
@php
    $ordreLie = $facture->relationLoaded('ordreTravail') ? $facture->ordreTravail : ($facture->ordreTravail ?? null);
@endphp
@include('pdf.partials.document-officiel', [
    'doc' => $facture,
    'client' => $client ?? $facture->client,
    'titre' => 'FACTURE',
    'date1' => $facture->date_facture ?? $facture->date_creation ?? $facture->created_at,
    'label2' => 'Échéance',
    'date2' => $facture->date_echeance,
    'clientTitre' => 'FACTURER À',
    'tableau' => \App\Support\DocumentPdfLignes::build($facture, collect($ordreLie?->lots ?? [])),
    'libelleLigne' => 'Prestation',
    'libelleMontant' => 'Montant',
    'conditions' => ['Paiement à réception de facture. En cas de retard, des pénalités de retard seront appliquées conformément à la réglementation en vigueur.'],
    'avecPaiement' => true,
    'avecCachet' => false,
    'annule' => \App\Support\FactureStatut::estAnnulee($facture->statut ?? null),
])
</body>
</html>
