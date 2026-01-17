@extends('emails.layout')

@section('content')
@php
  $client = $client ?? $facture->client ?? null;
@endphp

<!-- Header avec Logo -->
<tr>
    <td style="background: linear-gradient(135deg, #059669 0%, #34d399 100%); padding: 32px 40px; text-align: center;">
        @include('emails.partials.logo')
    </td>
</tr>

<!-- Badge Type Document -->
<tr>
    <td align="center" style="padding: 24px 40px 0 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background-color: #dcfce7; color: #166534; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    ✅ CONFIRMATION DE PAIEMENT
                </td>
            </tr>
        </table>
    </td>
</tr>

<!-- Contenu Principal -->
<tr>
    <td style="padding: 32px 40px;">
        <!-- Salutation -->
        <p style="color: #1e3a5f; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
            Bonjour {{ $client->raison_sociale ?? $client->nom_complet ?? 'Cher client' }},
        </p>
        
        <!-- Message de remerciement -->
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Nous accusons bonne réception de votre paiement et vous en remercions. Votre confiance nous honore.
        </p>
        
        <!-- Icône de succès -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
                <td align="center">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 50%; display: inline-block; line-height: 80px; font-size: 40px;">
                        ✓
                    </div>
                </td>
            </tr>
        </table>
        
        <!-- Récapitulatif Paiement -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
            <tr>
                <td style="padding: 24px;">
                    <p style="color: #1e3a5f; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                        💳 Détails du paiement
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Référence</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 700;">{{ $paiement->reference ?? 'N/A' }}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Date de paiement</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 600;">{{ $paiement->date_paiement->format('d/m/Y') }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Facture concernée</span><br>
                                <span style="color: #374151; font-size: 15px; font-weight: 600;">{{ $facture->numero }}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Mode de paiement</span><br>
                                <span style="color: #374151; font-size: 15px;">
                                    @switch($paiement->mode_paiement)
                                        @case('especes')
                                            💵 Espèces
                                            @break
                                        @case('cheque')
                                            📝 Chèque
                                            @break
                                        @case('virement')
                                            🏦 Virement bancaire
                                            @break
                                        @case('carte')
                                            💳 Carte bancaire
                                            @break
                                        @case('mobile')
                                            📱 Mobile Money
                                            @break
                                        @default
                                            {{ $paiement->mode_paiement }}
                                    @endswitch
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" align="center" style="padding: 20px 0 8px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Montant Payé</span><br>
                                <span style="color: #059669; font-size: 32px; font-weight: 700;">{{ number_format($paiement->montant, 0, ',', ' ') }} FCFA</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Solde restant ou facture soldée -->
        @if($facture->reste_a_payer > 0)
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        ⏳ <strong>Solde restant sur cette facture :</strong> {{ number_format($facture->reste_a_payer, 0, ',', ' ') }} FCFA
                    </p>
                </td>
            </tr>
        </table>
        @else
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                        🎉 <strong>Facture entièrement soldée !</strong> Merci pour votre confiance.
                    </p>
                </td>
            </tr>
        </table>
        @endif
        
        <!-- Bouton Télécharger Reçu -->
        @include('emails.partials.download-button', [
            'type' => 'facture',
            'label' => 'Télécharger le Reçu de Paiement',
            'download_url' => $download_url ?? route('paiements.recu', $paiement->id)
        ])
    </td>
</tr>

<!-- Signature -->
<tr>
    <td style="padding: 0 40px 32px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <tr>
                <td>
                    <p style="color: #4a5568; font-size: 15px; margin: 0 0 4px 0;">Cordialement,</p>
                    <p style="color: #1e3a5f; font-size: 16px; font-weight: 600; margin: 0;">L'équipe LOGISTIGA</p>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection