<?php

/**
 * Configuration centrale des permissions RBAC
 * Source unique pour le seeding et la validation des permissions
 */

return [
    /**
     * Actions globales (disponibles pour la plupart des modules)
     */
    'global_actions' => [
        'voir' => ['label' => 'Voir', 'description' => 'Consulter les données'],
        'creer' => ['label' => 'Créer', 'description' => 'Créer de nouveaux éléments'],
        'modifier' => ['label' => 'Modifier', 'description' => 'Modifier les éléments existants'],
        'supprimer' => ['label' => 'Supprimer', 'description' => 'Supprimer des éléments'],
    ],

    /**
     * Actions spécifiques (contextuelles)
     */
    'specific_actions' => [
        'valider' => ['label' => 'Valider', 'description' => 'Valider/approuver'],
        'annuler' => ['label' => 'Annuler', 'description' => 'Annuler un élément'],
        'exporter' => ['label' => 'Exporter', 'description' => 'Exporter les données'],
        'importer' => ['label' => 'Importer', 'description' => 'Importer des données'],
        'imprimer' => ['label' => 'Imprimer', 'description' => 'Imprimer'],
        'envoyer' => ['label' => 'Envoyer', 'description' => 'Envoyer par email/WhatsApp'],
        'dupliquer' => ['label' => 'Dupliquer', 'description' => 'Dupliquer un élément'],
        'assigner' => ['label' => 'Assigner', 'description' => 'Assigner à un utilisateur'],
        'desassigner' => ['label' => 'Désassigner', 'description' => 'Retirer une assignation'],
        'cloturer' => ['label' => 'Clôturer', 'description' => 'Clôturer définitivement'],
        'reouvrir' => ['label' => 'Réouvrir', 'description' => 'Réouvrir un élément clôturé'],
        'approuver' => ['label' => 'Approuver', 'description' => 'Donner son approbation'],
        'rejeter' => ['label' => 'Rejeter', 'description' => 'Rejeter une demande'],
        'activer' => ['label' => 'Activer', 'description' => 'Activer un élément'],
        'desactiver' => ['label' => 'Désactiver', 'description' => 'Désactiver un élément'],
        'fusionner' => ['label' => 'Fusionner', 'description' => 'Fusionner des éléments'],
        'inventaire' => ['label' => 'Inventaire', 'description' => 'Gérer l\'inventaire'],
        'entree' => ['label' => 'Entrée stock', 'description' => 'Enregistrer une entrée de stock'],
        'sortie' => ['label' => 'Sortie stock', 'description' => 'Enregistrer une sortie de stock'],
        'assigner_role' => ['label' => 'Assigner rôle', 'description' => 'Assigner un rôle'],
        'convertir' => ['label' => 'Convertir', 'description' => 'Convertir en autre document'],
        'paiement' => ['label' => 'Paiement', 'description' => 'Enregistrer un paiement'],
        'telecharger' => ['label' => 'Télécharger', 'description' => 'Télécharger le document'],
    ],

    /**
     * Catégories de modules
     */
    'categories' => [
        'commercial' => 'Commercial',
        'finance' => 'Finance',
        'stock' => 'Stock & Produits',
        'administration' => 'Administration',
        'reporting' => 'Reporting & Sécurité',
    ],

    /**
     * Définition des modules avec leurs actions
     */
    'modules' => [
        // === COMMERCIAL ===
        'clients' => [
            'label' => 'Clients',
            'description' => 'Gestion des clients et prospects',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['exporter', 'importer', 'fusionner'],
        ],
        'devis' => [
            'label' => 'Devis',
            'description' => 'Création et suivi des devis',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['valider', 'annuler', 'dupliquer', 'exporter', 'imprimer', 'envoyer'],
        ],
        'ordres' => [
            'label' => 'Ordres de travail',
            'description' => 'Gestion des ordres de travail',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['valider', 'annuler', 'exporter', 'imprimer', 'envoyer', 'convertir', 'paiement', 'telecharger'],
        ],
        'factures' => [
            'label' => 'Factures',
            'description' => 'Facturation et suivi',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['valider', 'annuler', 'exporter', 'imprimer', 'envoyer'],
        ],
        'partenaires' => [
            'label' => 'Partenaires',
            'description' => 'Gestion des partenaires commerciaux',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['exporter'],
        ],
        'transitaires' => [
            'label' => 'Transitaires',
            'description' => 'Gestion des transitaires',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['exporter', 'assigner'],
        ],
        'transporteurs' => [
            'label' => 'Transporteurs',
            'description' => 'Gestion des transporteurs',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['exporter'],
        ],
        'fournisseurs' => [
            'label' => 'Fournisseurs',
            'description' => 'Gestion des fournisseurs',
            'category' => 'commercial',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['exporter', 'importer'],
        ],

        // === FINANCE ===
        'paiements' => [
            'label' => 'Paiements',
            'description' => 'Enregistrement des paiements',
            'category' => 'finance',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['valider', 'annuler', 'exporter'],
        ],
        'caisse' => [
            'label' => 'Caisse',
            'description' => 'Gestion de la caisse',
            'category' => 'finance',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['valider', 'annuler', 'exporter', 'cloturer'],
        ],
        'banques' => [
            'label' => 'Banques',
            'description' => 'Comptes bancaires et opérations',
            'category' => 'finance',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['exporter'],
        ],
        'credits' => [
            'label' => 'Crédits',
            'description' => 'Gestion des crédits clients',
            'category' => 'finance',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['valider', 'approuver', 'rejeter', 'exporter'],
        ],
        'notes' => [
            'label' => 'Notes de frais',
            'description' => 'Gestion des notes de frais',
            'category' => 'finance',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['valider', 'approuver', 'rejeter', 'exporter'],
        ],

        // === STOCK & PRODUITS ===
        'produits' => [
            'label' => 'Produits',
            'description' => 'Catalogue de produits',
            'category' => 'stock',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['exporter', 'importer', 'activer', 'desactiver'],
        ],
        'stocks' => [
            'label' => 'Stocks',
            'description' => 'Gestion des stocks',
            'category' => 'stock',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['entree', 'sortie', 'inventaire', 'exporter'],
        ],

        // === ADMINISTRATION ===
        'utilisateurs' => [
            'label' => 'Utilisateurs',
            'description' => 'Gestion des utilisateurs',
            'category' => 'administration',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['activer', 'desactiver', 'assigner_role', 'exporter'],
        ],
        'roles' => [
            'label' => 'Rôles',
            'description' => 'Gestion des rôles et permissions',
            'category' => 'administration',
            'global_actions' => ['voir', 'creer', 'modifier', 'supprimer'],
            'specific_actions' => ['assigner', 'dupliquer'],
        ],
        'configuration' => [
            'label' => 'Configuration',
            'description' => 'Paramètres de l\'application',
            'category' => 'administration',
            'global_actions' => ['voir', 'modifier'],
            'specific_actions' => ['exporter', 'importer'],
        ],

        // === REPORTING & SECURITE ===
        'reporting' => [
            'label' => 'Rapports',
            'description' => 'Tableaux de bord et rapports',
            'category' => 'reporting',
            'global_actions' => ['voir'],
            'specific_actions' => ['exporter', 'imprimer'],
        ],
        'dashboard' => [
            'label' => 'Dashboard',
            'description' => 'Tableau de bord principal',
            'category' => 'reporting',
            'global_actions' => ['voir'],
            'specific_actions' => ['exporter'],
        ],
        'audit' => [
            'label' => 'Audit',
            'description' => 'Journal d\'audit et traçabilité',
            'category' => 'reporting',
            'global_actions' => ['voir'],
            'specific_actions' => ['exporter'],
        ],
        'securite' => [
            'label' => 'Sécurité',
            'description' => 'Paramètres de sécurité',
            'category' => 'reporting',
            'global_actions' => ['voir', 'modifier'],
            'specific_actions' => ['exporter'],
        ],
        'exports' => [
            'label' => 'Exports',
            'description' => 'Gestion des exports de données',
            'category' => 'reporting',
            'global_actions' => ['voir', 'creer'],
            'specific_actions' => [],
        ],
    ],

    /**
     * Rôles prédéfinis avec leurs permissions
     */
    'predefined_roles' => [
        'administrateur' => [
            'label' => 'Administrateur',
            'description' => 'Accès complet à toutes les fonctionnalités',
            'permissions' => 'all',
        ],
        'directeur' => [
            'label' => 'Directeur',
            'description' => 'Accès complet avec supervision',
            'permissions' => 'all',
        ],
        'comptable' => [
            'label' => 'Comptable',
            'description' => 'Gestion financière et comptabilité',
            'permissions' => [
                'clients.voir',
                'devis.voir',
                'ordres.voir',
                'factures.voir', 'factures.creer', 'factures.modifier', 'factures.exporter', 'factures.imprimer',
                'paiements.voir', 'paiements.creer', 'paiements.valider', 'paiements.exporter',
                'caisse.voir', 'caisse.creer', 'caisse.exporter',
                'banques.voir', 'banques.exporter',
                'credits.voir', 'credits.creer', 'credits.exporter',
                'notes.voir', 'notes.creer', 'notes.valider', 'notes.exporter',
                'reporting.voir', 'reporting.exporter',
                'dashboard.voir',
            ],
        ],
        'caissier' => [
            'label' => 'Caissier',
            'description' => 'Gestion de la caisse et paiements',
            'permissions' => [
                'clients.voir',
                'factures.voir',
                'paiements.voir', 'paiements.creer',
                'caisse.voir', 'caisse.creer',
                'banques.voir',
            ],
        ],
        'commercial' => [
            'label' => 'Commercial',
            'description' => 'Gestion commerciale et relation client',
            'permissions' => [
                'clients.voir', 'clients.creer', 'clients.modifier', 'clients.exporter',
                'devis.voir', 'devis.creer', 'devis.modifier', 'devis.dupliquer', 'devis.exporter', 'devis.imprimer', 'devis.envoyer',
                'ordres.voir', 'ordres.creer',
                'factures.voir',
                'partenaires.voir',
                'transitaires.voir',
                'transporteurs.voir',
                'reporting.voir',
                'dashboard.voir',
            ],
        ],
        'operateur' => [
            'label' => 'Opérateur',
            'description' => 'Suivi des ordres et exécution',
            'permissions' => [
                'clients.voir',
                'ordres.voir', 'ordres.modifier',
                'factures.voir',
                'stocks.voir',
                'dashboard.voir',
            ],
        ],
    ],

    /**
     * Rôles système (ne peuvent pas être supprimés)
     */
    'system_roles' => ['administrateur', 'directeur'],
];
