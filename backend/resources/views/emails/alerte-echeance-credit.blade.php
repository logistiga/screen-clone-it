@extends('emails.layout')

@section('content')
<div class="email-header" style="background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%);">
    <h1>⚠️ Échéance de Crédit</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour,</p>
        
        <p>Ceci est un rappel automatique concernant une échéance de crédit à venir.</p>
    </div>

    <div class="highlight-box" style="border-left-color: #ea580c;">
        <h3 style="color: #ea580c;">
            @if($jours_restants <= 7)
            🔴 Échéance imminente
            @else
            ⚠️ Échéance à venir
            @endif
        </h3>
        <table class="info-table">
            <tr>
                <td>Référence du crédit</td>
                <td><strong>{{ $credit->reference }}</strong></td>
            </tr>
            <tr>
                <td>Banque</td>
                <td>{{ $credit->banque->nom ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td>Montant du crédit</td>
                <td>{{ number_format($credit->montant, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <td>Échéance dans</td>
                <td>
                    <span class="badge {{ $jours_restants <= 7 ? 'badge-danger' : 'badge-warning' }}">
                        {{ $jours_restants }} jour(s)
                    </span>
                </td>
            </tr>
            @if($credit->prochaine_echeance)
            <tr>
                <td>Montant échéance</td>
                <td class="amount" style="color: #ea580c;">{{ number_format($credit->prochaine_echeance->montant, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
        </table>
    </div>

    <div class="email-content">
        <p>Veuillez vous assurer que les fonds nécessaires sont disponibles pour honorer cette échéance.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>Système LOJISTIGA</strong></p>
        <p><em>Message automatique</em></p>
    </div>
</div>
@endsection
