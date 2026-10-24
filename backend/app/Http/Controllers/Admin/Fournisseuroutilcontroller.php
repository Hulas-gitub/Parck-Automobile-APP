<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MailStockFaible;
use App\Models\JournalAudit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

/**
 * FournisseurOutilController : page « Fournisseurs & Inventaire »
 *
 * Fournisseurs, Outils (avec quantite_stock), Problèmes d'outils
 * (les méthodes sur les pièces détachées sont conservées pour ne pas casser les routes existantes)
 *
 * Même style que VehiculesController : DB::table() + JournalAudit::tracer()
 * explicite (le trait Auditable ne marche qu'avec Eloquent, donc inutile ici).
 *
 * STOCK PIÈCES
 *  Sorties pour intervention : gérées par les TRIGGERS (prelevements_pieces).
 *  Entrées / corrections     : écrites ici dans mouvements_stock.
 *
 * ALERTE STOCK FAIBLE
 *  Le trigger trg_notif_stock_faible (migration) crée la notification et les
 *  lignes envois_notifications ; envoyerAlertesEnAttente() expédie les emails.
 */
class FournisseurOutilController extends Controller
{
    private const CATEGORIE_STOCK = 'alerte_stock_faible';

    /** Colonnes techniques : jamais écrites dans le journal d'audit */
    private const COLONNES_TECH = ['est_supprime', 'date_suppression', 'date_creation', 'date_modification'];

    // =========================================================================
    // HELPERS : AUDIT / ACCÈS DONNÉES
    // =========================================================================

    private function userId(): ?int
    {
        $user = auth()->user();
        if (!$user) return null;
        foreach (['id', 'user_id', 'utilisateur_id'] as $prop) {
            if (isset($user->{$prop})) return (int) $user->{$prop};
        }
        return null;
    }

    private function snap(?object $row): ?array
    {
        return $row ? Arr::except((array) $row, self::COLONNES_TECH) : null;
    }

    /** Ligne non supprimée ou 404. */
    private function trouver(string $table, int $id): object
    {
        $row = DB::table($table)->where('id', $id)->where('est_supprime', 0)->first();
        abort_if(!$row, 404, 'Élément introuvable.');
        return $row;
    }

    private function auditCreate(string $table, object $row, string $libelle): void
    {
        JournalAudit::tracer($this->userId(), 'CREATE', $table, (string) $row->id, null, $this->snap($row), $libelle);
    }

    /** Ne trace que les champs réellement modifiés ; rien si aucun changement. */
    private function auditUpdate(string $table, object $avant, object $apres, string $libelle): void
    {
        $a = $this->snap($avant);
        $champs = [];
        $anciens = [];

        foreach ($this->snap($apres) as $k => $v) {
            if ((string) ($a[$k] ?? '') !== (string) $v) {
                $champs[$k]  = $v;
                $anciens[$k] = $a[$k] ?? null;
            }
        }
        if (!$champs) return;

        JournalAudit::tracer($this->userId(), 'UPDATE', $table, (string) $apres->id, $anciens, $champs, $libelle);
    }

    private function auditDelete(string $table, object $avant, string $libelle): void
    {
        JournalAudit::tracer($this->userId(), 'DELETE', $table, (string) $avant->id, $this->snap($avant), null, $libelle);
    }

    /** Suppression logique (date_modification se met à jour toute seule en base). */
    private function supprimer(string $table, int $id): void
    {
        DB::table($table)->where('id', $id)->update(['est_supprime' => 1, 'date_suppression' => now()]);
    }

    // =========================================================================
    // 1. FOURNISSEURS
    // =========================================================================

    private function fournisseurRules(): array
    {
        return [
            'nom'       => 'required|string|max:200',
            'contact'   => 'nullable|string|max:150',
            'telephone' => 'nullable|string|max:50',
            'email'     => 'nullable|email|max:150',
            'type'      => ['required', Rule::in(['pieces', 'carburant', 'assurance', 'autre'])],
            'adresse'   => 'nullable|string',
            'est_actif' => 'sometimes|boolean',
        ];
    }

    private function fmtFournisseur(object $f): array
    {
        return Arr::except((array) $f, ['est_supprime', 'date_suppression']);
    }

    public function fournisseurs(): JsonResponse
    {
        $rows = DB::table('fournisseurs')->where('est_supprime', 0)->orderBy('nom')->get()
            ->map(fn ($f) => ['est_actif' => (bool) $f->est_actif] + $this->fmtFournisseur($f));

        return response()->json(['data' => $rows]);
    }

    public function fournisseurStore(Request $request): JsonResponse
    {
        $id  = DB::table('fournisseurs')->insertGetId($request->validate($this->fournisseurRules()));
        $row = DB::table('fournisseurs')->find($id);

        $this->auditCreate('fournisseurs', $row, "Ajout du fournisseur « {$row->nom} »");

        return response()->json(['data' => ['est_actif' => (bool) $row->est_actif] + $this->fmtFournisseur($row)], 201);
    }

    public function fournisseurUpdate(Request $request, int $id): JsonResponse
    {
        $avant = $this->trouver('fournisseurs', $id);

        DB::table('fournisseurs')->where('id', $id)->update($request->validate($this->fournisseurRules()));
        $apres = DB::table('fournisseurs')->find($id);

        $this->auditUpdate('fournisseurs', $avant, $apres, "Modification du fournisseur « {$apres->nom} »");

        return response()->json(['data' => ['est_actif' => (bool) $apres->est_actif] + $this->fmtFournisseur($apres)]);
    }

    public function fournisseurToggle(int $id): JsonResponse
    {
        $avant = $this->trouver('fournisseurs', $id);

        DB::table('fournisseurs')->where('id', $id)->update(['est_actif' => $avant->est_actif ? 0 : 1]);
        $apres = DB::table('fournisseurs')->find($id);

        $this->auditUpdate('fournisseurs', $avant, $apres,
            ($apres->est_actif ? 'Activation' : 'Désactivation') . " du fournisseur « {$apres->nom} »");

        return response()->json(['data' => ['est_actif' => (bool) $apres->est_actif] + $this->fmtFournisseur($apres)]);
    }

    public function fournisseurDestroy(int $id): JsonResponse
    {
        $avant = $this->trouver('fournisseurs', $id);

        $lie = DB::table('pieces_detachees')
            ->where('fournisseur_id', $id)->where('est_supprime', 0)->where('est_actif', 1)->exists();
        if ($lie) {
            return response()->json([
                'message' => 'Ce fournisseur est lié à des pièces actives. Désactivez-le ou réaffectez les pièces avant de le supprimer.',
            ], 409);
        }

        $this->supprimer('fournisseurs', $id);
        $this->auditDelete('fournisseurs', $avant, "Suppression du fournisseur « {$avant->nom} »");

        return response()->json(['message' => 'Fournisseur supprimé.']);
    }

    // =========================================================================
    // 2. OUTILS (avec quantité en stock)
    // =========================================================================

    private function outilRules(): array
    {
        return [
            'nom'                   => 'required|string|max:200',
            'type'                  => 'nullable|string|max:100',
            'categorie'             => 'nullable|string|max:100',
            'quantite_stock'        => 'required|integer|min:0',
            'etat'                  => ['required', Rule::in(['OK', 'Maintenance', 'Hors service', 'defaut'])],
            'emplacement'           => 'nullable|string|max:150',
            'date_dernier_controle' => 'nullable|date',
            'notes'                 => 'nullable|string',
        ];
    }

    private function fmtOutil(object $o): array
    {
        $a = Arr::except((array) $o, ['est_supprime', 'date_suppression']);
        $a['quantite_stock'] = (int) ($o->quantite_stock ?? 0);
        return $a;
    }

    public function outils(): JsonResponse
    {
        $rows = DB::table('outils')->where('est_supprime', 0)->orderBy('nom')->get()
            ->map(fn ($o) => $this->fmtOutil($o));

        return response()->json(['data' => $rows]);
    }

    public function outilStore(Request $request): JsonResponse
    {
        $id  = DB::table('outils')->insertGetId($request->validate($this->outilRules()));
        $row = DB::table('outils')->find($id);

        $this->auditCreate('outils', $row, "Ajout de l'outil « {$row->nom} » (quantité en stock : {$row->quantite_stock})");

        return response()->json(['data' => $this->fmtOutil($row)], 201);
    }

    public function outilUpdate(Request $request, int $id): JsonResponse
    {
        $avant = $this->trouver('outils', $id);

        DB::table('outils')->where('id', $id)->update($request->validate($this->outilRules()));
        $apres = DB::table('outils')->find($id);

        if ($avant->etat !== $apres->etat) {
            $libelle = "Changement d'état de l'outil « {$apres->nom} » : {$avant->etat} → {$apres->etat}";
        } elseif ((int) $avant->quantite_stock !== (int) $apres->quantite_stock) {
            $libelle = "Variation du stock de l'outil « {$apres->nom} » : {$avant->quantite_stock} → {$apres->quantite_stock}";
        } else {
            $libelle = "Modification de l'outil « {$apres->nom} »";
        }

        $this->auditUpdate('outils', $avant, $apres, $libelle);

        return response()->json(['data' => $this->fmtOutil($apres)]);
    }

    public function outilDestroy(int $id): JsonResponse
    {
        $avant = $this->trouver('outils', $id);

        $this->supprimer('outils', $id);
        $this->auditDelete('outils', $avant, "Suppression de l'outil « {$avant->nom} »");

        return response()->json(['message' => 'Outil supprimé.']);
    }

    // =========================================================================
    // 3. PIÈCES DÉTACHÉES (plus affichées dans la page, conservées côté API)
    // =========================================================================

    private function pieceRules(?int $id = null): array
    {
        return [
            'sku'            => ['nullable', 'string', 'max:100',
                                 Rule::unique('pieces_detachees', 'sku')->where('est_supprime', 0)->ignore($id)],
            'nom'            => 'required|string|max:200',
            'type_piece'     => 'nullable|string|max:100',
            'description'    => 'nullable|string',
            'quantite_stock' => 'required|numeric|min:0',
            'seuil_alerte'   => 'required|numeric|min:0',
            'unite'          => 'required|string|max:50',
            'prix_unitaire'  => 'required|numeric|min:0',
            'fournisseur_id' => ['nullable', Rule::exists('fournisseurs', 'id')->where('est_supprime', 0)],
            'emplacement'    => 'nullable|string|max:150',
            'est_actif'      => 'sometimes|boolean',
        ];
    }

    private function piecesQuery()
    {
        return DB::table('pieces_detachees as p')
            ->leftJoin('fournisseurs as f', 'f.id', '=', 'p.fournisseur_id')
            ->where('p.est_supprime', 0)
            ->select('p.*', 'f.nom as fournisseur_nom', 'f.telephone as fournisseur_telephone', 'f.email as fournisseur_email');
    }

    private function fmtPiece(object $p): array
    {
        return Arr::except((array) $p, ['est_supprime', 'date_suppression']);
    }

    private function pieceFormatee(object $p): array
    {
        $a = $this->fmtPiece($p);
        $a['quantite_stock'] = (float) $p->quantite_stock;
        $a['seuil_alerte']   = (float) $p->seuil_alerte;
        $a['prix_unitaire']  = (float) $p->prix_unitaire;
        $a['est_actif']      = (bool) $p->est_actif;
        $a['en_alerte']      = (float) $p->quantite_stock <= (float) $p->seuil_alerte;
        return $a;
    }

    private function mouvement(array $data): void
    {
        DB::table('mouvements_stock')->insert($data + [
            'effectue_par_user_id' => $this->userId(),
            'date_creation'        => now(),
        ]);
    }

    public function pieces(): JsonResponse
    {
        $rows = $this->piecesQuery()->orderBy('p.nom')->get()->map(fn ($p) => $this->pieceFormatee($p));

        return response()->json(['data' => $rows]);
    }

    public function pieceStore(Request $request): JsonResponse
    {
        $data = $request->validate($this->pieceRules());

        $id = DB::transaction(function () use ($data) {
            $id = DB::table('pieces_detachees')->insertGetId($data);

            if ((float) $data['quantite_stock'] > 0) {
                $this->mouvement([
                    'piece_id'       => $id,
                    'type_mouvement' => 'entree',
                    'quantite'       => $data['quantite_stock'],
                    'prix_unitaire'  => $data['prix_unitaire'],
                    'type_reference' => 'stock_initial',
                    'reference_id'   => $id,
                    'fournisseur_id' => $data['fournisseur_id'] ?? null,
                    'notes'          => 'Stock initial à la création de la fiche',
                ]);
            }
            return $id;
        });

        $row = DB::table('pieces_detachees')->find($id);
        $this->auditCreate('pieces_detachees', $row,
            "Ajout de la pièce « {$row->nom} » (stock initial : " . (float) $row->quantite_stock . " {$row->unite})");

        return response()->json(['data' => $this->pieceFormatee($this->piecesQuery()->where('p.id', $id)->first())], 201);
    }

    public function pieceUpdate(Request $request, int $id): JsonResponse
    {
        $data = $request->validate($this->pieceRules($id));

        [$avant, $apres] = DB::transaction(function () use ($data, $id) {
            $avant = DB::table('pieces_detachees')
                ->where('id', $id)->where('est_supprime', 0)->lockForUpdate()->first();
            abort_if(!$avant, 404, 'Pièce introuvable.');

            // L'UPDATE déclenche trg_notif_stock_faible si le seuil est franchi.
            DB::table('pieces_detachees')->where('id', $id)->update($data);
            $apres = DB::table('pieces_detachees')->find($id);

            $delta = round((float) $apres->quantite_stock - (float) $avant->quantite_stock, 2);
            if ($delta != 0.0) {
                $this->mouvement([
                    'piece_id'       => $id,
                    'type_mouvement' => 'ajustement',
                    'quantite'       => $delta, // signée
                    'prix_unitaire'  => $apres->prix_unitaire,
                    'type_reference' => 'ajustement_manuel',
                    'reference_id'   => $id,
                    'notes'          => "Correction manuelle du stock ({$avant->quantite_stock} → {$apres->quantite_stock})",
                ]);
            }
            return [$avant, $apres];
        });

        $this->auditUpdate('pieces_detachees', $avant, $apres,
            (float) $avant->quantite_stock !== (float) $apres->quantite_stock
                ? "Variation du stock de « {$apres->nom} » : " . (float) $avant->quantite_stock . ' → ' . (float) $apres->quantite_stock . " {$apres->unite}"
                : "Modification de la pièce « {$apres->nom} »");

        // Le stock a pu passer sous le seuil : on expédie les mails tout de suite (après commit).
        $this->declencherAlertesStock();

        return response()->json(['data' => $this->pieceFormatee($this->piecesQuery()->where('p.id', $id)->first())]);
    }

    /** Réapprovisionnement : entrée de stock liée à un fournisseur. */
    public function pieceEntree(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'quantite'        => 'required|numeric|gt:0',
            'prix_unitaire'   => 'nullable|numeric|min:0',
            'fournisseur_id'  => ['nullable', Rule::exists('fournisseurs', 'id')->where('est_supprime', 0)],
            'notes'           => 'nullable|string',
            'chemin_document' => 'nullable|string|max:255',
        ]);

        [$avant, $apres] = DB::transaction(function () use ($data, $id) {
            $avant = DB::table('pieces_detachees')
                ->where('id', $id)->where('est_supprime', 0)->lockForUpdate()->first();
            abort_if(!$avant, 404, 'Pièce introuvable.');

            DB::table('pieces_detachees')->where('id', $id)->update([
                'quantite_stock' => round((float) $avant->quantite_stock + (float) $data['quantite'], 2),
            ]);

            $this->mouvement([
                'piece_id'        => $id,
                'type_mouvement'  => 'entree',
                'quantite'        => $data['quantite'],
                'prix_unitaire'   => $data['prix_unitaire'] ?? $avant->prix_unitaire,
                'type_reference'  => 'reapprovisionnement',
                'reference_id'    => $id,
                'fournisseur_id'  => $data['fournisseur_id'] ?? $avant->fournisseur_id,
                'notes'           => $data['notes'] ?? null,
                'chemin_document' => $data['chemin_document'] ?? null,
            ]);

            return [$avant, DB::table('pieces_detachees')->find($id)];
        });

        $this->auditUpdate('pieces_detachees', $avant, $apres,
            "Réapprovisionnement de « {$apres->nom} » : +" . (float) $data['quantite'] . " {$apres->unite}");

        return response()->json(['data' => $this->pieceFormatee($this->piecesQuery()->where('p.id', $id)->first())]);
    }

    /** Historique (lecture seule) des mouvements d'une pièce. */
    public function pieceMouvements(int $id): JsonResponse
    {
        $this->trouver('pieces_detachees', $id);

        $rows = DB::table('mouvements_stock as m')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'm.effectue_par_user_id')
            ->leftJoin('fournisseurs as f', 'f.id', '=', 'm.fournisseur_id')
            ->where('m.piece_id', $id)
            ->orderByDesc('m.date_creation')->orderByDesc('m.id')
            ->limit(100)
            ->select('m.*', 'u.nom as effectue_par', 'f.nom as fournisseur_nom')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function pieceToggle(int $id): JsonResponse
    {
        $avant = $this->trouver('pieces_detachees', $id);

        DB::table('pieces_detachees')->where('id', $id)->update(['est_actif' => $avant->est_actif ? 0 : 1]);
        $apres = DB::table('pieces_detachees')->find($id);

        $this->auditUpdate('pieces_detachees', $avant, $apres,
            ($apres->est_actif ? 'Activation' : 'Désactivation') . " de la pièce « {$apres->nom} »");

        return response()->json(['data' => $this->pieceFormatee($this->piecesQuery()->where('p.id', $id)->first())]);
    }

    public function pieceDestroy(int $id): JsonResponse
    {
        $avant = $this->trouver('pieces_detachees', $id);

        $this->supprimer('pieces_detachees', $id);
        $this->auditDelete('pieces_detachees', $avant, "Suppression de la pièce « {$avant->nom} »");

        return response()->json(['message' => 'Pièce supprimée.']);
    }

    // =========================================================================
    // 4. PROBLÈMES D'OUTILS (table sans date_creation / date_modification)
    // =========================================================================

    private function problemeRules(): array
    {
        return [
            'outil_id'             => ['required', Rule::exists('outils', 'id')->where('est_supprime', 0)],
            'description_probleme' => 'required|string',
            'statut'               => ['sometimes', Rule::in(['signale', 'en_cours', 'resolu'])],
            'date_signalement'     => 'nullable|date',
            'date_resolution'      => 'nullable|date',
            'notes_resolution'     => 'nullable|string',
        ];
    }

    private function problemesQuery()
    {
        return DB::table('problemes_outils as p')
            ->join('outils as o', function ($j) {
                $j->on('o.id', '=', 'p.outil_id')->where('o.est_supprime', 0);
            })
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'p.signale_par_user_id')
            ->where('p.est_supprime', 0)
            ->select('p.*', 'o.nom as outil_nom', 'u.nom as signale_par');
    }

    private function fmtProbleme(object $p): array
    {
        $a = Arr::except((array) $p, ['est_supprime', 'date_suppression']);
        $a['photos'] = $p->photos ? json_decode($p->photos, true) : null;
        return $a;
    }

    /** « 2026-03-01T14:00 » (datetime-local) devient « 2026-03-01 14:00:00 » */
    private function dt($v): ?string
    {
        return $v ? Carbon::parse($v)->format('Y-m-d H:i:s') : null;
    }

    private function nomOutil(int $outilId): string
    {
        return DB::table('outils')->where('id', $outilId)->value('nom') ?? "#{$outilId}";
    }

    /**
     * Garde outils.etat cohérent avec les problèmes ouverts :
     *   problème ouvert : OK → defaut     |     plus aucun : defaut → OK
     * (« Maintenance » / « Hors service » posés à la main ne sont jamais touchés.)
     */
    private function syncEtatOutil(int $outilId): void
    {
        $avant = DB::table('outils')->where('id', $outilId)->where('est_supprime', 0)->first();
        if (!$avant) return;

        $ouverts = DB::table('problemes_outils')
            ->where('outil_id', $outilId)->where('est_supprime', 0)->where('statut', '!=', 'resolu')->exists();

        $nouvel = null;
        if ($ouverts && $avant->etat === 'OK')          $nouvel = 'defaut';
        elseif (!$ouverts && $avant->etat === 'defaut') $nouvel = 'OK';
        if (!$nouvel) return;

        DB::table('outils')->where('id', $outilId)->update(['etat' => $nouvel]);
        $apres = DB::table('outils')->find($outilId);

        $this->auditUpdate('outils', $avant, $apres,
            "Changement d'état de l'outil « {$apres->nom} » : {$avant->etat} → {$apres->etat}");
    }

    public function problemes(): JsonResponse
    {
        $rows = $this->problemesQuery()->orderByDesc('p.date_signalement')->get()
            ->map(fn ($p) => $this->fmtProbleme($p));

        return response()->json(['data' => $rows]);
    }

    public function problemeStore(Request $request): JsonResponse
    {
        $data = $request->validate($this->problemeRules());

        $data['signale_par_user_id'] = $this->userId();
        $data['statut']              = $data['statut'] ?? 'signale';
        $data['date_signalement']    = $this->dt($data['date_signalement'] ?? null) ?? now()->format('Y-m-d H:i:s');
        $data['date_resolution']     = $this->dt($data['date_resolution'] ?? null);
        if ($data['statut'] === 'resolu') {
            $data['date_resolution'] = $data['date_resolution'] ?? now()->format('Y-m-d H:i:s');
        }

        $id = DB::transaction(function () use ($data) {
            $id = DB::table('problemes_outils')->insertGetId($data);
            $this->syncEtatOutil((int) $data['outil_id']);
            return $id;
        });

        $row = DB::table('problemes_outils')->find($id);
        $this->auditCreate('problemes_outils', $row, "Signalement d'un problème sur l'outil « {$this->nomOutil($row->outil_id)} »");

        return response()->json(['data' => $this->fmtProbleme($this->problemesQuery()->where('p.id', $id)->first())], 201);
    }

    public function problemeUpdate(Request $request, int $id): JsonResponse
    {
        $data  = $request->validate($this->problemeRules());
        $avant = $this->trouver('problemes_outils', $id);

        $data['date_signalement'] = $this->dt($data['date_signalement'] ?? null) ?? $avant->date_signalement;

        if (($data['statut'] ?? $avant->statut) === 'resolu') {
            $data['date_resolution'] = $this->dt($data['date_resolution'] ?? null)
                ?? $avant->date_resolution ?? now()->format('Y-m-d H:i:s');
        } else {
            $data['date_resolution'] = null;
        }

        DB::transaction(function () use ($id, $data, $avant) {
            DB::table('problemes_outils')->where('id', $id)->update($data);
            $this->syncEtatOutil((int) $avant->outil_id);
            if ((int) $data['outil_id'] !== (int) $avant->outil_id) {
                $this->syncEtatOutil((int) $data['outil_id']);
            }
        });

        $apres = DB::table('problemes_outils')->find($id);
        $outil = $this->nomOutil($apres->outil_id);
        $this->auditUpdate('problemes_outils', $avant, $apres, $avant->statut !== $apres->statut
            ? "Problème de l'outil « {$outil} » : {$avant->statut} → {$apres->statut}"
            : "Modification d'un problème de l'outil « {$outil} »");

        return response()->json(['data' => $this->fmtProbleme($this->problemesQuery()->where('p.id', $id)->first())]);
    }

    public function problemePrendreEnCharge(int $id): JsonResponse
    {
        $avant = $this->trouver('problemes_outils', $id);

        DB::table('problemes_outils')->where('id', $id)->update(['statut' => 'en_cours']);
        $apres = DB::table('problemes_outils')->find($id);

        $this->auditUpdate('problemes_outils', $avant, $apres,
            "Problème de l'outil « {$this->nomOutil($apres->outil_id)} » : {$avant->statut} → en_cours");

        return response()->json(['data' => $this->fmtProbleme($this->problemesQuery()->where('p.id', $id)->first())]);
    }

    public function problemeResoudre(Request $request, int $id): JsonResponse
    {
        $data  = $request->validate(['notes_resolution' => 'nullable|string']);
        $avant = $this->trouver('problemes_outils', $id);

        DB::transaction(function () use ($id, $data, $avant) {
            DB::table('problemes_outils')->where('id', $id)->update([
                'statut'           => 'resolu',
                'date_resolution'  => now(),
                'notes_resolution' => $data['notes_resolution'] ?? null,
            ]);
            $this->syncEtatOutil((int) $avant->outil_id);
        });

        $apres = DB::table('problemes_outils')->find($id);
        $this->auditUpdate('problemes_outils', $avant, $apres,
            "Résolution du problème de l'outil « {$this->nomOutil($apres->outil_id)} »");

        return response()->json(['data' => $this->fmtProbleme($this->problemesQuery()->where('p.id', $id)->first())]);
    }

    public function problemeDestroy(int $id): JsonResponse
    {
        $avant = $this->trouver('problemes_outils', $id);

        DB::transaction(function () use ($id, $avant) {
            DB::table('problemes_outils')->where('id', $id)->update(['est_supprime' => 1, 'date_suppression' => now()]);
            $this->syncEtatOutil((int) $avant->outil_id);
        });

        $this->auditDelete('problemes_outils', $avant,
            "Suppression d'un problème signalé sur l'outil « {$this->nomOutil($avant->outil_id)} »");

        return response()->json(['message' => 'Problème supprimé.']);
    }

    // =========================================================================
    // 5. ALERTES STOCK FAIBLE : ENVOI DES EMAILS
    //    (la détection est faite par le trigger, voir la migration)
    // =========================================================================

    /** GET /admin/inventaire/stock/envoyer-alertes */
    public function envoyerAlertesStock(): JsonResponse
    {
        @set_time_limit(300);

        return response()->json([
            'message' => 'Envoi des alertes de stock terminé.',
            'summary' => $this->envoyerAlertesEnAttente(),
        ]);
    }

    /** Appel immédiat qui ne doit jamais faire échouer la requête principale. */
    private function declencherAlertesStock(): void
    {
        try {
            $this->envoyerAlertesEnAttente();
        } catch (\Throwable $e) {
            Log::error('[StockAlerte] envoi immédiat impossible : ' . $e->getMessage());
        }
    }

    /**
     * Expédie les emails 'en_attente' (et les 'echec' des dernières 24 h).
     * Public : utilisable par le scheduler :
     *   app(\App\Http\Controllers\Admin\FournisseurOutilController::class)->envoyerAlertesEnAttente();
     *
     * @return array{emails_envoyes:int, ignores:int, deja_pris:int, erreurs:int}
     */
    public function envoyerAlertesEnAttente(): array
    {
        $stats = ['emails_envoyes' => 0, 'ignores' => 0, 'deja_pris' => 0, 'erreurs' => 0];

        $lignes = DB::table('envois_notifications as e')
            ->join('notifications as n', 'n.id', '=', 'e.notification_id')
            ->join('categories_notifications as c', 'c.id', '=', 'n.categorie_id')
            ->join('utilisateurs as u', 'u.id', '=', 'e.user_id')
            ->join('roles as r', 'r.id', '=', 'u.role_id')
            ->where('c.code', self::CATEGORIE_STOCK)
            ->where('e.canal', 'email')
            ->where('e.date_creation', '>=', now()->subDay())
            ->where(function ($q) {
                $q->whereIn('e.statut_envoi', ['en_attente', 'echec'])
                  // envoi resté bloqué (process interrompu) depuis plus de 10 min
                  ->orWhere(fn ($q2) => $q2->where('e.statut_envoi', 'en_cours_envoi')
                                           ->where('e.date_modification', '<', now()->subMinutes(10)));
            })
            ->where('u.est_actif', 1)->where('u.est_supprime', 0)
            ->whereNotNull('u.email')
            ->select('e.id as envoi_id', 'n.donnees', 'u.nom', 'u.email', 'r.libelle as role_libelle')
            ->orderBy('e.id')->limit(200)->get();

        foreach ($lignes as $l) {
            // Réservation atomique : deux appels simultanés n'envoient pas deux fois.
            $pris = DB::table('envois_notifications')
                ->where('id', $l->envoi_id)
                ->whereIn('statut_envoi', ['en_attente', 'echec', 'en_cours_envoi'])
                ->update(['statut_envoi' => 'en_cours_envoi', 'date_modification' => now()]);

            if (!$pris) { $stats['deja_pris']++; continue; }

            try {
                $donnees = json_decode($l->donnees ?? '{}', true) ?: [];
                $piece   = $this->piecesQuery()->where('p.id', (int) ($donnees['piece_id'] ?? 0))->first();

                if (!$piece) {
                    $this->marquerEnvoi($l->envoi_id, 'annule', 'Pièce supprimée.');
                    $stats['ignores']++;
                    continue;
                }

                // Réapprovisionnée entre-temps : un mail « stock faible » serait faux.
                if ((float) $piece->quantite_stock > (float) $piece->seuil_alerte) {
                    $this->marquerEnvoi($l->envoi_id, 'annule', 'Stock reconstitué avant envoi.');
                    $stats['ignores']++;
                    continue;
                }

                Mail::to($l->email)->send(new MailStockFaible(
                    piece: [
                        'nom'                   => $piece->nom,
                        'sku'                   => $piece->sku,
                        'type_piece'            => $piece->type_piece,
                        'quantite'              => (float) $piece->quantite_stock,
                        'seuil'                 => (float) $piece->seuil_alerte,
                        'unite'                 => $piece->unite,
                        'prix_unitaire'         => (float) $piece->prix_unitaire,
                        'emplacement'           => $piece->emplacement,
                        'fournisseur'           => $piece->fournisseur_nom,
                        'fournisseur_telephone' => $piece->fournisseur_telephone,
                        'fournisseur_email'     => $piece->fournisseur_email,
                    ],
                    destinataire: ['nom' => $l->nom, 'role_libelle' => $l->role_libelle],
                    rupture: (float) $piece->quantite_stock <= 0,
                ));

                $this->marquerEnvoi($l->envoi_id, 'envoye');
                $stats['emails_envoyes']++;

            } catch (\Throwable $e) {
                $this->marquerEnvoi($l->envoi_id, 'echec', $e->getMessage()); // retenté au prochain passage
                $stats['erreurs']++;
                Log::error("[StockAlerte] échec {$l->email} | {$e->getMessage()}");
            }
        }

        if ($lignes->isNotEmpty()) Log::info('[StockAlerte] terminé', $stats);

        return $stats;
    }

    private function marquerEnvoi(int $envoiId, string $statut, ?string $erreur = null): void
    {
        DB::table('envois_notifications')->where('id', $envoiId)->update([
            'statut_envoi'      => $statut,
            'date_envoi'        => $statut === 'envoye' ? now() : null,
            'erreur'            => $erreur ? mb_substr($erreur, 0, 2000) : null,
            'date_modification' => now(),
        ]);
    }
}