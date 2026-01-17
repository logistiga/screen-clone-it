@extends('emails.layout')

@section('content')
@php
  use Illuminate\Support\Facades\Route;

  $client = $client ?? $devis->client ?? null;

  // Évite une erreur 500 si la route backend n'existe pas en production.
  // Le PDF est de toute façon joint à l'email.
  $download_url = $download_url
    ?? (Route::has('devis.pdf') ? route('devis.pdf', $devis->id) : null);
@endphp

<!-- Header avec Logo -->
<tr>
    <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 40px; text-align: center;">
        @include('emails.partials.logo')
    </td>
</tr>

<!-- Badge Type Document -->
<tr>
    <td align="center" style="padding: 24px 40px 0 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background-color: #dbeafe; color: #1e40af; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    📄 DEVIS
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
            Bonjour {{ optional($client)->raison_sociale ?? optional($client)->nom_complet ?? 'Cher client' }},
        </p>
        
        <!-- Message unique (personnalisé OU par défaut) -->
        @if(!empty($message_personnalise))
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
                <td style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 0 12px 12px 0;">
                    <p style="color: #1e40af; margin: 0; font-size: 15px; line-height: 1.6;">
                        {{ $message_personnalise }}
                    </p>
                </td>
            </tr>
        </table>
        @else
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Suite à votre demande, nous avons le plaisir de vous transmettre notre proposition commerciale. Nous restons à votre disposition pour toute information complémentaire.
        </p>
        @endif
        
        <!-- Récapitulatif Document -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
            <tr>
                <td style="padding: 24px;">
                    <p style="color: #1e3a5f; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                        📋 Récapitulatif du devis
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Numéro</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 700;">{{ $devis->numero }}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Date du devis</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 600;">
                                    @if(!empty($devis->date_creation))
                                        {{ \Carbon\Carbon::parse($devis->date_creation)->format('d/m/Y') }}
                                    @else
                                        {{ now()->format('d/m/Y') }}
                                    @endif
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Montant HT</span><br>
                                <span style="color: #374151; font-size: 15px; font-weight: 600;">{{ number_format((float) ($devis->montant_ht ?? 0), 0, ',', ' ') }} FCFA</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                @if(!empty($devis->remise_montant) && (float)$devis->remise_montant > 0)
                                <span style="color: #718096; font-size: 13px;">Remise</span><br>
                                <span style="color: #059669; font-size: 15px; font-weight: 600;">- {{ number_format((float) $devis->remise_montant, 0, ',', ' ') }} FCFA</span>
                                @else
                                <span style="color: #718096; font-size: 13px;">TVA (18%)</span><br>
                                <span style="color: #374151; font-size: 15px;">{{ number_format((float) ($devis->tva ?? $devis->montant_tva ?? 0), 0, ',', ' ') }} FCFA</span>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" align="center" style="padding: 20px 0 8px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Montant Total TTC</span><br>
                                <span style="color: #1e40af; font-size: 32px; font-weight: 700;">{{ number_format((float) ($devis->montant_ttc ?? 0), 0, ',', ' ') }} FCFA</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Date de validité -->
        @if(!empty($devis->date_validite))
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        ⏰ <strong>Devis valable jusqu'au :</strong> {{ \Carbon\Carbon::parse($devis->date_validite)->format('d/m/Y') }}
                    </p>
                </td>
            </tr>
        </table>
        @endif
        
        <!-- Bouton Télécharger PDF -->
        @if(!empty($download_url))
        @include('emails.partials.download-button', [
            'type' => 'devis',
            'label' => 'Télécharger le Devis PDF',
            'download_url' => $download_url
        ])
        @endif
        
        <!-- Note -->
        <p style="color: #718096; font-size: 13px; text-align: center; margin: 0;">
            📎 Le document est également disponible en pièce jointe de cet email.
        </p>
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