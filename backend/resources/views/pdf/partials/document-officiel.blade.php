{{-- Modèle officiel unique Devis / OT / Facture — identique aux PDF de l'application --}}
@php
    $fmt = fn ($v) => number_format(round((float) $v), 0, ',', ' ') . ' FCFA';
    $fmtQ = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, ',', ' '), '0'), ',');
    $fd = fn ($d) => $d ? \Carbon\Carbon::parse($d)->format('d/m/Y') : '-';
    $cat = \App\Support\DocumentCategory::normalize($doc->categorie ?? null);
    $catLabel = $tableau['type'] === 'conteneurs' ? 'Conteneurs' : ($tableau['type'] === 'lots' ? 'Conventionnel' : 'Opérations Indépendantes');
    $bl = $doc->numero_bl ?? $doc->bl_numero ?? null;
    $ht = (float) ($doc->montant_ht ?? 0);
    $tva = (float) ($doc->montant_tva ?? $doc->tva ?? 0);
    $css = (float) ($doc->montant_css ?? $doc->css ?? 0);
    $ttc = (float) ($doc->montant_ttc ?? 0);
    $paye = (float) ($doc->montant_paye ?? 0);
    $remise = (float) ($doc->remise_montant ?? 0);
    $taxesSel = is_array($doc->taxes_selection ?? null) ? $doc->taxes_selection : (json_decode((string) ($doc->taxes_selection ?? ''), true) ?: []);
    $motifExo = $doc->motif_exoneration ?? ($taxesSel['motif_exoneration'] ?? null);
    $exoTva = $ht > 0 && $tva == 0.0;
    $exoCss = $ht > 0 && $css == 0.0;
    $typeOp = $doc->type_operation ?? null;
    $sens = $tableau['type'] === 'conteneurs' && $typeOp ? (stripos($typeOp, 'import') !== false ? 'IMPORT' : (stripos($typeOp, 'export') !== false ? 'EXPORT' : null)) : null;
@endphp
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 9px; color: #1f2937; line-height: 1.35; }
    .p { color: #dc2626; }
    .muted { color: #6b7280; }
    table { border-collapse: collapse; }
    .head { width: 100%; border-bottom: 2px solid #dc2626; margin-bottom: 10px; }
    .head td { vertical-align: top; padding-bottom: 8px; }
    .titre { font-size: 18px; font-weight: bold; color: #dc2626; }
    .meta { width: 100%; margin-bottom: 10px; font-size: 9px; }
    .box { border: 1px solid #e5e7eb; border-radius: 4px; padding: 7px; vertical-align: top; }
    .box h3 { font-size: 9px; color: #dc2626; margin-bottom: 3px; }
    .items { width: 100%; border: 1px solid #e5e7eb; margin-bottom: 10px; }
    .items th { background: #dc2626; color: #fff; font-weight: bold; padding: 5px; text-align: left; border-right: 1px solid #ef4444; }
    .items td { padding: 4px 5px; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    .alt td { background: #f9fafb; }
    .op td { background: #fcfcfd; color: #6b7280; }
    .r { text-align: right; white-space: nowrap; }
    .c { text-align: center; }
    .b { font-weight: bold; }
    .recap { width: 100%; border: 2px solid #dc2626; }
    .recap td { padding: 4px 8px; border-bottom: 1px solid #e5e7eb; }
    .recap .h td { background: #fef2f2; color: #dc2626; font-weight: bold; text-transform: uppercase; font-size: 8.5px; }
    .recap .ttc td { background: #dc2626; color: #fff; font-weight: bold; padding: 6px 8px; }
    .footer { position: fixed; bottom: -22mm; height: 18mm; left: 0; right: 0; border-top: 1px solid #e5e7eb; padding-top: 5px; text-align: center; font-size: 7.5px; color: #6b7280; }
    .footer .s { font-weight: bold; color: #1f2937; font-size: 8px; }
    .watermark { position: fixed; top: 110mm; left: 30mm; font-size: 70px; color: rgba(220,38,38,0.15); transform: rotate(-30deg); border: 5px solid rgba(220,38,38,0.15); padding: 8px 24px; font-weight: bold; }
</style>

<div class="footer">
    <p class="s">LOGISTIGA SAS au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
    <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
    <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    <p style="border-top: 1px dashed #e5e7eb; margin-top: 2px; padding-top: 2px;">BGFI N°: 40003 04140 41041658011 78 | UGB N°: 40002 00043 90000338691 84</p>
</div>

@if(!empty($annule))<div class="watermark">ANNULÉ</div>@endif

<table class="head"><tr>
    <td style="width:33%"><img src="{{ public_path('images/logistiga-logo.png') }}" style="height:60px"></td>
    <td style="width:34%; text-align:center">
        <div class="titre">{{ $titre }}</div>
        <div class="b" style="font-size:11px">{{ $doc->numero }}</div>
        @if($sens)<div class="p" style="font-size:9px; margin-top:2px">{{ $sens }}</div>@endif
    </td>
    <td style="width:33%"></td>
</tr></table>

<table class="meta"><tr>
    <td><b>Date:</b> {{ $fd($date1) }}<br>@if($label2)<b>{{ $label2 }}:</b> {{ $fd($date2) }}@endif</td>
    <td style="text-align:right"><b>Catégorie:</b> {{ $catLabel }}@if($typeOp)<br><b>Type:</b> {{ $typeOp }}@endif</td>
</tr></table>

<table style="width:100%; margin-bottom:10px"><tr>
    <td class="box" style="width:49%">
        <h3>{{ $clientTitre }}</h3>
        <div class="b" style="font-size:10.5px">{{ $client->nom ?? '-' }}</div>
        <div class="muted">{{ $client->adresse ?? '' }} - {{ $client->ville ?? '' }}, Gabon</div>
        <div class="muted">Tél: {{ $client->telephone ?? '' }}</div>
        @if(!empty($client->email))<div class="muted">Email: {{ $client->email }}</div>@endif
        @if(!empty($client->nif) || !empty($client->rccm))
            <div class="muted">{{ !empty($client->nif) ? 'NIF: '.$client->nif : '' }}{{ !empty($client->nif) && !empty($client->rccm) ? ' | ' : '' }}{{ !empty($client->rccm) ? 'RCCM: '.$client->rccm : '' }}</div>
        @endif
    </td>
    <td style="width:2%"></td>
    <td class="box" style="width:49%">
        <h3>INFORMATIONS OPÉRATION</h3>
        <div><b>Catégorie:</b> {{ $catLabel }}</div>
        @if($typeOp)<div><b>Type:</b> {{ $typeOp }}</div>@endif
        @if($bl)<div><b>N° BL:</b> {{ $bl }}</div>@endif
        @if(!empty($doc->armateur?->nom))<div><b>Armateur:</b> {{ $doc->armateur->nom }}</div>@endif
        @if(!empty($doc->transitaire?->nom))<div><b>Transitaire:</b> {{ $doc->transitaire->nom }}</div>@endif
        @if(!empty($doc->navire))<div><b>Navire:</b> {{ $doc->navire }}</div>@endif
        @if(!empty($doc->representant?->nom))<div><b>Représentant:</b> {{ $doc->representant->nom }}</div>@endif
    </td>
</tr></table>

<table class="items">
    <thead><tr>
        <th style="width:28px">N°</th>
        <th>{{ $tableau['type'] === 'conteneurs' ? 'Désignation' : ($tableau['type'] === 'lots' ? 'Description' : $libelleLigne) }}</th>
        <th class="c" style="width:40px">Qté</th>
        <th class="r" style="width:85px">Prix unit.</th>
        <th class="r" style="width:95px; border-right:none">{{ $libelleMontant }}</th>
    </tr></thead>
    <tbody>
    @forelse($tableau['rows'] as $i => $l)
        @if($tableau['type'] === 'conteneurs')
            <tr class="{{ $l['op'] ? 'op' : ($l['n'] % 2 === 0 ? 'alt' : '') }}">
                <td>{{ $l['op'] ? '' : $l['n'] }}</td>
                <td style="{{ $l['op'] ? 'padding-left:18px' : '' }}">
                    @if($l['op']){{ $l['description'] }}@else<span style="font-family: 'DejaVu Sans Mono', monospace">{{ $l['numero'] }}</span>@if($l['taille'])<span class="muted"> ({{ $l['taille'] }}')</span>@endif @if($l['description'])<span class="muted"> | </span>{{ $l['description'] }}@endif @endif
                </td>
                <td class="c">{{ $fmtQ($l['quantite']) }}</td>
                <td class="r">{{ $fmt($l['pu']) }}</td>
                <td class="r b" style="border-right:none">{{ $fmt($l['montant']) }}</td>
            </tr>
        @else
            <tr class="{{ $i % 2 === 0 ? 'alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $l['description'] }}@if(!empty($l['trajet']))<div class="muted" style="font-size:8px">{{ $l['trajet'] }}</div>@endif</td>
                <td class="c">{{ $fmtQ($l['quantite']) }}</td>
                <td class="r">{{ $fmt($l['pu']) }}</td>
                <td class="r b" style="border-right:none">{{ $fmt($l['montant']) }}</td>
            </tr>
        @endif
    @empty
        <tr><td colspan="5" class="c muted">Aucune ligne</td></tr>
    @endforelse
    </tbody>
</table>

<table style="width:100%; page-break-inside: avoid; margin-bottom:10px"><tr>
    <td class="box" style="width:58%; position:relative">
        @if(!empty($avecCachet))<img src="{{ public_path('images/cachet-signature.png') }}" style="width:120px; float:left; margin-right:6px">@endif
        <h3 style="color:#1f2937">CONDITIONS DE PAIEMENT</h3>
        @foreach($conditions as $cnd)<div class="muted">• {{ $cnd }}</div>@endforeach
    </td>
    <td style="width:4%"></td>
    <td style="width:38%; vertical-align:top">
        <table class="recap">
            <tr class="h"><td colspan="2">Récapitulatif</td></tr>
            @if($remise > 0)
                <tr><td>Total HT brut</td><td class="r b">{{ $fmt($ht + $remise) }}</td></tr>
                <tr style="color:#dc2626"><td>Remise{{ ($doc->remise_type ?? '') === 'pourcentage' ? ' ('.(float)$doc->remise_valeur.'%)' : '' }}</td><td class="r b">- {{ $fmt($remise) }}</td></tr>
                <tr><td>Montant HT</td><td class="r b">{{ $fmt($ht) }}</td></tr>
            @else
                <tr><td>Total HT</td><td class="r b">{{ $fmt($ht) }}</td></tr>
            @endif
            <tr><td>TVA ({{ $doc->taux_tva ?? 18 }}%)@if($exoTva)<span style="color:#d97706; font-size:7.5px"> (Exonéré)</span>@endif</td><td class="r">{{ $fmt($tva) }}</td></tr>
            <tr><td>CSS ({{ $doc->taux_css ?? 1 }}%)@if($exoCss)<span style="color:#d97706; font-size:7.5px"> (Exonéré)</span>@endif</td><td class="r">{{ $fmt($css) }}</td></tr>
            <tr class="ttc"><td>Total TTC</td><td class="r">{{ $fmt($ttc) }}</td></tr>
            @if(!empty($avecPaiement))
                <tr><td>Payé</td><td class="r b" style="color:#16a34a">{{ $fmt($paye) }}</td></tr>
                <tr><td class="b">Reste à payer</td><td class="r b" style="color:{{ $ttc - $paye > 0 ? '#dc2626' : '#16a34a' }}">{{ $fmt(max(0, $ttc - $paye)) }}</td></tr>
            @endif
        </table>
    </td>
</tr></table>

@if($motifExo)
    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:4px; padding:5px; margin-bottom:8px"><b style="color:#b45309">Exonération:</b> <span style="color:#d97706">{{ $motifExo }}</span></div>
@endif
@if(!empty($doc->notes))
    <div class="box" style="margin-bottom:8px"><h3 style="color:#1f2937">NOTES</h3>{{ $doc->notes }}</div>
@endif
