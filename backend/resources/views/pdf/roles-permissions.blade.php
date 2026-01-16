<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport des Rôles et Permissions</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            background: #fff;
        }
        
        .container {
            padding: 20px;
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #1e40af;
        }
        
        .header h1 {
            font-size: 22px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .header .subtitle {
            color: #666;
            font-size: 11px;
        }
        
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 9px;
            color: #666;
        }
        
        /* Stats Cards */
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }
        
        .stat-card {
            display: table-cell;
            width: 20%;
            text-align: center;
            padding: 12px 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        
        .stat-card:first-child {
            border-radius: 8px 0 0 8px;
        }
        
        .stat-card:last-child {
            border-radius: 0 8px 8px 0;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .stat-label {
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
        }
        
        /* Section */
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            padding: 8px 12px;
            background: #eff6ff;
            border-left: 4px solid #1e40af;
            margin-bottom: 12px;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        th, td {
            padding: 8px 10px;
            text-align: left;
            border: 1px solid #e2e8f0;
        }
        
        th {
            background: #f1f5f9;
            font-weight: bold;
            color: #475569;
            font-size: 9px;
            text-transform: uppercase;
        }
        
        td {
            font-size: 10px;
        }
        
        tr:nth-child(even) {
            background: #f8fafc;
        }
        
        /* Badges */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: bold;
        }
        
        .badge-system {
            background: #1e40af;
            color: white;
        }
        
        .badge-custom {
            background: #e2e8f0;
            color: #475569;
        }
        
        .badge-success {
            background: #dcfce7;
            color: #166534;
        }
        
        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }
        
        /* Role Detail Cards */
        .role-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        .role-header {
            padding: 12px 15px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            border-radius: 8px 8px 0 0;
        }
        
        .role-name {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: capitalize;
        }
        
        .role-meta {
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
        }
        
        .role-body {
            padding: 12px 15px;
        }
        
        .permissions-grid {
            display: table;
            width: 100%;
        }
        
        .permission-module {
            display: table-cell;
            width: 25%;
            padding: 6px;
            vertical-align: top;
        }
        
        .module-name {
            font-weight: bold;
            font-size: 9px;
            color: #475569;
            margin-bottom: 4px;
            padding-bottom: 3px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .permission-item {
            font-size: 8px;
            padding: 2px 0;
            color: #166534;
        }
        
        .permission-item::before {
            content: "✓ ";
            color: #22c55e;
        }
        
        .no-permission {
            color: #9ca3af;
            font-style: italic;
        }
        
        .no-permission::before {
            content: "✗ ";
            color: #ef4444;
        }
        
        /* Users List */
        .users-section {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #e2e8f0;
        }
        
        .users-title {
            font-size: 9px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 5px;
        }
        
        .user-item {
            display: inline-block;
            padding: 3px 8px;
            margin: 2px;
            background: #f1f5f9;
            border-radius: 4px;
            font-size: 8px;
        }
        
        .user-inactive {
            background: #fee2e2;
            color: #991b1b;
        }
        
        /* Progress Bar */
        .progress-bar {
            width: 80px;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            display: inline-block;
            vertical-align: middle;
        }
        
        .progress-fill {
            height: 100%;
            background: #1e40af;
            border-radius: 4px;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
        }
        
        /* Page Break */
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Rapport des Rôles et Permissions</h1>
            <p class="subtitle">Vue d'ensemble des accès et autorisations du système</p>
            <div class="meta-info">
                <span>Généré le: {{ $generated_at }}</span>
                <span>Par: {{ $generated_by }}</span>
            </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{{ $stats['total_roles'] }}</div>
                <div class="stat-label">Total Rôles</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['total_permissions'] }}</div>
                <div class="stat-label">Permissions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['total_users'] }}</div>
                <div class="stat-label">Utilisateurs</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['system_roles'] }}</div>
                <div class="stat-label">Rôles Système</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ $stats['custom_roles'] }}</div>
                <div class="stat-label">Rôles Personnalisés</div>
            </div>
        </div>

        <!-- Roles Summary Table -->
        <div class="section">
            <div class="section-title">Résumé des Rôles</div>
            <table>
                <thead>
                    <tr>
                        <th>Rôle</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Permissions</th>
                        <th>Niveau d'accès</th>
                        <th>Utilisateurs</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($roles as $role)
                    <tr>
                        <td style="font-weight: bold; text-transform: capitalize;">{{ $role['name'] }}</td>
                        <td>{{ $role['description'] }}</td>
                        <td>
                            @if($role['is_system'])
                                <span class="badge badge-system">Système</span>
                            @else
                                <span class="badge badge-custom">Personnalisé</span>
                            @endif
                        </td>
                        <td style="text-align: center;">{{ $role['permissions_count'] }}</td>
                        <td>
                            @php
                                $percentage = $stats['total_permissions'] > 0 
                                    ? round(($role['permissions_count'] / $stats['total_permissions']) * 100) 
                                    : 0;
                            @endphp
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: {{ $percentage }}%"></div>
                            </div>
                            <span style="margin-left: 5px; font-size: 9px;">{{ $percentage }}%</span>
                        </td>
                        <td style="text-align: center;">
                            @if($role['users_count'] > 0)
                                <span class="badge badge-success">{{ $role['users_count'] }}</span>
                            @else
                                <span class="badge badge-warning">0</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Detailed Role Information -->
        <div class="section">
            <div class="section-title">Détail des Rôles et Permissions</div>
            
            @foreach($roles as $role)
            <div class="role-card">
                <div class="role-header">
                    <span class="role-name">{{ $role['name'] }}</span>
                    @if($role['is_system'])
                        <span class="badge badge-system" style="margin-left: 10px;">Système</span>
                    @endif
                    <div class="role-meta">
                        {{ $role['description'] }} • {{ $role['permissions_count'] }} permissions • {{ $role['users_count'] }} utilisateur(s)
                    </div>
                </div>
                <div class="role-body">
                    <table style="margin-bottom: 0;">
                        <thead>
                            <tr>
                                <th style="width: 20%;">Module</th>
                                <th>Permissions accordées</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($permissions_by_module as $module)
                            @php
                                $modulePerms = collect($role['permissions'])->filter(function($p) use ($module) {
                                    return str_starts_with($p, $module['module'] . '.');
                                });
                            @endphp
                            <tr>
                                <td style="font-weight: bold;">{{ $module['label'] }}</td>
                                <td>
                                    @if($modulePerms->count() > 0)
                                        @foreach($modulePerms as $perm)
                                            @php
                                                $action = explode('.', $perm)[1] ?? $perm;
                                                $actionLabels = ['voir' => 'Voir', 'creer' => 'Créer', 'modifier' => 'Modifier', 'supprimer' => 'Supprimer'];
                                            @endphp
                                            <span class="badge badge-success" style="margin: 1px;">
                                                {{ $actionLabels[$action] ?? ucfirst($action) }}
                                            </span>
                                        @endforeach
                                    @else
                                        <span style="color: #9ca3af; font-style: italic;">Aucun accès</span>
                                    @endif
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>

                    @if(count($role['users']) > 0)
                    <div class="users-section">
                        <div class="users-title">Utilisateurs assignés ({{ count($role['users']) }})</div>
                        @foreach($role['users'] as $user)
                            <span class="user-item {{ !$user['actif'] ? 'user-inactive' : '' }}">
                                {{ $user['name'] }} ({{ $user['email'] }})
                                @if(!$user['actif']) - Inactif @endif
                            </span>
                        @endforeach
                    </div>
                    @endif
                </div>
            </div>
            @endforeach
        </div>

        <!-- Permissions Matrix -->
        <div class="section">
            <div class="section-title">Matrice des Permissions par Module</div>
            <table>
                <thead>
                    <tr>
                        <th>Module</th>
                        <th style="text-align: center;">Voir</th>
                        <th style="text-align: center;">Créer</th>
                        <th style="text-align: center;">Modifier</th>
                        <th style="text-align: center;">Supprimer</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($permissions_by_module as $module)
                    <tr>
                        <td style="font-weight: bold;">{{ $module['label'] }}</td>
                        @foreach(['voir', 'creer', 'modifier', 'supprimer'] as $action)
                            @php
                                $exists = collect($module['permissions'])->contains(function($p) use ($action) {
                                    return $p['action'] === $action;
                                });
                            @endphp
                            <td style="text-align: center;">
                                @if($exists)
                                    <span style="color: #22c55e;">✓</span>
                                @else
                                    <span style="color: #ef4444;">✗</span>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Ce document est confidentiel et destiné à un usage interne uniquement.</p>
            <p>Généré automatiquement par le système de gestion - {{ $generated_at }}</p>
        </div>
    </div>
</body>
</html>
