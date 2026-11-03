    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            padding: 20px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid {{ $couleurPrimaire }};
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header-left {
            display: table-cell;
            width: 40%;
            vertical-align: middle;
        }
        .header-left img { height: 60px; }
        .header-right {
            display: table-cell;
            width: 60%;
            vertical-align: middle;
            text-align: right;
        }
        .doc-title {
            font-size: 18px;
            font-weight: bold;
            color: {{ $couleurPrimaire }};
            text-transform: uppercase;
        }
        .doc-numero {
            font-size: 14px;
            font-weight: bold;
            margin-top: 3px;
        }
        .doc-date {
            font-size: 10px;
            color: #888;
            margin-top: 3px;
        }
        .type-badge {
            display: inline-block;
            background-color: {{ $badgeBg }};
            color: {{ $couleurAccent }};
            padding: 4px 12px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 10px;
            margin-top: 5px;
        }

        /* Info boxes */
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .info-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 10px;
        }
        .info-box h3 {
            font-size: 9px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .info-box .name {
            font-size: 13px;
            font-weight: bold;
            color: {{ $couleurPrimaire }};
        }
        .info-box p { margin: 2px 0; font-size: 10px; }

        /* Details table */
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .details-table th {
            background-color: #f3f4f6;
            padding: 8px 10px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            border-bottom: 2px solid #d1d5db;
        }
        .details-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-table .label {
            width: 40%;
            color: #6b7280;
            font-size: 10px;
        }
        .details-table .value {
            font-weight: 600;
            font-size: 10px;
        }

        /* Lignes table (multi-conteneurs) */
        .lignes-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
        }
        .lignes-table th {
            background: #f3f4f6;
            font-weight: 600;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 6px 8px;
            border-bottom: 2px solid #d1d5db;
        }
        .lignes-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .lignes-table .row-alt { background: #f9fafb; }
        .lignes-table .row-total {
            background: #fef2f2;
            font-weight: bold;
        }

        /* Totals */
        .totals-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 12px;
            margin-bottom: 20px;
        }
        .totals-table { width: 100%; }
        .totals-table td { padding: 5px 0; font-size: 10px; }
        .totals-table .label { color: #6b7280; }
        .totals-table .value { text-align: right; font-weight: 600; }
        .totals-table .total-row {
            border-top: 2px solid {{ $couleurPrimaire }};
        }
        .totals-table .total-row .label {
            color: {{ $couleurPrimaire }};
            font-weight: bold;
            font-size: 12px;
        }
        .totals-table .total-row .value {
            color: {{ $couleurPrimaire }};
            font-size: 14px;
        }
        .totals-table .paye-row .value { color: #16a34a; }
        .totals-table .reste-row .value { color: #dc2626; font-size: 12px; }

        /* Bank info */
        .bank-info {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 20px;
        }
        .bank-info h3 {
            font-size: 9px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 8px;
        }
        .bank-grid { display: table; width: 100%; }
        .bank-item { display: table-cell; width: 50%; }
        .bank-item .bname { font-weight: bold; font-size: 10px; }
        .bank-item .bnumber { color: #666; font-size: 9px; }

        /* Signatures */
        .signatures {
            display: table;
            width: 100%;
            margin-top: 30px;
        }
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 0 20px;
        }
        .signature-box .stitle {
            font-weight: bold;
            margin-bottom: 40px;
            font-size: 10px;
        }
        .signature-box .sline {
            border-top: 1px dashed #999;
            padding-top: 5px;
            color: #666;
            font-size: 8px;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 8px;
            color: #6b7280;
        }
        .footer strong { color: #555; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Section specifique */
        .section-specific {
            background: {{ $badgeBg }};
            border-left: 3px solid {{ $couleurAccent }};
            padding: 8px 12px;
            margin-bottom: 15px;
            font-size: 10px;
        }
        .section-specific strong { color: {{ $couleurAccent }}; }
    </style>
