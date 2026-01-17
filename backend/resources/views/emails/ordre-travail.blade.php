@extends('emails.layout')

@section('content')
@php
  $client = $client ?? $ordre->client ?? null;
@endphp

<!-- Header avec Logo -->
<tr>
    <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 40px; text-align: center;">
        @include('emails.partials.logo')
    </td>
</tr>

<!-- Badge Type Document -->
<tr>
    <td align="center" style="padding: 24px 40px 0 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background-color: #f3e8ff; color: #7c3aed; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    📦 ORDRE DE TRAVAIL
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
                <td style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left: 4px solid #a855f7; padding: 16px 20px; border-radius: 0 12px 12px 0;">
                    <p style="color: #6b21a8; margin: 0; font-size: 15px; line-height: 1.6;">
                        {{ $message_personnalise }}
                    </p>
                </td>
            </tr>
        </table>
        @else
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Votre ordre de travail a été créé. Notre équipe s'engage à vous fournir un service de qualité dans les meilleurs délais.
        </p>
        @endif
        
        <!-- Récapitulatif Document -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
            <tr>
                <td style="padding: 24px;">
                    <p style="color: #1e3a5f; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                        📋 Détails de l'ordre de travail
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Numéro</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 700;">{{ $ordre->numero }}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Date de création</span><br>
                                @php
                                  $dateCreationOrdre = '-';
                                  if (!empty($ordre->date_creation) && (
                                        $ordre->date_creation instanceof \DateTimeInterface
                                        || (is_string($ordre->date_creation) && strtotime($ordre->date_creation))
                                      )) {
                                    $dateCreationOrdre = \Carbon\Carbon::parse($ordre->date_creation)->format('d/m/Y');
                                  } elseif (!empty($ordre->created_at)) {
                                    $dateCreationOrdre = \Carbon\Carbon::parse($ordre->created_at)->format('d/m/Y');
                                  }
                                @endphp
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 600;">{{ $dateCreationOrdre }}</span>
                            </td>
                        </tr>
                        @if($ordre->conteneurs && $ordre->conteneurs->count() > 0)
                        <tr>
                            <td colspan="2" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Conteneur(s)</span><br>
                                <span style="color: #374151; font-size: 15px; font-weight: 600; font-family: monospace;">{{ $ordre->conteneurs->pluck('numero')->join(', ') }}</span>
                            </td>
                        </tr>
                        @endif
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Statut</span><br>
                                @switch($ordre->statut)
                                    @case('en_attente')
                                        <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">⏳ En attente</span>
                                        @break
                                    @case('en_cours')
                                        <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🔄 En cours</span>
                                        @break
                                    @case('termine')
                                        <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">✅ Terminé</span>
                                        @break
                                    @default
                                        <span style="background-color: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">{{ $ordre->statut }}</span>
                                @endswitch
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Montant HT</span><br>
                                <span style="color: #374151; font-size: 15px; font-weight: 600;">{{ number_format((float)($ordre->montant_ht ?? 0), 0, ',', ' ') }} FCFA</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" align="center" style="padding: 20px 0 8px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Montant Total TTC</span><br>
                                <span style="color: #7c3aed; font-size: 32px; font-weight: 700;">{{ number_format((float)($ordre->montant_ttc ?? 0), 0, ',', ' ') }} FCFA</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Information suivi -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                        📍 Nous vous tiendrons informé de l'avancement des travaux.
                    </p>
                </td>
            </tr>
        </table>
        
        <!-- Bouton Télécharger PDF -->
        @include('emails.partials.download-button', [
            'type' => 'ordre',
            'label' => 'Télécharger l\'Ordre de Travail PDF',
            // IMPORTANT: éviter route('ordres.pdf') (route non définie) -> provoque une erreur 500
            'download_url' => $download_url ?? url("/ordres/{$ordre->id}/pdf")
        ])
        
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