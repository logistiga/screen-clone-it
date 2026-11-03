@if($note->lignes && $note->lignes->count() > 0)
@php $divers = strtolower($note->type) === 'divers'; @endphp
<table class="lignes-table">
    <thead>
        <tr>
            <th>#</th>
            @if($divers)
                <th>Désignation</th>
                <th>N° reçu / référence</th>
            @else
                <th>Conteneur / Description</th>
                <th>BL</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th class="text-center">Jours</th>
                <th class="text-right">Tarif/jour</th>
            @endif
            <th class="text-right">Montant HT</th>
        </tr>
    </thead>
    <tbody>
        @php $totalLignes = 0; @endphp
        @foreach($note->lignes as $i => $ligne)
        @php $totalLignes += $ligne->montant_ht ?? 0; @endphp
        <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
            <td>{{ $i + 1 }}</td>
            @if($divers)
                <td style="white-space: pre-wrap; word-wrap: break-word;">{{ $ligne->designation ?: ($ligne->observations ?: '-') }}</td>
                <td>{{ $ligne->reference_justificatif ?: ($ligne->conteneur_numero ?: '-') }}</td>
            @else
                <td>{{ $ligne->conteneur_numero ?? '-' }}@if($ligne->designation || $ligne->observations)<div style="white-space: pre-wrap; word-wrap: break-word;">{{ $ligne->designation ?: $ligne->observations }}</div>@endif</td>
                <td>{{ $ligne->bl_numero ?? '-' }}</td>
                <td>{{ $ligne->date_debut ? $ligne->date_debut->format('d/m/Y') : '-' }}</td>
                <td>{{ $ligne->date_fin ? $ligne->date_fin->format('d/m/Y') : '-' }}</td>
                <td class="text-center">{{ $ligne->nombre_jours ?? '-' }}</td>
                <td class="text-right">{{ $ligne->tarif_journalier ? number_format($ligne->tarif_journalier, 0, ',', ' ') : '-' }}</td>
            @endif
            <td class="text-right">{{ number_format($ligne->montant_ht ?? 0, 0, ',', ' ') }}</td>
        </tr>
        @endforeach
        <tr class="row-total">
            <td colspan="{{ $divers ? 3 : 7 }}">TOTAL</td>
            <td class="text-right">{{ number_format($totalLignes, 0, ',', ' ') }} FCFA</td>
        </tr>
    </tbody>
</table>
@endif