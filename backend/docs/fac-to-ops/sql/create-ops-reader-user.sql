-- =====================================================================
-- Utilisateur MySQL READ-ONLY pour l'app OPS
-- Lit la vue v_ops_independantes exposée par la DB Facturation (FAC).
-- À exécuter sur la base FAC en tant que root.
-- =====================================================================

DROP USER IF EXISTS 'ops_reader'@'localhost';

CREATE USER 'ops_reader'@'localhost'
    IDENTIFIED BY 'ChangeMoiMotDePasseFort!';

-- Lecture seule sur la vue dédiée uniquement
GRANT SELECT ON logiwkuh_fac.v_ops_independantes TO 'ops_reader'@'localhost';

FLUSH PRIVILEGES;

-- Vérification :
--   SHOW GRANTS FOR 'ops_reader'@'localhost';
