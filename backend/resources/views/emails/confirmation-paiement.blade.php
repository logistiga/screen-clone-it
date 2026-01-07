@extends('emails.layout')

@section('content')
<div class="email-header" style="background: linear-gradient(135deg, #065f46 0%, #10b981 100%);">
    <h1>✓ Confirmation de Paiement</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour <strong>{{ $client->raison_sociale ?? $client->nom_complet }}</strong>,</p>
        
        <p>Nous accusons réception de votre paiement. Merci pour votre confiance !</p>
    </div>

    <div class="highlight-box" style="border-left-color: #10b981;">
        <h3 style="color: #065f46;">Détails du paiement</h3>
        <table class="info-table">
            <tr>
                <td>Référence</td>
                <td><strong>{{ $paiement->reference ?? 'N/A' }}</strong></td>
            </tr>
            <tr>
                <td>Facture concernée</td>
                <td>{{ $facture->numero }}</td>
            </tr>
            <tr>
                <td>Date de paiement</td>
                <td>{{ $paiement->date_paiement->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td>Mode de paiement</td>
                <td>
                    @switch($paiement->mode_paiement)
                        @case('especes')
                            Espèces
                            @break
                        @case('cheque')
                            Chèque
                            @break
                        @case('virement')
                            Virement bancaire
                            @break
                        @case('carte')
                            Carte bancaire
                            @break
                        @case('mobile')
                            Mobile Money
                            @break
                        @default
                            {{ $paiement->mode_paiement }}
                    @endswitch
                </td>
            </tr>
            <tr>
                <td>Montant payé</td>
                <td class="amount" style="color: #065f46;">{{ number_format($paiement->montant, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>

    @if($facture->reste_a_payer > 0)
    <div class="highlight-box" style="border-left-color: #f59e0b;">
        <h3 style="color: #92400e;">Solde restant</h3>
        <p>Il reste un solde de <strong>{{ number_format($facture->reste_a_payer, 0, ',', ' ') }} FCFA</strong> à régler sur cette facture.</p>
    </div>
    @else
    <div class="email-content">
        <p><span class="badge badge-success">Facture soldée</span></p>
        <p>Cette facture est maintenant entièrement réglée.</p>
    </div>
    @endif

    <div class="email-content">
        <p>Merci de votre confiance.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
