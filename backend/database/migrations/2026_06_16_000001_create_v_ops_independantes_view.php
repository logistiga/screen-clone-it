<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Vue de lecture FAC → OPS pour les Ordres de Travail
 * de catégorie "Opérations Indépendantes".
 *
 * L'app OPS lit cette vue (via l'utilisateur MySQL `ops_reader`)
 * pour afficher automatiquement les OT et permettre Ignorer / Valider.
 *
 * Flux unidirectionnel FAC → OPS (info one-way).
 * Aucune écriture de OPS vers FAC : la validation ne revient pas ici.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_ops_independantes');

        DB::statement(<<<'SQL'
            CREATE VIEW v_ops_independantes AS
            SELECT
                ot.id                          AS ordre_id,
                ot.numero                      AS ordre_numero,
                ot.created_at                  AS created_at,
                ot.updated_at                  AS updated_at,
                ot.statut                      AS statut,
                ot.categorie                   AS categorie,
                ot.type_operation_indep        AS type_operation_indep,
                ot.bl_numero                   AS bl_numero,
                ot.navire                      AS navire,
                ot.date_arrivee                AS date_arrivee,
                ot.notes                       AS notes,
                ot.montant_ht                  AS montant_ht,
                ot.montant_ttc                 AS montant_ttc,
                ot.client_id                   AS client_id,
                c.nom                          AS client_nom,
                c.ice                          AS client_ice,
                c.telephone                    AS client_telephone,
                c.email                        AS client_email,
                ot.armateur_id                 AS armateur_id,
                a.nom                          AS armateur_nom,
                ot.transitaire_id              AS transitaire_id,
                t.nom                          AS transitaire_nom,
                ot.representant_id             AS representant_id,
                r.nom                          AS representant_nom,
                (
                    SELECT COALESCE(
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id',            l.id,
                                'description',   l.description,
                                'lieu_depart',   l.lieu_depart,
                                'lieu_arrivee',  l.lieu_arrivee,
                                'date_debut',    l.date_debut,
                                'date_fin',      l.date_fin,
                                'quantite',      l.quantite,
                                'prix_unitaire', l.prix_unitaire,
                                'montant_ht',    l.montant_ht
                            )
                        ),
                        JSON_ARRAY()
                    )
                    FROM lignes_ordres l
                    WHERE l.ordre_id = ot.id
                )                              AS lignes
            FROM ordres_travail ot
            INNER JOIN clients      c ON c.id = ot.client_id
            LEFT  JOIN armateurs    a ON a.id = ot.armateur_id
            LEFT  JOIN transitaires t ON t.id = ot.transitaire_id
            LEFT  JOIN representants r ON r.id = ot.representant_id
            WHERE ot.categorie IN (
                'operations_independantes',
                'Independant',
                'independant',
                'divers',
                'DIVERS'
            )
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_ops_independantes');
    }
};
