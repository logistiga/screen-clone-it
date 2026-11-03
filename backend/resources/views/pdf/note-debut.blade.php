<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $titre ?? 'Note de Début' }} - {{ $note->numero }}</title>
    @php
        // Couleurs Logistiga basées sur le logo
        $logistigaRouge = '#E63946';   // Rouge primaire
        $logistigaGris = '#4A4A4A';    // Gris foncé
        $logistigaRougeClair = '#FEE2E8'; // Rouge clair pour badges
        
        // Utiliser les couleurs du logo comme base, avec accent par type
        $couleurPrimaire = $logistigaRouge;
        $couleurAccent = $couleur ?? $logistigaRouge;
        $badgeBg = $badge_bg ?? $logistigaRougeClair;
    @endphp
    @include('pdf.partials.note-debut-styles')
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            @php
                $logoPath = public_path('images/logistiga-logo.png');
                if (!file_exists($logoPath)) {
                    $logoPath = public_path('images/logo-logistiga.png');
                }
            @endphp
            @if(file_exists($logoPath))
                <img src="{{ $logoPath }}" alt="Logistiga">
            @else
                <div style="font-size: 20px; font-weight: bold; color: {{ $couleurPrimaire }};">LOGISTIGA</div>
            @endif
        </div>
        <div class="header-right">
            <div class="doc-title">{{ $titre }}</div>
            <div class="doc-numero">{{ $note->numero }}</div>
            <div class="doc-date">Date: {{ $note->date_creation ? $note->date_creation->format('d/m/Y') : now()->format('d/m/Y') }}</div>
            <div class="type-badge">{{ $type_label }}</div>
        </div>
    </div>

    <!-- Émetteur / Client -->
    <div class="info-grid">
        <div class="info-box">
            <h3>Émetteur</h3>
            <p class="name">LOGISTIGA SAS</p>
            <p>Owendo SETRAG – GABON</p>
            <p>Tel: (+241) 011 70 14 35</p>
            <p>Email: info@logistiga.com</p>
        </div>
        <div class="info-box">
            <h3>Client</h3>
            <p class="name">{{ $client->raison_sociale ?? $client->nom ?? $client->nom_complet ?? '-' }}</p>
            @if($client->adresse)<p>{{ $client->adresse }}</p>@endif
            @if($client->telephone)<p>Tel: {{ $client->telephone }}</p>@endif
            @if($client->email)<p>Email: {{ $client->email }}</p>@endif
        </div>
    </div>

    {{-- Section spécifique selon le type --}}
    @if($note->type === 'detention' || $note->type === 'Detention')
        <div class="section-specific">
            <strong>NOTE DE DÉTENTION</strong> — Frais de détention de conteneur au-delà de la période de franchise.
            @if($note->jours_franchise)
                Franchise : {{ $note->jours_franchise }} jours.
            @endif
        </div>
    @elseif($note->type === 'ouverture_port' || $note->type === 'Ouverture Port')
        <div class="section-specific">
            <strong>NOTE D'OUVERTURE DE PORT</strong> — Frais relatifs à l'ouverture et aux opérations portuaires.
        </div>
    @elseif($note->type === 'reparation' || $note->type === 'Reparation')
        <div class="section-specific">
            <strong>NOTE DE RÉPARATION</strong> — Frais de réparation de conteneur.
        </div>
    @elseif($note->type === 'relache' || $note->type === 'Relache')
        <div class="section-specific">
            <strong>NOTE DE RELÂCHE</strong> — Frais de relâche conteneur.
        </div>
    @endif

    <!-- Details de l'opération -->
    <table class="details-table">
        <thead>
            <tr><th colspan="2">Détails de l'opération</th></tr>
        </thead>
        <tbody>
            @if($note->conteneur_numero)
            <tr><td class="label">N° Conteneur</td><td class="value">{{ $note->conteneur_numero }}</td></tr>
            @endif
            @if($note->conteneur_taille)
            <tr><td class="label">Taille</td><td class="value">{{ $note->conteneur_taille }}</td></tr>
            @endif
            @if($note->bl_numero || $note->numero_bl)
            <tr><td class="label">N° BL</td><td class="value">{{ $note->bl_numero ?? $note->numero_bl }}</td></tr>
            @endif
            @if($note->navire)
            <tr><td class="label">Navire</td><td class="value">{{ $note->navire }}</td></tr>
            @endif
            @if($note->armateur)
            <tr><td class="label">Armateur</td><td class="value">{{ $note->armateur->nom ?? '-' }}</td></tr>
            @endif
            @if($note->transitaire)
            <tr><td class="label">Transitaire</td><td class="value">{{ $note->transitaire->nom ?? '-' }}</td></tr>
            @endif
            @if($note->date_debut || $note->date_debut_stockage)
            <tr><td class="label">Date de début</td><td class="value">{{ ($note->date_debut ?? $note->date_debut_stockage)?->format('d/m/Y') }}</td></tr>
            @endif
            @if($note->date_fin || $note->date_fin_stockage)
            <tr><td class="label">Date de fin</td><td class="value">{{ ($note->date_fin ?? $note->date_fin_stockage)?->format('d/m/Y') }}</td></tr>
            @endif
            @if($note->nombre_jours || $note->jours_stockage)
            <tr><td class="label">Nombre de jours</td><td class="value">{{ $note->nombre_jours ?? $note->jours_stockage }} jours</td></tr>
            @endif
            @if($note->tarif_journalier)
            <tr><td class="label">Tarif journalier</td><td class="value">{{ number_format($note->tarif_journalier, 0, ',', ' ') }} FCFA</td></tr>
            @endif
            @if($note->description)
            <tr><td class="label">Description</td><td class="value">{{ $note->description }}</td></tr>
            @endif
            @if($note->observations)
            <tr><td class="label">Observations</td><td class="value">{{ $note->observations }}</td></tr>
            @endif
        </tbody>
    </table>

    @include('pdf.partials.note-debut-lines')

    <!-- Récapitulatif financier -->
    <div class="totals-box">
        <table class="totals-table">
            @php
                $montantTotal = $note->montant_total ?? $note->montant_ttc ?? $note->montant_ht ?? 0;
                $montantPaye = $note->montant_paye ?? 0;
                $montantAvance = $note->montant_avance ?? 0;
                $reste = $montantTotal - $montantPaye - $montantAvance;
            @endphp
            <tr class="total-row">
                <td class="label">Montant Total</td>
                <td class="value">{{ number_format($montantTotal, 0, ',', ' ') }} FCFA</td>
            </tr>
            @if($montantAvance > 0)
            <tr class="paye-row">
                <td class="label">Avance</td>
                <td class="value">-{{ number_format($montantAvance, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            @if($montantPaye > 0)
            <tr class="paye-row">
                <td class="label">Montant Payé</td>
                <td class="value">-{{ number_format($montantPaye, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            <tr class="reste-row" style="border-top: 1px solid #e2e8f0;">
                <td class="label" style="font-weight: bold;">Reste à Payer</td>
                <td class="value">{{ number_format($reste, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>


    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-box">
            <div class="stitle">Le Client</div>
            <div class="sline">Signature et cachet</div>
        </div>
        <div class="signature-box">
            <div class="stitle">LOGISTIGA SAS</div>
            <div class="sline">Signature et cachet</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
