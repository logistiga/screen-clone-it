@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>🔄 Modification – {{ $type ?? 'Document' }}</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour,</p>

        <p>Le document <strong>{{ $numero ?? '' }}</strong> a été modifié.</p>

        @if(!empty($client_nom))
        <p><strong>Client :</strong> {{ $client_nom }}</p>
        @endif

        @if(!empty($modifications))
        <p><strong>Éléments modifiés :</strong></p>
        <ul>
            @foreach($modifications as $champ)
                <li>{{ $champ }}</li>
            @endforeach
        </ul>
        @endif

        @if(!empty($message_personnalise))
        <div style="margin-top: 16px; padding: 12px; background-color: #f8fafc; border-left: 3px solid #1e3a5f; border-radius: 4px;">
            {!! nl2br(e($message_personnalise)) !!}
        </div>
        @endif
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOGISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
