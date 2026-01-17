{{-- Logo LOGISTIGA en base64 pour compatibilité email --}}
@php
    // Logo LOGISTIGA bleu professionnel encodé en base64
    $logo_base64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAyMDAgNTAiPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8dGV4dCB4PSIxMCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmZmZmYiIGxldHRlci1zcGFjaW5nPSIyIj5MT0dJU1RJR0E8L3RleHQ+Cjwvc3ZnPg==';
@endphp

@if(config('app.logo_url'))
    <img src="{{ config('app.logo_url') }}" alt="LOGISTIGA" width="180" style="max-width: 180px; height: auto; margin-bottom: 8px;" />
@else
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
            <td style="background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%); border-radius: 8px; padding: 8px 16px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 3px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">LOGISTIGA</h1>
            </td>
        </tr>
    </table>
@endif
<p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 10px 0 0 0; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500;">
    Solutions Logistiques Professionnelles
</p>
