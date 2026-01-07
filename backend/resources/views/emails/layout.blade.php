<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'LOJISTIGA' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%);
            padding: 30px;
            text-align: center;
        }
        .email-header img {
            max-height: 50px;
            margin-bottom: 10px;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .email-body {
            padding: 40px 30px;
        }
        .email-content {
            margin-bottom: 30px;
        }
        .email-content p {
            margin-bottom: 15px;
            color: #555;
        }
        .highlight-box {
            background-color: #f8fafc;
            border-left: 4px solid #1a365d;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .highlight-box h3 {
            color: #1a365d;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .highlight-box p {
            margin: 5px 0;
            color: #666;
        }
        .highlight-box .amount {
            font-size: 24px;
            font-weight: 700;
            color: #1a365d;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        .info-table td:first-child {
            font-weight: 600;
            color: #666;
            width: 40%;
        }
        .info-table td:last-child {
            color: #333;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%);
            color: #ffffff !important;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .cta-button:hover {
            background: linear-gradient(135deg, #2d4a7c 0%, #1a365d 100%);
        }
        .email-footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        .email-footer p {
            color: #888;
            font-size: 13px;
            margin: 5px 0;
        }
        .email-footer .company-name {
            font-weight: 600;
            color: #1a365d;
            font-size: 15px;
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .signature p {
            margin: 3px 0;
            color: #666;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-success { background-color: #d1fae5; color: #065f46; }
        .badge-warning { background-color: #fef3c7; color: #92400e; }
        .badge-danger { background-color: #fee2e2; color: #991b1b; }
        .badge-info { background-color: #dbeafe; color: #1e40af; }
    </style>
</head>
<body>
    <div class="email-wrapper">
        @yield('content')
        
        <div class="email-footer">
            <p class="company-name">LOJISTIGA</p>
            <p>Solutions logistiques et gestion de conteneurs</p>
            <p>{{ config('mail.from.address') }}</p>
            <p style="margin-top: 15px; font-size: 11px; color: #aaa;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
            </p>
        </div>
    </div>
</body>
</html>
