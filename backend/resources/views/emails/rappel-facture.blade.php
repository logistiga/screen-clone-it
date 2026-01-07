@extends('emails.layout')

@section('content')
<div class="email-header" style="background: linear-gradient(135deg, #dc2626 0%, #f87171 100%);">
    <h1>⚠️ Rappel de Paiement</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour <strong>{{ $client->raison_sociale ?? $client->nom_complet }}</strong>,</p>
        
        @if($numero_rappel == 1)
        <p>Nous nous permettons de vous rappeler que la facture ci-dessous reste impayée.</p>
        @elseif($numero_rappel == 2)
        <p>Malgré notre précédent rappel, nous n'avons pas encore reçu le règlement de la facture ci-dessous.</p>
        @else
        <p><strong>DERNIER RAPPEL</strong> - Malgré nos précédentes relances, la facture ci-dessous reste impayée.</p>
        @endif
    </div>

    <div class="highlight-box" style="border-left-color: #dc2626;">
        <h3 style="color: #dc2626;">
            @if($niveau_urgence == 'urgent' || $niveau_urgence == 'critique')
            🔴 Facture en retard
            @else
            Facture impayée
            @endif
        </h3>
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
                <td style="color: #dc2626; font-weight: bold;">{{ $facture->date_echeance->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td>Retard</td>
                <td>
                    <span class="badge badge-danger">
                        {{ now()->diffInDays($facture->date_echeance) }} jours
                    </span>
                </td>
            </tr>
            <tr>
                <td>Montant dû</td>
                <td class="amount" style="color: #dc2626;">{{ number_format($facture->reste_a_payer, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>

    <div class="email-content">
        @if($numero_rappel >= 3)
        <p><strong>Important :</strong> Sans règlement de votre part dans les plus brefs délais, nous serons contraints d'engager des procédures de recouvrement.</p>
        @else
        <p>Merci de procéder au règlement dans les meilleurs délais ou de nous contacter en cas de difficulté.</p>
        @endif
        
        <p>Si vous avez déjà effectué le paiement, veuillez ignorer ce message.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
