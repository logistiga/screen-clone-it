{{-- Logo LOGISTIGA encodé en base64 pour compatibilité email universelle --}}
@php
    // Logo LOGISTIGA en base64 (PNG transparent)
    // Génère l'image directement dans l'email pour éviter le blocage par les clients email
    $logo_path = public_path('images/logo-logistiga.png');
    $logo_base64 = '';
    
    if (file_exists($logo_path)) {
        $logo_base64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logo_path));
    } else {
        // Fallback: URL externe si le fichier n'existe pas
        $logo_base64 = config('app.logo_url', asset('images/logo-logistiga.png'));
    }
@endphp

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td align="center" style="padding: 10px 0;">
            {{-- Logo avec encodage base64 pour affichage garanti --}}
            <img 
                src="{{ $logo_base64 }}" 
                alt="LOGISTIGA - Transport Stockage Manutention" 
                width="200" 
                height="auto"
                style="
                    max-width: 200px; 
                    height: auto; 
                    display: block; 
                    margin: 0 auto;
                    border: 0;
                    outline: none;
                    text-decoration: none;
                "
            />
        </td>
    </tr>
</table>

{{-- Slogan avec style premium --}}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 8px auto 0 auto;">
    <tr>
        <td align="center" style="
            padding: 6px 20px;
            background: rgba(255,255,255,0.15);
            border-radius: 20px;
        ">
            <p style="
                color: rgba(255,255,255,0.95); 
                font-size: 11px; 
                margin: 0; 
                letter-spacing: 2px; 
                text-transform: uppercase; 
                font-weight: 600;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                Transport &bull; Stockage &bull; Manutention
            </p>
        </td>
    </tr>
</table>
