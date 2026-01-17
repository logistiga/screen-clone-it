@extends('emails.layout')

@section('content')
<!-- Header avec Logo -->
<tr>
    <td style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 32px 40px; text-align: center;">
        @if(config('app.logo_url'))
        <img src="{{ config('app.logo_url') }}" alt="LOGISTIGA" width="160" style="max-width: 160px; height: auto; margin-bottom: 12px;" />
        @else
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">LOGISTIGA</h1>
        @endif
        <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0 0; letter-spacing: 0.5px;">
            SOLUTIONS LOGISTIQUES PROFESSIONNELLES
        </p>
    </td>
</tr>

<!-- Badge Type Document -->
<tr>
    <td align="center" style="padding: 24px 40px 0 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background-color: #cffafe; color: #0e7490; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    📝 NOTE DE DÉBUT - {{ strtoupper($note->type_label ?? 'OPÉRATION') }}
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
            Bonjour {{ $client->raison_sociale ?? $client->nom_complet ?? $client->nom ?? 'Cher client' }},
        </p>
        
        <!-- Message d'introduction -->
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Nous vous prions de trouver ci-joint votre note de début. Ce document récapitule les détails de l'opération et les montants associés.
        </p>
        
        <!-- Message personnalisé -->
        @if(!empty($message_personnalise))
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
                <td style="background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); border-left: 4px solid #06b6d4; padding: 16px 20px; border-radius: 0 12px 12px 0;">
                    <p style="color: #0e7490; margin: 0; font-size: 14px; line-height: 1.6;">
                        💬 {{ $message_personnalise }}
                    </p>
                </td>
            </tr>
        </table>
        @endif
        
        <!-- Récapitulatif Document -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
            <tr>
                <td style="padding: 24px;">
                    <p style="color: #1e3a5f; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                        📋 Détails de la note
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Numéro</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 700;">{{ $note->numero }}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Type</span><br>
                                <span style="color: #0891b2; font-size: 15px; font-weight: 600;">{{ $note->type_label ?? $note->type }}</span>
                            </td>
                        </tr>
                        @if($note->conteneur_numero)
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">N° Conteneur</span><br>
                                <span style="color: #374151; font-size: 15px; font-weight: 600; font-family: monospace;">{{ $note->conteneur_numero }}</span>
                            </td>
                            @if($note->bl_numero)
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">N° BL</span><br>
                                <span style="color: #374151; font-size: 15px;">{{ $note->bl_numero }}</span>
                            </td>
                            @else
                            <td></td>
                            @endif
                        </tr>
                        @endif
                        @if($note->date_debut && $note->date_fin)
                        <tr>
                            <td colspan="2" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Période</span><br>
                                <span style="color: #374151; font-size: 15px;">
                                    Du <strong>{{ \Carbon\Carbon::parse($note->date_debut)->format('d/m/Y') }}</strong> 
                                    au <strong>{{ \Carbon\Carbon::parse($note->date_fin)->format('d/m/Y') }}</strong>
                                    @if($note->nombre_jours)
                                    <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 8px; font-size: 12px; margin-left: 8px;">{{ $note->nombre_jours }} jours</span>
                                    @endif
                                </span>
                            </td>
                        </tr>
                        @endif
                        
                        @php
                            $montantTotal = $note->montant_total ?? $note->montant_ht ?? 0;
                            $montantPaye = $note->montant_paye ?? 0;
                            $montantAvance = $note->montant_avance ?? 0;
                            $reste = $montantTotal - $montantPaye - $montantAvance;
                        @endphp
                        
                        <tr>
                            <td colspan="2" align="center" style="padding: 20px 0 8px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Montant Total</span><br>
                                <span style="color: #0891b2; font-size: 32px; font-weight: 700;">{{ number_format($montantTotal, 0, ',', ' ') }} FCFA</span>
                            </td>
                        </tr>
                        
                        @if($montantPaye > 0 || $montantAvance > 0)
                        <tr>
                            <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Montant payé</span><br>
                                <span style="color: #059669; font-size: 15px; font-weight: 600;">{{ number_format($montantPaye + $montantAvance, 0, ',', ' ') }} FCFA</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Reste à payer</span><br>
                                <span style="color: {{ $reste > 0 ? '#dc2626' : '#059669' }}; font-size: 15px; font-weight: 700;">{{ number_format($reste, 0, ',', ' ') }} FCFA</span>
                            </td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Information paiement -->
        @if($reste > 0)
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        💳 Merci de procéder au règlement du montant restant.
                    </p>
                </td>
            </tr>
        </table>
        @else
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                        ✅ Cette note est entièrement réglée. Merci !
                    </p>
                </td>
            </tr>
        </table>
        @endif
        
        <!-- Note -->
        <p style="color: #718096; font-size: 13px; text-align: center; margin: 20px 0 0 0;">
            Le document est également disponible en pièce jointe de cet email.
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