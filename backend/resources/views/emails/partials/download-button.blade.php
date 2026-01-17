{{-- Bouton Télécharger PDF --}}
@php
    $button_colors = [
        'devis' => ['bg' => '#1e40af', 'hover' => '#1d4ed8', 'icon' => '📄'],
        'facture' => ['bg' => '#059669', 'hover' => '#10b981', 'icon' => '🧾'],
        'ordre' => ['bg' => '#7c3aed', 'hover' => '#8b5cf6', 'icon' => '📦'],
        'note_debut' => ['bg' => '#0891b2', 'hover' => '#06b6d4', 'icon' => '📝'],
        'default' => ['bg' => '#1e3a5f', 'hover' => '#2d5a87', 'icon' => '📥'],
    ];
    $color = $button_colors[$type ?? 'default'] ?? $button_colors['default'];
    $label = $label ?? 'Télécharger le document PDF';
@endphp

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
    <tr>
        <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ $download_url ?? '#' }}" style="height:50px;v-text-anchor:middle;width:280px;" arcsize="10%" strokecolor="{{ $color['bg'] }}" fillcolor="{{ $color['bg'] }}">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">{{ $color['icon'] }} {{ $label }}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="{{ $download_url ?? '#' }}" 
               target="_blank"
               style="display: inline-block; 
                      background: linear-gradient(135deg, {{ $color['bg'] }} 0%, {{ $color['hover'] }} 100%);
                      color: #ffffff; 
                      padding: 14px 32px; 
                      border-radius: 10px; 
                      text-decoration: none; 
                      font-size: 15px; 
                      font-weight: 600;
                      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
                      transition: all 0.3s ease;">
                {{ $color['icon'] }} {{ $label }}
            </a>
            <!--<![endif]-->
        </td>
    </tr>
</table>
