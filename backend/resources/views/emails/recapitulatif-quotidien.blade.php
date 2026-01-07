@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>📊 Récapitulatif Quotidien</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour,</p>
        
        <p>Voici le récapitulatif de l'activité du <strong>{{ $date }}</strong>.</p>
    </div>

    <div class="highlight-box">
        <h3>Activité du jour</h3>
        <table class="info-table">
            <tr>
                <td>📄 Factures créées</td>
                <td><strong>{{ $stats['factures_creees'] }}</strong></td>
            </tr>
            <tr>
                <td>✅ Factures payées</td>
                <td><strong>{{ $stats['factures_payees'] }}</strong></td>
            </tr>
            <tr>
                <td>📝 Devis créés</td>
                <td><strong>{{ $stats['devis_crees'] }}</strong></td>
            </tr>
            <tr>
                <td>🔧 Ordres créés</td>
                <td><strong>{{ $stats['ordres_crees'] }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="highlight-box" style="border-left-color: #10b981;">
        <h3 style="color: #065f46;">💰 Encaissements</h3>
        <p class="amount" style="color: #065f46; font-size: 28px;">
            {{ number_format($stats['montant_encaisse'], 0, ',', ' ') }} FCFA
        </p>
        <p style="color: #666; font-size: 14px;">Montant total encaissé aujourd'hui</p>
    </div>

    @if($stats['factures_en_retard'] > 0)
    <div class="highlight-box" style="border-left-color: #dc2626;">
        <h3 style="color: #dc2626;">⚠️ Alertes</h3>
        <table class="info-table">
            <tr>
                <td>Factures en retard</td>
                <td>
                    <span class="badge badge-danger">{{ $stats['factures_en_retard'] }}</span>
                </td>
            </tr>
            <tr>
                <td>Total créances</td>
                <td style="color: #dc2626; font-weight: bold;">
                    {{ number_format($stats['total_creances'], 0, ',', ' ') }} FCFA
                </td>
            </tr>
        </table>
    </div>
    @endif

    <div class="email-content">
        <p>Connectez-vous à LOJISTIGA pour plus de détails.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>Système LOJISTIGA</strong></p>
        <p><em>Message automatique</em></p>
    </div>
</div>
@endsection
