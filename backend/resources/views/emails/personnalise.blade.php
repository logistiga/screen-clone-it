@extends('emails.layout')

@section('content')
<div class="email-header">
    <h1>Message</h1>
</div>

<div class="email-body">
    <div class="email-content">
        {!! nl2br(e($contenu)) !!}
    </div>

    <div class="signature">
        <p>Cordialement,</p>
        <p><strong>L'équipe LOJISTIGA</strong></p>
        <p>{{ config('mail.from.address') }}</p>
    </div>
</div>
@endsection
