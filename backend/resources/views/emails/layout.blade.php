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
    <style>
        /* Animations CSS pour clients email modernes */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        .animate-fade { animation: fadeInUp 0.6s ease-out; }
        .animate-slide { animation: slideInLeft 0.5s ease-out; }
        .animate-pulse:hover { animation: pulse 0.3s ease-in-out; }
        .shimmer-bg {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 3s infinite;
        }
        /* Hover effects pour boutons */
        .email-button {
            transition: all 0.3s ease;
        }
        .email-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    
    <!-- Container principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Email Card avec animation -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="animate-fade" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden; max-width: 600px;">
                    
                    @yield('content')
                    
                    <!-- Coordonnées bancaires section -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <p style="color: #1e3a5f; font-size: 12px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
                                            Coordonnées Bancaires
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="padding: 8px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 8px;">
                                                    <p style="color: #1e3a5f; font-size: 12px; font-weight: 600; margin: 0;">BGFI Bank Gabon</p>
                                                    <p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">N°: 40003 04140 41041658011 78</p>
                                                </td>
                                                <td width="10"></td>
                                                <td width="50%" style="padding: 8px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 8px;">
                                                    <p style="color: #1e3a5f; font-size: 12px; font-weight: 600; margin: 0;">UGB</p>
                                                    <p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">N°: 40002 00043 90000338691 84</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Contact Section avec hover -->
                    <tr>
                        <td style="background-color: #f1f5f9; padding: 20px 40px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color: #4a5568; font-size: 14px; line-height: 1.6;">
                                        <strong style="color: #1e3a5f;">Des questions ?</strong><br>
                                        <span style="color: #718096;">Notre équipe est à votre disposition</span>
                                    </td>
                                    <td align="right" style="color: #4a5568; font-size: 14px;">
                                        <a href="tel:+24111701435" style="color: #1e3a5f; text-decoration: none; display: block; margin-bottom: 4px; transition: color 0.3s;">
                                            📞 (+241) 011 70 14 35
                                        </a>
                                        <a href="mailto:info@logistiga.com" style="color: #1e3a5f; text-decoration: none; transition: color 0.3s;">
                                            ✉️ info@logistiga.com
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Premium avec même style que PDF -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%); padding: 32px 40px; text-align: center;">
                            <!-- Ligne décorative animée -->
                            <div class="shimmer-bg" style="height: 2px; background: linear-gradient(90deg, transparent, rgba(220,38,38,0.5), #dc2626, rgba(220,38,38,0.5), transparent); margin-bottom: 20px; border-radius: 1px;"></div>
                            
                            <!-- Nom société -->
                            <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 4px 0; letter-spacing: 1px;">
                                LOGISTIGA SAS
                            </p>
                            <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 0 0 16px 0;">
                                au Capital: 218 000 000 F CFA
                            </p>
                            
                            <!-- Adresse avec icône -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 16px auto;">
                                <tr>
                                    <td style="padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 20px;">
                                        <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 0;">
                                            📍 Siège Social : Owendo SETRAG – GABON
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Contacts en grid -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                                <tr>
                                    <td align="center">
                                        <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 0 0 8px 0;">
                                            Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03
                                        </p>
                                        <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 0;">
                                            B.P.: 18 486 • NIF : 743 107 W • RCCM : 2016B20135
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Liens -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                                <tr>
                                    <td style="padding: 0 12px;">
                                        <a href="mailto:info@logistiga.com" style="color: #dc2626; text-decoration: none; font-size: 12px; font-weight: 500;">
                                            info@logistiga.com
                                        </a>
                                    </td>
                                    <td style="color: rgba(255,255,255,0.3);">|</td>
                                    <td style="padding: 0 12px;">
                                        <a href="https://www.logistiga.com" style="color: #dc2626; text-decoration: none; font-size: 12px; font-weight: 500;">
                                            www.logistiga.com
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Ligne décorative -->
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); margin-bottom: 16px;"></div>
                            
                            <!-- Copyright -->
                            <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 0;">
                                © {{ date('Y') }} LOGISTIGA. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Disclaimer avec animation subtile -->
                <p class="animate-slide" style="color: #a0aec0; font-size: 11px; text-align: center; margin: 24px 0 0 0; max-width: 500px; line-height: 1.5;">
                    Cet email et toute pièce jointe sont confidentiels et destinés exclusivement au destinataire. 
                    Si vous n'êtes pas le destinataire prévu, merci de supprimer cet email.
                </p>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
