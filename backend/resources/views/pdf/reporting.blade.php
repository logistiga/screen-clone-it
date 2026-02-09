<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reporting {{ $annee }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            padding: 15px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #dc2626;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .header-left {
            display: table-cell;
            width: 50%;
            vertical-align: middle;
        }
        .header-right {
            display: table-cell;
            width: 50%;
            vertical-align: middle;
            text-align: right;
        }
        .logo {
            font-size: 22px;
            font-weight: bold;
            color: #dc2626;
        }
        .logo-subtitle {
            font-size: 8px;
            color: #dc2626;
        }
        .doc-title {
            font-size: 16px;
            font-weight: bold;
            color: #dc2626;
        }
        .doc-meta {
            font-size: 10px;
            color: #555;
        }
        .doc-date {
            font-size: 9px;
            color: #999;
        }

        /* Section */
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #dc2626;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
            margin: 14px 0 6px;
        }

        /* KPI Grid */
        .kpi-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .kpi-table td {
            border: 1px solid #e5e7eb;
            padding: 5px 7px;
            background: #f9fafb;
            width: 25%;
        }
        .kpi-label {
            font-size: 7px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .kpi-value {
            font-size: 10px;
            font-weight: bold;
            color: #111;
            margin-top: 1px;
        }
        .kpi-danger { background: #fef2f2; border-color: #fecaca; }
        .kpi-danger .kpi-value { color: #dc2626; }
        .kpi-success .kpi-value { color: #15803d; }
        .kpi-warning { background: #fffbeb; border-color: #fde68a; }
        .kpi-warning .kpi-value { color: #b45309; }

        /* Tables */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 4px;
        }
        table.data-table th {
            background: #f3f4f6;
            font-weight: 600;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        table.data-table th,
        table.data-table td {
            border: 1px solid #d1d5db;
            padding: 3px 5px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-red { color: #dc2626; font-weight: 600; }
        .text-green { color: #15803d; }
        .row-alt { background: #f9fafb; }
        .row-total { background: #fef2f2; font-weight: bold; }

        /* Footer */
        .footer {
            margin-top: 20px;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            font-size: 8px;
            color: #6b7280;
            text-align: center;
        }
        .footer strong { color: #555; }
    </style>
</head>
<body>

    {{-- ========== HEADER ========== --}}
    <div class="header">
        <div class="header-left">
            <div class="logo">LOGISTIGA</div>
            <div class="logo-subtitle">TRANSPORT · STOCKAGE · MANUTENTION</div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT D'ACTIVITÉ</div>
            <div class="doc-meta">Année {{ $annee }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y') }}</div>
        </div>
    </div>

    {{-- ========== KPIs ========== --}}
    <div class="section-title">Indicateurs Clés de Performance</div>
    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Chiffre d'Affaires</div><div class="kpi-value">{{ number_format($kpis['ca_total'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">CA Mois Courant</div><div class="kpi-value">{{ number_format($kpis['ca_mois_courant'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-danger"><div class="kpi-label">Créances Totales</div><div class="kpi-value">{{ number_format($kpis['creances_totales'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-success"><div class="kpi-label">Taux Recouvrement</div><div class="kpi-value">{{ $kpis['taux_recouvrement'] ?? 0 }}%</div></td>
        </tr>
        <tr>
            <td><div class="kpi-label">Factures</div><div class="kpi-value">{{ $kpis['nb_factures'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Devis</div><div class="kpi-value">{{ $kpis['nb_devis'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Ordres de Travail</div><div class="kpi-value">{{ $kpis['nb_ordres'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Clients Actifs</div><div class="kpi-value">{{ $kpis['nb_clients'] ?? 0 }}</div></td>
        </tr>
    </table>

    {{-- ========== RENTABILITÉ ========== --}}
    @if(!empty($rentabilite))
    <div class="section-title">Rentabilité</div>
    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Chiffre d'Affaires</div><div class="kpi-value">{{ number_format($rentabilite['chiffre_affaires'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-warning"><div class="kpi-label">Charges d'Exploitation</div><div class="kpi-value">{{ number_format($rentabilite['charges_exploitation'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="{{ ($rentabilite['resultat_net'] ?? 0) >= 0 ? 'kpi-success' : 'kpi-danger' }}"><div class="kpi-label">Résultat Net</div><div class="kpi-value">{{ number_format($rentabilite['resultat_net'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">Taux de Marge</div><div class="kpi-value">{{ $rentabilite['taux_marge'] ?? 0 }}%</div></td>
        </tr>
    </table>
    @endif

    {{-- ========== ÉVOLUTION MENSUELLE ========== --}}
    @if(!empty($evolution))
    <div class="section-title">Évolution Mensuelle du Chiffre d'Affaires</div>
    @php
        $moisLabels = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        $totalCA = 0;
        $totalFactures = 0;
    @endphp
    <table class="data-table">
        <thead>
            <tr>
                <th style="text-align: left;">Mois</th>
                <th class="text-right">CA TTC</th>
                <th class="text-center">Nb Factures</th>
            </tr>
        </thead>
        <tbody>
            @foreach($evolution as $i => $m)
            @php
                $totalCA += $m['total_ttc'] ?? 0;
                $totalFactures += $m['nb_factures'] ?? 0;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $moisLabels[($m['mois'] ?? 1) - 1] ?? '' }}</td>
                <td class="text-right">{{ number_format($m['total_ttc'] ?? 0, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $m['nb_factures'] ?? 0 }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td>TOTAL</td>
                <td class="text-right text-red">{{ number_format($totalCA, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $totalFactures }}</td>
            </tr>
        </tbody>
    </table>
    @endif

    {{-- ========== TOP CLIENTS ========== --}}
    @if(!empty($topClients) && count($topClients) > 0)
    <div class="section-title">Top 10 Clients par Chiffre d'Affaires</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 20px;">#</th>
                <th style="text-align: left;">Client</th>
                <th class="text-right">CA Total</th>
                <th class="text-center">Factures</th>
                <th class="text-right">Paiements</th>
                <th class="text-right">Solde Dû</th>
            </tr>
        </thead>
        <tbody>
            @php
                $totalCaClients = 0;
                $totalFacturesClients = 0;
                $totalPaiementsClients = 0;
                $totalSoldeClients = 0;
            @endphp
            @foreach(collect($topClients)->slice(0, 10)->values() as $i => $c)
            @php
                $totalCaClients += $c['ca_total'] ?? 0;
                $totalFacturesClients += $c['nb_factures'] ?? 0;
                $totalPaiementsClients += $c['paiements'] ?? 0;
                $totalSoldeClients += $c['solde_du'] ?? 0;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $c['client_nom'] ?? 'Inconnu' }}</td>
                <td class="text-right">{{ number_format($c['ca_total'] ?? 0, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $c['nb_factures'] ?? 0 }}</td>
                <td class="text-right text-green">{{ number_format($c['paiements'] ?? 0, 0, ',', ' ') }} FCFA</td>
                <td class="text-right {{ ($c['solde_du'] ?? 0) > 0 ? 'text-red' : '' }}">{{ number_format($c['solde_du'] ?? 0, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="2">TOTAL</td>
                <td class="text-right text-red">{{ number_format($totalCaClients, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $totalFacturesClients }}</td>
                <td class="text-right text-green">{{ number_format($totalPaiementsClients, 0, ',', ' ') }} FCFA</td>
                <td class="text-right {{ $totalSoldeClients > 0 ? 'text-red' : '' }}">{{ number_format($totalSoldeClients, 0, ',', ' ') }} FCFA</td>
            </tr>
        </tbody>
    </table>
    @endif

    {{-- ========== CRÉANCES ========== --}}
    @if(!empty($creances))
    <div class="section-title">Créances — Top Débiteurs</div>
    <table class="kpi-table" style="margin-bottom: 5px;">
        <tr>
            <td class="kpi-danger"><div class="kpi-label">Total Créances</div><div class="kpi-value">{{ number_format($creances['total_creances'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">Factures Impayées</div><div class="kpi-value">{{ $creances['nb_factures_impayees'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Âge Moyen</div><div class="kpi-value">{{ $creances['age_moyen'] ?? 0 }} jours</div></td>
            <td></td>
        </tr>
    </table>

    @if(!empty($creances['top_debiteurs']))
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 20px;">#</th>
                <th style="text-align: left;">Client</th>
                <th class="text-right">Montant Dû</th>
                <th class="text-center">Factures</th>
            </tr>
        </thead>
        <tbody>
            @foreach(collect($creances['top_debiteurs'])->slice(0, 10)->values() as $i => $d)
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $d['client_nom'] ?? 'Inconnu' }}</td>
                <td class="text-right text-red">{{ number_format($d['montant_du'] ?? 0, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $d['nb_factures'] ?? 0 }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
    @endif

    {{-- ========== FOOTER ========== --}}
    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>

</body>
</html>
