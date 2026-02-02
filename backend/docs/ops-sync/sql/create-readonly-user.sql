-- ============================================================
-- CRÉATION UTILISATEUR READ ONLY POUR OPS
-- ============================================================
-- Exécuter ce script en tant que root MySQL
-- sur le serveur logistiga.pro
-- ============================================================

-- 1. Créer l'utilisateur avec un mot de passe fort
CREATE USER IF NOT EXISTS 'ops_reader'@'localhost' 
    IDENTIFIED BY 'ChangezCeMotDePasse!Securise2024';

-- 2. Accorder uniquement les droits SELECT sur la base Facturation
-- IMPORTANT: Pas de INSERT, UPDATE, DELETE
GRANT SELECT ON facturation_db.clients TO 'ops_reader'@'localhost';
GRANT SELECT ON facturation_db.transitaires TO 'ops_reader'@'localhost';
GRANT SELECT ON facturation_db.armateurs TO 'ops_reader'@'localhost';
GRANT SELECT ON facturation_db.representants TO 'ops_reader'@'localhost';
GRANT SELECT ON facturation_db.services TO 'ops_reader'@'localhost';

-- Optionnel: si vous voulez synchroniser d'autres tables plus tard
-- GRANT SELECT ON facturation_db.* TO 'ops_reader'@'localhost';

-- 3. Appliquer les permissions
FLUSH PRIVILEGES;

-- 4. Vérifier les permissions accordées
SHOW GRANTS FOR 'ops_reader'@'localhost';

-- ============================================================
-- POUR RÉVOQUER L'ACCÈS (si nécessaire)
-- ============================================================
-- REVOKE ALL PRIVILEGES ON facturation_db.* FROM 'ops_reader'@'localhost';
-- DROP USER 'ops_reader'@'localhost';
-- FLUSH PRIVILEGES;
