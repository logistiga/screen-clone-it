{{-- Logo LOGISTIGA avec image officielle --}}
@php
    // URL du logo - utilise l'URL configurée ou le logo local
    $logo_url = config('app.logo_url') ?? asset('images/logo-logistiga.png');
@endphp

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td align="center">
            <img 
                src="{{ $logo_url }}" 
                alt="LOGISTIGA" 
                width="220" 
                style="max-width: 220px; height: auto; margin-bottom: 8px; display: block;"
            />
        </td>
    </tr>
</table>
<p style="color: rgba(255,255,255,0.9); font-size: 11px; margin: 8px 0 0 0; letter-spacing: 1px; text-transform: uppercase; font-weight: 500;">
    Transport • Stockage • Manutention
</p>
