<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * - Crée la catégorie 'alerte_stock_faible' si elle n'existe pas (sinon le trigger ne fait rien).
 * - Remplace trg_notif_stock_faible :
 *     * corrige le message (l'ancien contenait le texte littéral « , NEW.nom, » à cause des guillemets)
 *     * ajoute le canal EMAIL ('en_attente', expédié par StockAlerteController)
 *     * destinataires : admin + chef_parc (avant : chef_parc seulement, in_app seulement)
 *     * alerte aussi le passage à 0 (rupture), pas seulement le franchissement du seuil
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('categories_notifications')->insertOrIgnore([
            'code'              => 'alerte_stock_faible',
            'libelle'           => 'Alerte stock faible',
            'niveau_priorite'   => 'important',
            'canaux'            => json_encode(['email', 'in_app']),
            'roles_cibles'      => json_encode(['admin', 'chef_parc']),
            'description'       => 'Pièce détachée sous le seuil d\'alerte ou épuisée',
            'est_actif'         => 1,
            'est_supprime'      => 0,
            'date_creation'     => now(),
            'date_modification' => now(),
        ]);

        DB::unprepared('DROP TRIGGER IF EXISTS trg_notif_stock_faible');

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_notif_stock_faible AFTER UPDATE ON pieces_detachees FOR EACH ROW
BEGIN
  DECLARE cat_id INT;
  DECLARE notif_id BIGINT;

  IF NEW.est_supprime = 0 AND (
       (NEW.quantite_stock <= NEW.seuil_alerte AND OLD.quantite_stock > OLD.seuil_alerte)
    OR (NEW.quantite_stock <= 0 AND OLD.quantite_stock > 0)
  ) THEN

    SELECT id INTO cat_id
    FROM categories_notifications
    WHERE code = 'alerte_stock_faible' AND est_supprime = 0
    LIMIT 1;

    IF cat_id IS NOT NULL THEN
      INSERT INTO notifications (categorie_id, titre, message, donnees, lien_url, date_creation)
      VALUES (
        cat_id,
        IF(NEW.quantite_stock <= 0,
           CONCAT('Rupture de stock : ', NEW.nom),
           CONCAT('Stock faible : ', NEW.nom)),
        CONCAT('La pièce « ', NEW.nom, ' » est ',
               IF(NEW.quantite_stock <= 0, 'épuisée', 'sous son seuil d''alerte'),
               '. Stock actuel : ',
               TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM NEW.quantite_stock)), ' ', NEW.unite,
               ' (seuil : ',
               TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM NEW.seuil_alerte)), ').'),
        JSON_OBJECT('piece_id', NEW.id, 'quantite_stock', NEW.quantite_stock, 'seuil_alerte', NEW.seuil_alerte),
        '/admin/inventaire',
        NOW()
      );

      SET notif_id = LAST_INSERT_ID();

      -- in_app : visible tout de suite
      INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_envoi, date_creation)
      SELECT notif_id, u.id, 'in_app', 'envoye', NOW(), NOW()
      FROM utilisateurs u INNER JOIN roles r ON u.role_id = r.id
      WHERE r.code IN ('admin', 'chef_parc') AND u.est_actif = 1 AND u.est_supprime = 0;

      -- email : à expédier par StockAlerteController
      INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
      SELECT notif_id, u.id, 'email', 'en_attente', NOW()
      FROM utilisateurs u INNER JOIN roles r ON u.role_id = r.id
      WHERE r.code IN ('admin', 'chef_parc') AND u.est_actif = 1 AND u.est_supprime = 0;
    END IF;
  END IF;
END
SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_notif_stock_faible');

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_notif_stock_faible AFTER UPDATE ON pieces_detachees FOR EACH ROW
BEGIN
  DECLARE cat_id INT;
  DECLARE notif_id BIGINT;
  IF NEW.quantite_stock <= NEW.seuil_alerte AND OLD.quantite_stock > OLD.seuil_alerte AND NEW.est_supprime = 0 THEN
    SELECT id INTO cat_id FROM categories_notifications WHERE code = 'alerte_stock_faible' AND est_supprime = 0 LIMIT 1;
    IF cat_id IS NOT NULL THEN
      INSERT INTO notifications (categorie_id, titre, message, donnees, date_creation)
      VALUES (cat_id, CONCAT('Stock faible: ', NEW.nom),
              CONCAT('La pièce ', NEW.nom, ' a atteint le seuil d''alerte. Stock actuel: ', NEW.quantite_stock, ' ', NEW.unite),
              JSON_OBJECT('piece_id', NEW.id, 'quantite_stock', NEW.quantite_stock, 'seuil_alerte', NEW.seuil_alerte), NOW());
      SET notif_id = LAST_INSERT_ID();
      INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
      SELECT notif_id, u.id, 'in_app', 'en_attente', NOW()
      FROM utilisateurs u INNER JOIN roles r ON u.role_id = r.id
      WHERE r.code = 'chef_parc' AND u.est_actif = 1 AND u.est_supprime = 0;
    END IF;
  END IF;
END
SQL);
    }
};
