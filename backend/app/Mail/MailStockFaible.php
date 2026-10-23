<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * MailStockFaible
 *
 * Mailable SGS — Alerte stock faible / rupture de stock d'une pièce détachée.
 * Même principe que MailDocumentChauffeur : template HTML intégré dans build()
 * via $this->html(), logo public/logo.png intégré (cid:) avec fallback SVG.
 *
 * Envoi synchrone (pas de ShouldQueue).
 *
 * Déclenchement : FournisseurOutilController::envoyerAlertesEnAttente()
 *   - le trigger SQL trg_notif_stock_faible crée les envois « en_attente »
 *   - le controller envoie un mail par destinataire (admin + chef de parc)
 *
 * Niveaux :
 *   rupture → stock à 0 (ou moins)                (rouge)
 *   faible  → stock sous le seuil d'alerte         (orange)
 *
 * Lien du bouton : config('app.frontend_url') + PAGE_INVENTAIRE (à adapter à ta route React).
 */
class MailStockFaible extends Mailable
{
    use Queueable, SerializesModels;

    /** Identifiant du logo intégré dans le mail : <img src="cid:logo-sgs"> */
    private const LOGO_CID = 'logo-sgs';

    /** Chemin de la page Fournisseurs & Inventaire dans le front React — À ADAPTER */
    private const PAGE_INVENTAIRE = '/Admin/Navigation/FournisseursOutils';

    public function __construct(
        public readonly array $piece,         // nom, sku, type_piece, quantite, seuil, unite, prix_unitaire, emplacement, fournisseur, fournisseur_telephone, fournisseur_email
        public readonly array $destinataire,  // { nom, role_libelle }
        public readonly bool  $rupture = false,
    ) {}

    private function niveau(): string
    {
        return $this->rupture ? 'rupture' : 'faible';
    }

    // =========================================================================
    // ENVELOPE — Sujet de l'email
    // =========================================================================

    public function envelope(): Envelope
    {
        [$emoji, $tag] = $this->rupture
            ? ['🔴', '[RUPTURE DE STOCK]']
            : ['🟠', '[STOCK FAIBLE]'];

        return new Envelope(
            subject: "{$emoji} {$tag} {$this->piece['nom']}",
        );
    }

    // =========================================================================
    // BUILD
    // =========================================================================

    public function build(): static
    {
        $logoPath = $this->findLogoPath();

        if ($logoPath !== null) {
            // Le logo voyage DANS le mail : Gmail bloque "data:base64" mais affiche "cid:".
            $this->withSymfonyMessage(function ($message) use ($logoPath) {
                $message->embedFromPath($logoPath, self::LOGO_CID, 'image/png');
            });
        }

        return $this->html($this->renderHtml($logoPath !== null));
    }

    // =========================================================================
    // RENDU HTML
    // =========================================================================

    private function renderHtml(bool $logoIntegre): string
    {
        // ── Palette couleurs selon le niveau ─────────────────────────────────
        $c = match ($this->niveau()) {
            'rupture' => [
                'accent'       => '#dc2626',
                'accentLight'  => '#fff5f5',
                'accentBorder' => '#fecaca',
                'tagBg'        => '#fee2e2',
                'tagText'      => '#991b1b',
                'label'        => 'RUPTURE DE STOCK',
                'badgeBg'      => '#fee2e2',
                'badgeBorder'  => '#fca5a5',
                'badgeText'    => '#991b1b',
                'dotColor'     => '#dc2626',
                'pillLabel'    => 'RUPTURE',
                'borderTop'    => '#dc2626',
            ],
            default => [
                'accent'       => '#ea580c',
                'accentLight'  => '#fff7ed',
                'accentBorder' => '#fed7aa',
                'tagBg'        => '#ffedd5',
                'tagText'      => '#9a3412',
                'label'        => 'ALERTE STOCK FAIBLE',
                'badgeBg'      => '#ffedd5',
                'badgeBorder'  => '#fdba74',
                'badgeText'    => '#9a3412',
                'dotColor'     => '#ea580c',
                'pillLabel'    => 'STOCK FAIBLE',
                'borderTop'    => '#ea580c',
            ],
        };

        // ── Variables ────────────────────────────────────────────────────────
        $appName   = e(config('app.name', 'Fleetify Management'));
        $reactUrl  = rtrim((string) (config('app.frontend_url') ?: 'http://localhost:5173'), '/');
        $pageUrl   = $reactUrl . self::PAGE_INVENTAIRE;
        $annee     = date('Y');
        $dateHeure = now()->format('d/m/Y à H:i');

        // Pièce
        $p            = $this->piece;
        $nomPiece     = e($p['nom']);
        $sku          = e($p['sku'] ?? '—');
        $typePiece    = !empty($p['type_piece']) ? e(ucfirst($p['type_piece'])) : '—';
        $unite        = e($p['unite'] ?? '');
        $emplacement  = e($p['emplacement'] ?? '—');
        $stock        = (float) $p['quantite'];
        $seuil        = (float) $p['seuil'];
        $stockTxt     = $this->nombre($stock);
        $seuilTxt     = $this->nombre($seuil);
        $manque       = $this->nombre(max(0, $seuil - $stock));
        $prix         = isset($p['prix_unitaire']) ? number_format((float) $p['prix_unitaire'], 0, ',', ' ') . ' FCFA' : '—';

        // Fournisseur
        $fournNom     = e($p['fournisseur'] ?? 'Non renseigné');
        $fournTel     = !empty($p['fournisseur_telephone']) ? e($p['fournisseur_telephone']) : null;
        $fournEmail   = !empty($p['fournisseur_email'])     ? e($p['fournisseur_email'])     : null;

        // Destinataire
        $destNom      = e($this->destinataire['nom']);
        $destRole     = e($this->destinataire['role_libelle']);

        // Jauge stock / seuil (0 % → vide, 100 % → au seuil)
        $pct = $seuil > 0 ? max(0, min(100, (int) round($stock / $seuil * 100))) : 0;

        // ── Message hero ─────────────────────────────────────────────────────
        if ($this->rupture) {
            $heroTitle = 'Cette pièce est épuisée — réapprovisionnement immédiat';
            $heroMsg   = "La pièce <strong>{$nomPiece}</strong> est en <strong style=\"color:{$c['accent']};\">rupture de stock</strong>. Les interventions nécessitant cette pièce ne pourront plus être réalisées tant qu'elle n'est pas réapprovisionnée.";
        } else {
            $heroTitle = 'Le stock a atteint le seuil d\'alerte';
            $heroMsg   = "Le stock de la pièce <strong>{$nomPiece}</strong> est passé sous son seuil d'alerte (<strong style=\"color:{$c['accent']};\">{$stockTxt} {$unite}</strong> restant pour un seuil de {$seuilTxt} {$unite}). Pensez à planifier un réapprovisionnement.";
        }

        $stockBadge = $this->rupture
            ? "<span style=\"display:inline-block;margin-left:6px;padding:2px 7px;background:{$c['tagBg']};color:{$c['accent']};font-size:10px;font-weight:700;border-radius:3px;\">ÉPUISÉ</span>"
            : "<span style=\"display:inline-block;margin-left:6px;padding:2px 7px;background:{$c['tagBg']};color:{$c['accent']};font-size:10px;font-weight:700;border-radius:3px;\">SOUS LE SEUIL</span>";

        // ── Logo ─────────────────────────────────────────────────────────────
        $logoMain = $logoIntegre
            ? "<img src=\"cid:" . self::LOGO_CID . "\" width=\"36\" height=\"43\" alt=\"SGS\" style=\"display:block;border:0;\">"
            : $this->svgLogo(36, 43);
        $logoFoot = $logoIntegre
            ? "<img src=\"cid:" . self::LOGO_CID . "\" width=\"24\" height=\"29\" alt=\"SGS\" style=\"display:block;border:0;opacity:0.55;\">"
            : $this->svgLogo(24, 29, '#999999');

        // ── Champs ───────────────────────────────────────────────────────────
        $fields  = $this->field('Référence (SKU)', $sku);
        $fields .= $this->field('Type de pièce', $typePiece);
        $fields .= $this->field('Emplacement', $emplacement);
        $fields .= $this->field('Prix unitaire', e($prix));
        $fields .= $this->field('Seuil d\'alerte', "{$seuilTxt} {$unite}");
        $fields .= $this->field('Manque pour atteindre le seuil', "{$manque} {$unite}");

        // Contact fournisseur (préparé avant le heredoc)
        $contactHtml = '';
        if ($fournTel)   $contactHtml .= "<span>☎&nbsp;</span><span style=\"color:#374151;font-weight:500;\">{$fournTel}</span><br>";
        if ($fournEmail) $contactHtml .= "<span>✉&nbsp;</span><span style=\"color:#374151;font-weight:500;\">{$fournEmail}</span>";
        if ($contactHtml === '') $contactHtml = "<span style=\"color:#9ca3af;\">Aucun contact enregistré</span>";

        // Avatar initiales fournisseur
        $mots      = preg_split('/\s+/', trim((string) ($p['fournisseur'] ?? '?')));
        $initiales = strtoupper(implode('', array_map(fn ($m) => mb_substr($m, 0, 1), array_slice($mots, 0, 2))));

        // ── HTML ─────────────────────────────────────────────────────────────
        return <<<HTML
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{$appName} — Alerte Stock</title>
  <style>
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      width: 100%;
    }
    img { border:0; display:block; }
    a   { text-decoration:none; color:inherit; }

    .ew  { width:100%; padding:28px 16px; background:#f1f5f9; }
    .ec  {
      width:100%; max-width:600px; margin:0 auto;
      background:#fff; border-radius:10px; overflow:hidden;
      box-shadow:0 2px 16px rgba(0,0,0,.08);
    }

    .s-hdr  { padding:20px 28px; border-bottom:1px solid #f0f0f0; }
    .s-hero { padding:26px 28px; }
    .s-body { padding:26px 28px; }
    .s-foot { padding:16px 28px 20px; background:#f9fafb; border-top:1px solid #f0f0f0; }

    .hdr-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .hdr-logo { display:flex; align-items:center; gap:10px; }

    .countdown {
      display:inline-flex; align-items:baseline; gap:8px;
      margin-top:18px; padding:12px 20px;
      background:#fff; border:1px solid; border-radius:8px;
      box-shadow:0 1px 4px rgba(0,0,0,.05);
      width:auto; max-width:100%;
    }

    .ccard {
      display:flex; align-items:center; gap:12px; flex-wrap:wrap;
      background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;
      padding:14px 16px; margin-bottom:22px;
    }

    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

    .cta {
      display:inline-block; background:#111; color:#fff !important;
      font-size:13px; font-weight:600; letter-spacing:.4px;
      padding:13px 28px; border-radius:6px; text-align:center;
    }

    .foot-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .foot-right { margin-left:auto; text-align:right; }

    @media only screen and (max-width:480px) {
      .ew  { padding:0 !important; }
      .ec  { border-radius:0 !important; box-shadow:none !important; }
      .s-hdr, .s-hero, .s-body, .s-foot { padding:16px !important; }
      .hdr-row { flex-direction:column !important; align-items:flex-start !important; gap:12px !important; }
      .hero-title { font-size:16px !important; }
      .countdown { display:flex !important; width:100% !important; }
      .ccard { flex-direction:column !important; align-items:flex-start !important; }
      .grid2 { grid-template-columns:1fr !important; }
      .cta { display:block !important; width:100% !important; padding:14px 16px !important; }
      .foot-row  { flex-direction:column !important; align-items:flex-start !important; }
      .foot-right { margin-left:0 !important; text-align:left !important; }
    }
  </style>
</head>
<body>

<div class="ew">
<div class="ec">

  <!-- Barre colorée supérieure -->
  <div style="height:4px;background:{$c['borderTop']};"></div>

  <!-- ═══ HEADER ═══ -->
  <div class="s-hdr" style="background:#fff;">
    <div class="hdr-row">
      <div class="hdr-logo">
        {$logoMain}
        <div>
          <div style="font-size:14px;font-weight:700;color:#111;line-height:1.2;">Fleetify Management</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">Gestion du Parc Automobile</div>
        </div>
      </div>
      <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:{$c['badgeBg']};color:{$c['badgeText']};border:1px solid {$c['badgeBorder']};border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;white-space:nowrap;">
        <span style="width:6px;height:6px;border-radius:50%;background:{$c['dotColor']};flex-shrink:0;display:inline-block;"></span>
        {$c['pillLabel']}
      </div>
    </div>
  </div>

  <!-- ═══ HERO ═══ -->
  <div class="s-hero" style="background:{$c['accentLight']};border-bottom:1px solid {$c['accentBorder']};">
    <div style="display:inline-block;background:{$c['tagBg']};color:{$c['tagText']};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:4px;margin-bottom:12px;">
      {$c['label']}
    </div>
    <div class="hero-title" style="font-size:18px;font-weight:700;color:#111;margin-bottom:10px;line-height:1.35;">
      {$heroTitle}
    </div>
    <p style="font-size:14px;color:#4b5563;line-height:1.75;">
      Bonjour <strong style="color:#111;">{$destNom}</strong>,<br>
      {$heroMsg}
    </p>
    <div class="countdown" style="border-color:{$c['accentBorder']};">
      <span style="font-size:30px;font-weight:800;color:{$c['accent']};letter-spacing:-1px;line-height:1;">{$stockTxt}</span>
      <span style="font-size:13px;font-weight:500;color:#6b7280;">{$unite} en stock &nbsp;/&nbsp; seuil {$seuilTxt}</span>
    </div>
    <!-- Jauge stock / seuil -->
    <div style="margin-top:14px;height:8px;background:#fff;border:1px solid {$c['accentBorder']};border-radius:6px;overflow:hidden;">
      <div style="height:8px;width:{$pct}%;background:{$c['accent']};"></div>
    </div>
  </div>

  <!-- ═══ BODY ═══ -->
  <div class="s-body">

    <!-- Pièce concernée -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Pièce concernée
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-left:3px solid {$c['accent']};border-radius:6px;padding:16px 18px;margin-bottom:22px;">
      <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:14px;">{$nomPiece}</div>
      <div class="grid2">
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">Stock actuel</div>
          <div style="font-size:13px;font-weight:600;color:{$c['accent']};display:flex;align-items:center;flex-wrap:wrap;gap:4px;">{$stockTxt} {$unite}{$stockBadge}</div>
        </div>
        {$fields}
      </div>
    </div>

    <!-- Fournisseur habituel -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Fournisseur habituel
    </div>
    <div class="ccard">
      <div style="width:44px;height:44px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:15px;font-weight:800;color:#fff;letter-spacing:.5px;">{$initiales}</span>
      </div>
      <div style="flex:1;min-width:100px;">
        <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:4px;">{$fournNom}</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.7;">{$contactHtml}</div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:20px;">
      <a href="{$pageUrl}" class="cta">Ouvrir l'inventaire &rarr;</a>
      <div style="margin-top:10px;">
        <span style="font-size:11px;color:#9ca3af;">ou copiez ce lien&nbsp;: </span>
        <a href="{$pageUrl}" style="font-size:11px;color:{$c['accent']};word-break:break-all;">{$pageUrl}</a>
      </div>
    </div>

    <!-- Note bas -->
    <p style="font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;border-top:1px solid #f0f0f0;padding-top:16px;">
      Alerte générée automatiquement le {$dateHeure} par {$appName}.<br>
      Ce message est informatif — merci de ne pas y répondre.
    </p>

  </div>

  <!-- ═══ FOOTER ═══ -->
  <div class="s-foot">
    <div class="foot-row">
      {$logoFoot}
      <div>
        <div style="font-size:11px;color:#9ca3af;">noreply@sgs-gabon.com &mdash; Message automatique</div>
      </div>
      <div class="foot-right">
        <div style="font-size:11px;color:#9ca3af;">&copy; {$annee} SGS — Tous droits réservés</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
          Destinataire&nbsp;: <span style="color:#6b7280;font-weight:500;">{$destNom}</span> ({$destRole})
        </div>
      </div>
    </div>
  </div>

</div><!-- /.ec -->
</div><!-- /.ew -->

</body>
</html>
HTML;
    }

    // =========================================================================
    // UTILITAIRES PRIVÉS
    // =========================================================================

    /** 12.00 → "12" ; 2.50 → "2,5" */
    private function nombre(float $v): string
    {
        return str_replace('.', ',', rtrim(rtrim(number_format($v, 2, '.', ''), '0'), '.'));
    }

    private function field(string $label, string $value): string
    {
        return <<<HTML
<div>
  <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">{$label}</div>
  <div style="font-size:13px;font-weight:600;color:#111111;">{$value}</div>
</div>
HTML;
    }

    /**
     * Cherche public/logo.png. Retourne null si introuvable → le SVG de secours est utilisé.
     */
    private function findLogoPath(): ?string
    {
        $candidats = [
            public_path('logo.png'),
            base_path('public' . DIRECTORY_SEPARATOR . 'logo.png'),
        ];

        foreach ($candidats as $path) {
            if (is_file($path) && is_readable($path)) {
                return $path;
            }
        }

        Log::warning('[MailStockFaible] logo.png introuvable (' . implode(' | ', $candidats) . ') — logo SVG de secours utilisé.');
        return null;
    }

    private function svgLogo(int $w, int $h, string $iconColor = '#111111'): string
    {
        return <<<SVG
<svg width="{$w}" height="{$h}" viewBox="0 0 52 62" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;">
  <path d="M26 2 L50 12 L50 34 C50 48 38 58 26 62 C14 58 2 48 2 34 L2 12 Z" fill="{$iconColor}"/>
  <path d="M26 6 L47 15 L47 34 C47 46.5 36.5 55.5 26 59 C15.5 55.5 5 46.5 5 34 L5 15 Z" fill="#ffffff"/>
  <path d="M32 18 C35 20 37 24 36 28 C35 32 31 34 27 33 C23 32 20 28 21 24 C19 26 18 30 19 34 C20 38 24 41 28 41 C25 42 22 40 20 37 C18 34 18 30 20 26 C22 22 26 19 30 18 Z" fill="{$iconColor}" opacity="0.7"/>
  <path d="M34 17 C37 20 38 25 36 29 C34 33 29 35 24 33 C26 33 29 32 31 30 C33 28 34 25 33 22 C32 19 30 17 28 16 C30 15 32 15 34 17 Z" fill="{$iconColor}"/>
</svg>
SVG;
    }
}