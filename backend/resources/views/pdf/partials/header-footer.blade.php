{{-- Shared header/footer for all export PDFs --}}
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', Arial, sans-serif;
        font-size: 10px;
        line-height: 1.4;
        color: #333;
        padding: 15px;
    }
    .header {
        display: table;
        width: 100%;
        border-bottom: 2px solid #dc2626;
        padding-bottom: 10px;
        margin-bottom: 15px;
    }
    .header-left {
        display: table-cell;
        width: 50%;
        vertical-align: middle;
    }
    .header-right {
        display: table-cell;
        width: 50%;
        vertical-align: middle;
        text-align: right;
    }
    .logo img {
        height: 50px;
        max-width: 200px;
    }
    .logo-subtitle {
        font-size: 8px;
        color: #dc2626;
    }
    .doc-title {
        font-size: 16px;
        font-weight: bold;
        color: #dc2626;
    }
    .doc-meta {
        font-size: 10px;
        color: #555;
    }
    .doc-date {
        font-size: 9px;
        color: #999;
    }
    .section-title {
        font-size: 11px;
        font-weight: bold;
        color: #dc2626;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 3px;
        margin: 14px 0 6px;
    }
    .kpi-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 5px;
    }
    .kpi-table td {
        border: 1px solid #e5e7eb;
        padding: 5px 7px;
        background: #f9fafb;
        width: 25%;
    }
    .kpi-label {
        font-size: 7px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    .kpi-value {
        font-size: 10px;
        font-weight: bold;
        color: #111;
        margin-top: 1px;
    }
    .kpi-danger { background: #fef2f2; border-color: #fecaca; }
    .kpi-danger .kpi-value { color: #dc2626; }
    .kpi-success .kpi-value { color: #15803d; }
    .kpi-warning { background: #fffbeb; border-color: #fde68a; }
    .kpi-warning .kpi-value { color: #b45309; }
    table.data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9px;
        margin-top: 4px;
    }
    table.data-table th {
        background: #f3f4f6;
        font-weight: 600;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    table.data-table th,
    table.data-table td {
        border: 1px solid #d1d5db;
        padding: 3px 5px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-red { color: #dc2626; font-weight: 600; }
    .text-green { color: #15803d; }
    .row-alt { background: #f9fafb; }
    .row-total { background: #fef2f2; font-weight: bold; }
    .footer {
        margin-top: 20px;
        border-top: 1px solid #e5e7eb;
        padding-top: 8px;
        font-size: 8px;
        color: #6b7280;
        text-align: center;
    }
    .footer strong { color: #555; }
    .filter-info {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        padding: 6px 10px;
        margin-bottom: 10px;
        font-size: 9px;
        color: #555;
    }
    .filter-info span { margin-right: 15px; }
</style>
