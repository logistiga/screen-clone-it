<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $subject ?? 'LOGISTIGA' }}</title>
    <!--[if mso]>
    <style type="text/css">
        table { border-collapse: collapse; }
        .button { padding: 14px 28px !important; }
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    
    <!-- Container principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Email Card -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden; max-width: 600px;">
                    
                    @yield('content')
                    
                    <!-- Contact Section -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color: #4a5568; font-size: 14px; line-height: 1.6;">
                                        <strong style="color: #1e3a5f;">Des questions ?</strong><br>
                                        <span style="color: #718096;">Notre équipe est à votre disposition</span>
                                    </td>
                                    <td align="right" style="color: #4a5568; font-size: 14px;">
                                        <a href="tel:+24111701435" style="color: #1e3a5f; text-decoration: none; display: block; margin-bottom: 4px;">📞 +241 11 70 14 35</a>
                                        <a href="mailto:info@logistiga.com" style="color: #1e3a5f; text-decoration: none;">✉️ info@logistiga.com</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 28px 40px; text-align: center;">
                            <p style="color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 600; margin: 0 0 4px 0; letter-spacing: 0.5px;">
                                LOGISTIGA SAS
                            </p>
                            <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0 0 16px 0;">
                                Owendo SETRAG – GABON
                            </p>
                            
                            <!-- Coordonnées bancaires -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
                                <tr>
                                    <td style="padding: 0 8px;">
                                        <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 0;">BGFI Bank: 40003 04140 41041658011 78</p>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 0;">UGB: 40002 00043 90000338691 84</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 16px 0 0 0;">
                                © {{ date('Y') }} LOGISTIGA. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Disclaimer -->
                <p style="color: #a0aec0; font-size: 11px; text-align: center; margin: 24px 0 0 0; max-width: 500px; line-height: 1.5;">
                    Cet email et toute pièce jointe sont confidentiels et destinés exclusivement au destinataire. 
                    Si vous n'êtes pas le destinataire prévu, merci de supprimer cet email.
                </p>
                
            </td>
        </tr>
    </table>
    
</body>
</html>