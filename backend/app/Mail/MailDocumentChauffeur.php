<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * MailDocumentChauffeur
 *
 * Mailable SGS — Alerte expiration document chauffeur.
 * Template HTML intégré directement dans build() via $this->html().
 * Logo chargé depuis public/logo.png en base64 (fallback SVG si absent).
 *
 * IMPORTANT : ShouldQueue intentionnellement retiré → envoi synchrone immédiat.
 *
 * Déclenchement (depuis ChauffeurController::storeDocument / updateDocument) :
 *   - À la création du document   → si date_expiration <= 30 jours
 *   - À la modification du document → si date_expiration <= 30 jours
 *
 * Destinataires : Chauffeur concerné + Admin + Chefs de parc + TF
 *
 * Niveaux :
 *   expire    → Document déjà expiré        (rouge)
 *   seuil_5   → Expire dans < 5 jours       (rouge)
 *   seuil_15  → Expire dans < 15 jours      (orange)
 *   seuil_30  → Expire dans < 30 jours      (ambre)
 */
class MailDocumentChauffeur extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly array  $document,      // données du document chauffeur
        public readonly array  $chauffeur,     // données du chauffeur (nom, email, direction, categoriesPermis…)
        public readonly array  $destinataire,  // { nom, role_libelle } du destinataire courant
        public readonly string $statut,        // 'expire' | 'expire_bientot' | 'valide'
        public readonly int    $joursRestants, // négatif si expiré
        public readonly string $niveau = 'seuil_30', // 'expire' | 'seuil_5' | 'seuil_15' | 'seuil_30'
    ) {}

    // =========================================================================
    // ENVELOPE — Sujet de l'email
    // =========================================================================

    public function envelope(): Envelope
    {
        $emoji = match ($this->niveau) {
            'expire'   => '🔴',
            'seuil_5'  => '🚨',
            'seuil_15' => '🟠',
            default    => '📋',
        };

        $tag = match ($this->niveau) {
            'expire'   => '[EXPIRÉ]',
            'seuil_5'  => '[URGENT - MOINS DE 5 JOURS]',
            'seuil_15' => '[MOINS DE 15 JOURS]',
            default    => '[MOINS DE 30 JOURS]',
        };

        $type      = ucfirst(str_replace('_', ' ', $this->document['type_document']));
        $chauffeur = $this->chauffeur['nom'];

        return new Envelope(
            subject: "{$emoji} {$tag} {$type} — {$chauffeur}",
        );
    }

    // =========================================================================
    // BUILD
    // =========================================================================

    public function build(): static
    {
        return $this->html($this->renderHtml());
    }

    // =========================================================================
    // RENDU HTML
    // =========================================================================

    private function renderHtml(): string
    {
        // ── Palette couleurs selon le niveau ─────────────────────────────────
        $c = match ($this->niveau) {
            'expire' => [
                'accent'       => '#dc2626',
                'accentLight'  => '#fff5f5',
                'accentBorder' => '#fecaca',
                'tagBg'        => '#fee2e2',
                'tagText'      => '#991b1b',
                'label'        => 'DOCUMENT EXPIRÉ',
                'badgeBg'      => '#fee2e2',
                'badgeBorder'  => '#fca5a5',
                'badgeText'    => '#991b1b',
                'dotColor'     => '#dc2626',
                'pillLabel'    => 'EXPIRÉ',
                'borderTop'    => '#dc2626',
            ],
            'seuil_5' => [
                'accent'       => '#dc2626',
                'accentLight'  => '#fff5f5',
                'accentBorder' => '#fca5a5',
                'tagBg'        => '#fee2e2',
                'tagText'      => '#7f1d1d',
                'label'        => 'ALERTE URGENTE',
                'badgeBg'      => '#fee2e2',
                'badgeBorder'  => '#fca5a5',
                'badgeText'    => '#991b1b',
                'dotColor'     => '#dc2626',
                'pillLabel'    => '< 5 JOURS',
                'borderTop'    => '#dc2626',
            ],
            'seuil_15' => [
                'accent'       => '#ea580c',
                'accentLight'  => '#fff7ed',
                'accentBorder' => '#fed7aa',
                'tagBg'        => '#ffedd5',
                'tagText'      => '#9a3412',
                'label'        => 'ALERTE IMPORTANTE',
                'badgeBg'      => '#ffedd5',
                'badgeBorder'  => '#fdba74',
                'badgeText'    => '#9a3412',
                'dotColor'     => '#ea580c',
                'pillLabel'    => '< 15 JOURS',
                'borderTop'    => '#ea580c',
            ],
            default => [
                'accent'       => '#b45309',
                'accentLight'  => '#fffbeb',
                'accentBorder' => '#fde68a',
                'tagBg'        => '#fef9c3',
                'tagText'      => '#854d0e',
                'label'        => 'ALERTE PRÉVENTIVE',
                'badgeBg'      => '#fef9c3',
                'badgeBorder'  => '#fde68a',
                'badgeText'    => '#854d0e',
                'dotColor'     => '#b45309',
                'pillLabel'    => '< 30 JOURS',
                'borderTop'    => '#b45309',
            ],
        };

        // ── Variables ────────────────────────────────────────────────────────
        $appName          = config('app.name', 'Fleetify Management');
        $reactUrl         = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $annee            = date('Y');

        // Chauffeur
        $chauffeurNom     = e($this->chauffeur['nom']);
        $chauffeurEmail   = e($this->chauffeur['email'] ?? '—');
        $direction        = e($this->chauffeur['direction'] ?? '—');
        $categoriesPermis = e($this->chauffeur['categoriesPermis'] ?? '—');
        $dateEmbauche     = !empty($this->chauffeur['dateEmbauche'])
                                ? Carbon::parse($this->chauffeur['dateEmbauche'])->format('d/m/Y')
                                : '—';

        // Document
        $typeDoc          = e(ucfirst(str_replace('_', ' ', $this->document['type_document'])));
        $nomDoc           = e($this->document['nom_document']);
        $numeroPermis     = !empty($this->document['numero_permis'])
                                ? e($this->document['numero_permis']) : null;
        $catPermisDoc     = !empty($this->document['categories_permis'])
                                ? e($this->document['categories_permis']) : null;
        $paysDelivrance   = e($this->document['pays_delivrance'] ?? 'Gabon');
        $dateDelivrance   = !empty($this->document['date_delivrance'])
                                ? Carbon::parse($this->document['date_delivrance'])->format('d/m/Y')
                                : null;
        $dateExp          = !empty($this->document['date_expiration'])
                                ? Carbon::parse($this->document['date_expiration'])->format('d/m/Y')
                                : '—';
        $notes            = !empty($this->document['notes'])
                                ? e($this->document['notes']) : null;

        // Destinataire
        $destNom          = e($this->destinataire['nom']);
        $destRole         = e($this->destinataire['role_libelle']);

        // URL fiche chauffeur dans le front
        $ficheUrl         = "{$reactUrl}/Admin/Navigation/Chauffeurs";
        $dateHeure        = now()->format('d/m/Y à H:i');

        // Countdown
        $jAbs         = abs($this->joursRestants);
        $jWord        = $jAbs > 1 ? 'jours' : 'jour';
        $countdownNum = $this->joursRestants < 0 ? "−{$jAbs}" : (string)$this->joursRestants;
        $countdownLbl = $this->joursRestants < 0
                            ? "{$jAbs} {$jWord} de retard"
                            : "{$this->joursRestants} {$jWord} restant(s)";

        // Message hero
        if ($this->statut === 'expire') {
            $heroTitle = "Ce document a expiré — action immédiate requise";
            $heroMsg   = "Le document <strong>{$nomDoc}</strong> ({$typeDoc}) du chauffeur <strong>{$chauffeurNom}</strong> a expiré il y a <strong style=\"color:{$c['accent']};\">{$jAbs} {$jWord}</strong>. Merci de procéder au renouvellement sans délai.";
        } else {
            $heroTitle = "Renouvellement requis avant expiration";
            $heroMsg   = "Le document <strong>{$nomDoc}</strong> ({$typeDoc}) du chauffeur <strong>{$chauffeurNom}</strong> expire dans <strong style=\"color:{$c['accent']};\">{$this->joursRestants} {$jWord}</strong>. Veuillez anticiper le renouvellement avant la date d'échéance.";
        }

        $expBadge = $this->statut === 'expire'
            ? "<span style=\"display:inline-block;margin-left:6px;padding:2px 7px;background:{$c['tagBg']};color:{$c['accent']};font-size:10px;font-weight:700;border-radius:3px;\">EXPIRÉE</span>"
            : "<span style=\"display:inline-block;margin-left:6px;padding:2px 7px;background:{$c['tagBg']};color:{$c['accent']};font-size:10px;font-weight:700;border-radius:3px;\">J−{$this->joursRestants}</span>";

        // Logo
        $logoB64  = $this->encodeLogoBase64();
        $logoMain = $logoB64
            ? "<img src=\"data:image/png;base64,{$logoB64}\" width=\"36\" height=\"43\" alt=\"SGS\" style=\"display:block;border:0;\">"
            : $this->svgLogo(36, 43);
        $logoFoot = $logoB64
            ? "<img src=\"data:image/png;base64,{$logoB64}\" width=\"24\" height=\"29\" alt=\"SGS\" style=\"display:block;border:0;opacity:0.55;\">"
            : $this->svgLogo(24, 29, '#999999');

        // Champs optionnels du document
        $optFields = '';
        if ($numeroPermis)  $optFields .= $this->field('N° de permis',      $numeroPermis);
        if ($catPermisDoc)  $optFields .= $this->field('Catégories',        $catPermisDoc);
        if ($dateDelivrance)$optFields .= $this->field('Date de délivrance', $dateDelivrance);

        // Bloc notes — préparé avant le heredoc pour éviter l'imbrication interdite
        $notesHtml = $notes
            ? "<div style=\"background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin-bottom:22px;\"><div style=\"font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;\">Notes</div><div style=\"font-size:13px;color:#4b5563;line-height:1.65;\">{$notes}</div></div>"
            : '';

        // Avatar initiales chauffeur (couleur déterministe)
        $mots      = preg_split('/\s+/', trim($chauffeurNom));
        $initiales = strtoupper(
            implode('', array_map(fn($m) => mb_substr($m, 0, 1), array_slice($mots, 0, 2)))
        );
        $palette   = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444',
                      '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16'];
        $avatarBg  = $palette[$this->chauffeur['id'] % count($palette)];

        // ── HTML ─────────────────────────────────────────────────────────────
        return <<<HTML
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{$appName} — Alerte Document Chauffeur</title>
  <style>
    /* ── Reset ── */
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

    /* ── Wrapper & Card ── */
    .ew  { width:100%; padding:28px 16px; background:#f1f5f9; }
    .ec  {
      width:100%; max-width:600px; margin:0 auto;
      background:#fff; border-radius:10px; overflow:hidden;
      box-shadow:0 2px 16px rgba(0,0,0,.08);
    }

    /* ── Sections padding ── */
    .s-hdr  { padding:20px 28px; border-bottom:1px solid #f0f0f0; }
    .s-hero { padding:26px 28px; }
    .s-body { padding:26px 28px; }
    .s-foot { padding:16px 28px 20px; background:#f9fafb; border-top:1px solid #f0f0f0; }

    /* ── Header flex ── */
    .hdr-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .hdr-logo { display:flex; align-items:center; gap:10px; }

    /* ── Countdown ── */
    .countdown {
      display:inline-flex; align-items:baseline; gap:8px;
      margin-top:18px; padding:12px 20px;
      background:#fff; border:1px solid; border-radius:8px;
      box-shadow:0 1px 4px rgba(0,0,0,.05);
      width:auto; max-width:100%;
    }

    /* ── Carte chauffeur ── */
    .ccard {
      display:flex; align-items:center; gap:12px; flex-wrap:wrap;
      background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;
      padding:14px 16px; margin-bottom:22px;
    }

    /* ── Grille 2 colonnes → 1 colonne sur mobile ── */
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

    /* ── CTA ── */
    .cta {
      display:inline-block; background:#111; color:#fff !important;
      font-size:13px; font-weight:600; letter-spacing:.4px;
      padding:13px 28px; border-radius:6px; text-align:center;
    }

    /* ── Footer flex ── */
    .foot-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .foot-right { margin-left:auto; text-align:right; }

    /* ══════════════════════════════
       RESPONSIVE — 480 px et moins
    ══════════════════════════════ */
    @media only screen and (max-width:480px) {
      .ew  { padding:0 !important; }
      .ec  { border-radius:0 !important; box-shadow:none !important; }
      .s-hdr,
      .s-hero,
      .s-body,
      .s-foot { padding:16px !important; }
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
      <span style="font-size:30px;font-weight:800;color:{$c['accent']};letter-spacing:-1px;line-height:1;">{$countdownNum}</span>
      <span style="font-size:13px;font-weight:500;color:#6b7280;">{$countdownLbl}</span>
    </div>
  </div>

  <!-- ═══ BODY ═══ -->
  <div class="s-body">

    <!-- Chauffeur concerné -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Chauffeur concerné
    </div>
    <div class="ccard">
      <!-- Avatar initiales -->
      <div style="width:44px;height:44px;border-radius:50%;background:{$avatarBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:15px;font-weight:800;color:#fff;letter-spacing:.5px;">{$initiales}</span>
      </div>
      <div style="flex:1;min-width:100px;">
        <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:4px;">{$chauffeurNom}</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.7;">
          <span>✉&nbsp;</span><span style="color:#374151;font-weight:500;">{$chauffeurEmail}</span><br>
          Direction&nbsp;: <span style="color:#374151;font-weight:500;">{$direction}</span>
          &nbsp;&middot;&nbsp;
          Catégories permis&nbsp;: <span style="color:#374151;font-weight:500;">{$categoriesPermis}</span>
        </div>
      </div>
      <div style="text-align:right;white-space:nowrap;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;">Embauche</div>
        <div style="font-size:12px;font-weight:600;color:#374151;">{$dateEmbauche}</div>
      </div>
    </div>

    <!-- Document -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Détails du document
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-left:3px solid {$c['accent']};border-radius:6px;padding:16px 18px;margin-bottom:22px;">
      <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:14px;">{$nomDoc}</div>
      <div class="grid2">
        {$this->field('Type de document', $typeDoc)}
        {$this->field('Pays de délivrance', $paysDelivrance)}
        {$optFields}
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">Date d'expiration</div>
          <div style="font-size:13px;font-weight:600;color:{$c['accent']};display:flex;align-items:center;flex-wrap:wrap;gap:4px;">{$dateExp}{$expBadge}</div>
        </div>
      </div>
    </div>

    <!-- Notes optionnelles -->
    {$notesHtml}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:20px;">
      <a href="{$ficheUrl}" class="cta">Accéder à la page des chauffeurs &rarr;</a>
      <div style="margin-top:10px;">
        <span style="font-size:11px;color:#9ca3af;">ou copiez ce lien&nbsp;: </span>
        <a href="{$ficheUrl}" style="font-size:11px;color:{$c['accent']};word-break:break-all;">{$ficheUrl}</a>
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

    private function field(string $label, string $value): string
    {
        return <<<HTML
<div>
  <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">{$label}</div>
  <div style="font-size:13px;font-weight:600;color:#111111;">{$value}</div>
</div>
HTML;
    }

    private function encodeLogoBase64(): ?string
    {
        $path = public_path('logo.png');
        if (!file_exists($path)) {
            return null;
        }
        try {
            return base64_encode(file_get_contents($path));
        } catch (\Throwable) {
            return null;
        }
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