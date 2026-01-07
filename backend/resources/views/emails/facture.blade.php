@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>Facture</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour <strong>{{ $client->raison_sociale ?? $client->nom_complet }}</strong>,</p>
        
        <p>Veuillez trouver ci-joint la facture n°<strong>{{ $facture->numero }}</strong>.</p>
        
        @if($message_personnalise)
        <div class="highlight-box">
            <p>{{ $message_personnalise }}</p>
        </div>
        @endif
    </div>

    <div class="highlight-box">
        <h3>Détails de la facture</h3>
        <table class="info-table">
            <tr>
                <td>Numéro de facture</td>
                <td><strong>{{ $facture->numero }}</strong></td>
            </tr>
            <tr>
                <td>Date de facturation</td>
                <td>{{ $facture->date_facture->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td>Date d'échéance</td>
                <td>{{ $facture->date_echeance->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td>Montant HT</td>
                <td>{{ number_format($facture->montant_ht, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <td>TVA</td>
                <td>{{ number_format($facture->montant_tva, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <td>Montant TTC</td>
                <td class="amount">{{ number_format($facture->montant_ttc, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>

    <div class="email-content">
        <p>Merci de procéder au règlement avant la date d'échéance indiquée.</p>
        <p>N'hésitez pas à nous contacter pour toute question.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
