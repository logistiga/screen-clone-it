@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>Devis</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour <strong>{{ $client->raison_sociale ?? $client->nom_complet }}</strong>,</p>
        
        <p>Veuillez trouver ci-joint le devis n°<strong>{{ $devis->numero }}</strong> que vous avez demandé.</p>
        
        @if($message_personnalise)
        <div class="highlight-box">
            <p>{{ $message_personnalise }}</p>
        </div>
        @endif
    </div>

    <div class="highlight-box">
        <h3>Détails du devis</h3>
        <table class="info-table">
            <tr>
                <td>Numéro du devis</td>
                <td><strong>{{ $devis->numero }}</strong></td>
            </tr>
            <tr>
                <td>Date du devis</td>
                <td>{{ $devis->date_devis ? $devis->date_devis->format('d/m/Y') : 'Non spécifiée' }}</td>
            </tr>
            <tr>
                <td>Validité</td>
                <td>
                    @if($devis->date_validite)
                        Jusqu'au {{ $devis->date_validite->format('d/m/Y') }}
                    @else
                        Non spécifiée
                    @endif
                </td>
            </tr>
            <tr>
                <td>Montant HT</td>
                <td>{{ number_format($devis->montant_ht, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <td>TVA</td>
                <td>{{ number_format($devis->montant_tva, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <td>Montant TTC</td>
                <td class="amount">{{ number_format($devis->montant_ttc, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>

    <div class="email-content">
        @if($devis->date_validite)
        <p><span class="badge badge-warning">Important</span> Ce devis est valable jusqu'au <strong>{{ $devis->date_validite->format('d/m/Y') }}</strong>.</p>
        @endif
        
        <p>N'hésitez pas à nous contacter pour toute question ou pour valider ce devis.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
