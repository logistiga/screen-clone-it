@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>Note de Début - {{ $note->type_label }}</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour <strong>{{ $client->raison_sociale ?? $client->nom_complet ?? $client->nom }}</strong>,</p>
        
        <p>Veuillez trouver ci-joint la note de début n°<strong>{{ $note->numero }}</strong>.</p>
        
        @if($message_personnalise)
        <div class="highlight-box">
            <p>{{ $message_personnalise }}</p>
        </div>
        @endif
    </div>

    <div class="highlight-box">
        <h3>Détails de la note</h3>
        <table class="info-table">
            <tr>
                <td>Numéro</td>
                <td><strong>{{ $note->numero }}</strong></td>
            </tr>
            <tr>
                <td>Type</td>
                <td>{{ $note->type_label }}</td>
            </tr>
            @if($note->conteneur_numero)
            <tr>
                <td>N° Conteneur</td>
                <td>{{ $note->conteneur_numero }}</td>
            </tr>
            @endif
            @if($note->bl_numero)
            <tr>
                <td>N° BL</td>
                <td>{{ $note->bl_numero }}</td>
            </tr>
            @endif
            @if($note->date_debut && $note->date_fin)
            <tr>
                <td>Période</td>
                <td>Du {{ \Carbon\Carbon::parse($note->date_debut)->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($note->date_fin)->format('d/m/Y') }}</td>
            </tr>
            @endif
            @if($note->nombre_jours)
            <tr>
                <td>Nombre de jours</td>
                <td>{{ $note->nombre_jours }} jours</td>
            </tr>
            @endif
            <tr>
                <td>Montant Total</td>
                <td class="amount">{{ number_format($note->montant_total ?? $note->montant_ht ?? 0, 0, ',', ' ') }} FCFA</td>
            </tr>
            @if($note->montant_paye > 0)
            <tr>
                <td>Montant Payé</td>
                <td style="color: #16a34a;">{{ number_format($note->montant_paye, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            @php
                $reste = ($note->montant_total ?? $note->montant_ht ?? 0) - ($note->montant_paye ?? 0) - ($note->montant_avance ?? 0);
            @endphp
            @if($reste > 0)
            <tr>
                <td>Reste à Payer</td>
                <td style="color: #dc2626; font-weight: bold;">{{ number_format($reste, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
        </table>
    </div>

    <div class="email-content">
        @if($reste > 0)
        <p>Merci de procéder au règlement du montant restant.</p>
        @endif
        <p>N'hésitez pas à nous contacter pour toute question.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
