@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>Ordre de Travail</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour <strong>{{ $client->raison_sociale ?? $client->nom_complet }}</strong>,</p>
        
        <p>Nous vous confirmons la prise en charge de votre ordre de travail n°<strong>{{ $ordre->numero }}</strong>.</p>
        
        @if($message_personnalise)
        <div class="highlight-box">
            <p>{{ $message_personnalise }}</p>
        </div>
        @endif
    </div>

    <div class="highlight-box">
        <h3>Détails de l'ordre de travail</h3>
        <table class="info-table">
            <tr>
                <td>Numéro</td>
                <td><strong>{{ $ordre->numero }}</strong></td>
            </tr>
            <tr>
                <td>Date de création</td>
                <td>{{ $ordre->date_ordre->format('d/m/Y') }}</td>
            </tr>
            @if($ordre->conteneurs && $ordre->conteneurs->count() > 0)
            <tr>
                <td>Conteneur(s)</td>
                <td>{{ $ordre->conteneurs->pluck('numero')->join(', ') }}</td>
            </tr>
            @endif
            <tr>
                <td>Statut</td>
                <td>
                    @switch($ordre->statut)
                        @case('en_attente')
                            <span class="badge badge-warning">En attente</span>
                            @break
                        @case('en_cours')
                            <span class="badge badge-info">En cours</span>
                            @break
                        @case('termine')
                            <span class="badge badge-success">Terminé</span>
                            @break
                        @default
                            <span class="badge badge-info">{{ $ordre->statut }}</span>
                    @endswitch
                </td>
            </tr>
            <tr>
                <td>Montant HT</td>
                <td>{{ number_format($ordre->montant_ht, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <td>Montant TTC</td>
                <td class="amount">{{ number_format($ordre->montant_ttc, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>

    <div class="email-content">
        <p>Nous vous tiendrons informé de l'avancement des travaux.</p>
        <p>N'hésitez pas à nous contacter pour toute question.</p>
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
