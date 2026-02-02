-- ==============================================
-- Création utilisateur READ ONLY pour FAC
-- ==============================================
-- FAC utilise cet utilisateur pour lire les données OPS
-- Exécuter ce script en tant que root sur le serveur MySQL
-- ==============================================

-- Supprimer l'utilisateur s'il existe déjà
DROP USER IF EXISTS 'fac_reader'@'localhost';

-- Créer l'utilisateur avec un mot de passe sécurisé
-- IMPORTANT: Remplacer 'VOTRE_MOT_DE_PASSE_SECURISE' par un vrai mot de passe
CREATE USER 'fac_reader'@'localhost' IDENTIFIED BY 'VOTRE_MOT_DE_PASSE_SECURISE';

-- Accorder les droits SELECT uniquement sur la base OPS
GRANT SELECT ON logiwkuh_ops.* TO 'fac_reader'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier les droits
SHOW GRANTS FOR 'fac_reader'@'localhost';
