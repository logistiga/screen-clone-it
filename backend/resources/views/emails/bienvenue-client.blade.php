@extends('emails.layout')

@section('content')
<div class="email-header" style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);">
    <h1>🎉 Bienvenue chez LOJISTIGA</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour <strong>{{ $client->raison_sociale ?? $client->nom_complet }}</strong>,</p>
        
        <p>Nous sommes ravis de vous compter parmi nos clients !</p>
        
        <p>Votre compte a été créé avec succès dans notre système. Vous pouvez désormais bénéficier de l'ensemble de nos services logistiques.</p>
    </div>

    <div class="highlight-box" style="border-left-color: #7c3aed;">
        <h3 style="color: #7c3aed;">Vos informations</h3>
        <table class="info-table">
            <tr>
                <td>Code client</td>
                <td><strong>{{ $client->code ?? 'N/A' }}</strong></td>
            </tr>
            @if($client->raison_sociale)
            <tr>
                <td>Raison sociale</td>
                <td>{{ $client->raison_sociale }}</td>
            </tr>
            @endif
            <tr>
                <td>Email</td>
                <td>{{ $client->email }}</td>
            </tr>
            @if($client->telephone)
            <tr>
                <td>Téléphone</td>
                <td>{{ $client->telephone }}</td>
            </tr>
            @endif
        </table>
    </div>

    <div class="email-content">
        <h3>Nos services</h3>
        <ul style="margin: 15px 0; padding-left: 20px; color: #555;">
            <li style="margin-bottom: 8px;">Gestion et réparation de conteneurs</li>
            <li style="margin-bottom: 8px;">Stockage et manutention</li>
            <li style="margin-bottom: 8px;">Solutions logistiques personnalisées</li>
            <li style="margin-bottom: 8px;">Suivi en temps réel de vos opérations</li>
        </ul>
        
        <p>N'hésitez pas à nous contacter pour toute demande de devis ou d'information.</p>
    </div>

    <div class="signature">
        <p>À très bientôt,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
