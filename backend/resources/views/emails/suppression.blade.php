@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>🗑️ Suppression – {{ $type ?? 'Document' }}</h1>
</div>

<div class="email-body">
    <div class="email-content">
        <p>Bonjour,</p>

        <p>Le document <strong>{{ $numero ?? '' }}</strong> a été supprimé du système.</p>

        @if(!empty($client_nom))
        <p><strong>Client :</strong> {{ $client_nom }}</p>
        @endif

        @if(!empty($details))
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            @foreach($details as $label => $valeur)
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e3a5f;">{{ $label }}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">{{ $valeur }}</td>
            </tr>
            @endforeach
        </table>
        @endif

        <p style="color: #dc2626; font-weight: 600;">⚠️ Cette action est irréversible.</p>

        @if(!empty($message_personnalise))
        <div style="margin-top: 16px; padding: 12px; background-color: #f8fafc; border-left: 3px solid #dc2626; border-radius: 4px;">
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
