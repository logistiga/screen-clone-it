<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Mouvements Caisse</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">MOUVEMENTS DE CAISSE</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Mouvements</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td class="kpi-success"><div class="kpi-label">Total Entrées</div><div class="kpi-value">{{ number_format($stats['total_entrees'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-danger"><div class="kpi-label">Total Sorties</div><div class="kpi-value">{{ number_format($stats['total_sorties'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">Solde</div><div class="kpi-value">{{ number_format(($stats['total_entrees'] ?? 0) - ($stats['total_sorties'] ?? 0), 0, ',', ' ') }} FCFA</div></td>
        </tr>
    </table>

    <div class="section-title">Détail des Mouvements ({{ count($mouvements) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th class="text-right">Entrée</th>
                <th class="text-right">Sortie</th>
                <th class="text-right">Solde</th>
            </tr>
        </thead>
        <tbody>
            @php $solde = 0; $totEntrees = 0; $totSorties = 0; @endphp
            @foreach($mouvements as $i => $m)
            @php
                $entree = $m->type === 'entree' ? $m->montant : 0;
                $sortie = $m->type === 'sortie' ? $m->montant : 0;
                $solde += ($entree - $sortie);
                $totEntrees += $entree; $totSorties += $sortie;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $m->date ? $m->date->format('d/m/Y') : '-' }}</td>
                <td>{{ $m->type === 'entree' ? 'Entrée' : 'Sortie' }}</td>
                <td>{{ $m->categorie ?? '-' }}</td>
                <td>{{ \Illuminate\Support\Str::limit($m->description ?? '-', 40) }}</td>
                <td class="text-right text-green">{{ $entree > 0 ? number_format($entree, 0, ',', ' ') : '' }}</td>
                <td class="text-right text-red">{{ $sortie > 0 ? number_format($sortie, 0, ',', ' ') : '' }}</td>
                <td class="text-right">{{ number_format($solde, 0, ',', ' ') }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="5">TOTAUX</td>
                <td class="text-right text-green">{{ number_format($totEntrees, 0, ',', ' ') }} FCFA</td>
                <td class="text-right text-red">{{ number_format($totSorties, 0, ',', ' ') }} FCFA</td>
                <td class="text-right">{{ number_format($totEntrees - $totSorties, 0, ',', ' ') }} FCFA</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 20px; border: 2px solid #333; border-radius: 4px; padding: 12px 20px; display: inline-block; float: right;">
        <table style="border-collapse: collapse;">
            <tr>
                <td style="font-size: 13px; font-weight: bold; padding-right: 30px; color: #333;">SOLDE PÉRIODE :</td>
                <td style="font-size: 15px; font-weight: bold; color: {{ ($totEntrees - $totSorties) >= 0 ? '#16a34a' : '#dc2626' }};">
                    {{ number_format($totEntrees - $totSorties, 0, ',', ' ') }} FCFA
                </td>
            </tr>
            @if(isset($solde_actuel_caisse))
            <tr>
                <td style="font-size: 13px; font-weight: bold; padding-right: 30px; padding-top: 8px; color: #1e40af;">SOLDE ACTUEL CAISSE :</td>
                <td style="font-size: 15px; font-weight: bold; padding-top: 8px; color: {{ $solde_actuel_caisse >= 0 ? '#16a34a' : '#dc2626' }};">
                    {{ number_format($solde_actuel_caisse, 0, ',', ' ') }} FCFA
                </td>
            </tr>
            @endif
        </table>
    </div>
    <div style="clear: both;"></div>

    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
