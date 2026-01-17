@extends('emails.layout')

@section('content')
<!-- Header avec Logo -->
<tr>
    <td style="background: linear-gradient(135deg, {{ $numero_rappel >= 3 ? '#dc2626' : ($numero_rappel >= 2 ? '#ea580c' : '#f59e0b') }} 0%, {{ $numero_rappel >= 3 ? '#f87171' : ($numero_rappel >= 2 ? '#fb923c' : '#fbbf24') }} 100%); padding: 32px 40px; text-align: center;">
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
                <td style="background-color: {{ $numero_rappel >= 3 ? '#fee2e2' : ($numero_rappel >= 2 ? '#ffedd5' : '#fef3c7') }}; color: {{ $numero_rappel >= 3 ? '#991b1b' : ($numero_rappel >= 2 ? '#9a3412' : '#92400e') }}; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    @if($numero_rappel >= 3)
                    🚨 DERNIER RAPPEL
                    @elseif($numero_rappel >= 2)
                    ⚠️ RAPPEL URGENT
                    @else
                    📬 RAPPEL DE PAIEMENT
                    @endif
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
        
        <!-- Message selon le niveau de rappel -->
        @if($numero_rappel >= 3)
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            <strong style="color: #dc2626;">Ceci est notre dernier rappel.</strong> Malgré nos précédentes relances, nous n'avons toujours pas reçu le règlement de la facture ci-dessous. Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.
        </p>
        @elseif($numero_rappel >= 2)
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Malgré notre précédent rappel, nous n'avons pas encore reçu le règlement de la facture ci-dessous. Nous vous saurions gré de bien vouloir procéder au paiement dans les meilleurs délais.
        </p>
        @else
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Nous nous permettons de vous rappeler que la facture ci-dessous reste en attente de règlement. Sauf erreur ou omission de notre part, nous vous remercions de bien vouloir procéder au paiement.
        </p>
        @endif
        
        <!-- Récapitulatif Facture -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; overflow: hidden; border: 2px solid {{ $numero_rappel >= 3 ? '#fecaca' : ($numero_rappel >= 2 ? '#fed7aa' : '#fef08a') }};">
            <tr>
                <td style="padding: 24px;">
                    <p style="color: {{ $numero_rappel >= 3 ? '#dc2626' : ($numero_rappel >= 2 ? '#ea580c' : '#d97706') }}; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                        @if($numero_rappel >= 3)
                        🔴 Facture en retard critique
                        @elseif($numero_rappel >= 2)
                        🟠 Facture en retard
                        @else
                        🟡 Facture impayée
                        @endif
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Numéro de facture</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 700;">{{ $facture->numero }}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Date de facturation</span><br>
                                <span style="color: #1e3a5f; font-size: 16px; font-weight: 600;">{{ $facture->date_facture->format('d/m/Y') }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Date d'échéance</span><br>
                                <span style="color: #dc2626; font-size: 15px; font-weight: 700;">{{ $facture->date_echeance->format('d/m/Y') }}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px;">Retard</span><br>
                                <span style="background-color: {{ $numero_rappel >= 3 ? '#fee2e2' : ($numero_rappel >= 2 ? '#ffedd5' : '#fef3c7') }}; color: {{ $numero_rappel >= 3 ? '#991b1b' : ($numero_rappel >= 2 ? '#9a3412' : '#92400e') }}; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                                    {{ now()->diffInDays($facture->date_echeance) }} jours
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" align="center" style="padding: 20px 0 8px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Montant Dû</span><br>
                                <span style="color: #dc2626; font-size: 32px; font-weight: 700;">{{ number_format($facture->reste_a_payer, 0, ',', ' ') }} FCFA</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Avertissement pour niveau 3 -->
        @if($numero_rappel >= 3)
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Important :</strong> Sans règlement de votre part dans les 48 heures, nous serons contraints d'engager des procédures de recouvrement.
                    </p>
                </td>
            </tr>
        </table>
        @else
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;">
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                        💡 Si vous avez déjà effectué le paiement, veuillez ignorer ce message.
                    </p>
                </td>
            </tr>
        </table>
        @endif
        
        <!-- Message de contact -->
        <p style="color: #4a5568; font-size: 14px; line-height: 1.7; margin: 20px 0; text-align: center;">
            En cas de difficulté de paiement, n'hésitez pas à nous contacter pour trouver une solution ensemble.
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
                    <p style="color: #1e3a5f; font-size: 16px; font-weight: 600; margin: 0;">Le Service Comptabilité - LOGISTIGA</p>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection