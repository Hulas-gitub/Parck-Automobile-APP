<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * MailDocumentVehicule
 *
 * Mailable SGS — Alerte expiration document véhicule.
 * Template HTML intégré directement dans build() via $this->html().
 * Logo chargé depuis public/logo.png en base64 (fallback SVG si absent).
 *
 * IMPORTANT : ShouldQueue intentionnellement retiré → envoi synchrone immédiat.
 *
 * Niveaux :
 *   expire    → Document déjà expiré        (rouge)
 *   seuil_5   → Expire dans < 5 jours       (rouge)
 *   seuil_15  → Expire dans < 15 jours      (orange)
 *   seuil_30  → Expire dans < 30 jours      (ambre)
 */
class MailDocumentVehicule extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly array  $document,
        public readonly array  $vehicule,
        public readonly array  $destinataire,
        public readonly string $statut,
        public readonly int    $joursRestants,
        public readonly string $niveau = 'seuil_30',
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

        $type = ucfirst(str_replace('_', ' ', $this->document['type_document']));

        return new Envelope(
            subject: "{$emoji} {$tag} {$type} — {$this->vehicule['immatriculation']}",
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
        $appName      = config('app.name', 'Fleetify Management');
        $reactUrl     = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $annee        = date('Y');
        $immat        = e($this->vehicule['immatriculation']);
        $marque       = e($this->vehicule['marque'] ?? '');
        $modele       = e($this->vehicule['modele'] ?? '');
        $direction    = e($this->vehicule['direction'] ?? '—');
        $categorie    = e($this->vehicule['categorie'] ?? '—');
        $typeDoc      = e(ucfirst(str_replace('_', ' ', $this->document['type_document'])));
        $nomDoc       = e($this->document['nom_document']);
        $dateExp      = $this->document['date_expiration']
                            ? Carbon::parse($this->document['date_expiration'])->format('d/m/Y')
                            : '—';
        $dateEmission = !empty($this->document['date_emission'])
                            ? Carbon::parse($this->document['date_emission'])->format('d/m/Y')
                            : null;
        $compagnie    = !empty($this->document['compagnie_assurance'])
                            ? e($this->document['compagnie_assurance']) : null;
        $numContrat   = !empty($this->document['numero_contrat'])
                            ? e($this->document['numero_contrat']) : null;
        $typeCouv     = !empty($this->document['type_couverture'])
                            ? e($this->document['type_couverture']) : null;
        $montant      = !empty($this->document['montant_prime'])
                            ? number_format((float)$this->document['montant_prime'], 0, ',', ' ') . ' CFA'
                            : null;
        $destNom      = e($this->destinataire['nom']);
        $destRole     = e($this->destinataire['role_libelle']);
        $ficheUrl     = "{$reactUrl}/Admin/Navigation/Vehicules";
        $dateHeure    = now()->format('d/m/Y à H:i');

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
            $heroMsg   = "Le document <strong>{$nomDoc}</strong> ({$typeDoc}) du véhicule <strong>{$immat}</strong> a expiré il y a <strong style=\"color:{$c['accent']};\">{$jAbs} {$jWord}</strong>. Merci de procéder au renouvellement sans délai.";
        } else {
            $heroTitle = "Renouvellement requis avant expiration";
            $heroMsg   = "Le document <strong>{$nomDoc}</strong> ({$typeDoc}) du véhicule <strong>{$immat}</strong> expire dans <strong style=\"color:{$c['accent']};\">{$this->joursRestants} {$jWord}</strong>. Veuillez anticiper le renouvellement avant la date d'échéance.";
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

        // Champs optionnels
        $optFields = '';
        if ($compagnie)    $optFields .= $this->field('Compagnie',       $compagnie);
        if ($numContrat)   $optFields .= $this->field('N° Contrat',      $numContrat);
        if ($typeCouv)     $optFields .= $this->field('Couverture',      $typeCouv);
        if ($montant)      $optFields .= $this->field('Prime',           $montant);
        if ($dateEmission) $optFields .= $this->field("Date d'émission", $dateEmission);

        // ── HTML ─────────────────────────────────────────────────────────────
        return <<<HTML
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{$appName} — Alerte Document</title>
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

    /* ── Carte véhicule ── */
    .vcard {
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

      /* Pas de padding latéral sur le wrapper, card pleine largeur */
      .ew  { padding:0 !important; }
      .ec  { border-radius:0 !important; box-shadow:none !important; }

      /* Réduction des paddings internes */
      .s-hdr,
      .s-hero,
      .s-body,
      .s-foot { padding:16px !important; }

      /* Header empilé */
      .hdr-row { flex-direction:column !important; align-items:flex-start !important; gap:12px !important; }

      /* Titre hero plus petit */
      .hero-title { font-size:16px !important; }

      /* Countdown pleine largeur */
      .countdown { display:flex !important; width:100% !important; }

      /* Carte véhicule empilée */
      .vcard { flex-direction:column !important; align-items:flex-start !important; }

      /* 1 colonne pour la grille de champs */
      .grid2 { grid-template-columns:1fr !important; }

      /* CTA pleine largeur */
      .cta { display:block !important; width:100% !important; padding:14px 16px !important; }

      /* Footer empilé */
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

    <!-- Véhicule -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Véhicule concerné
    </div>
    <div class="vcard">
      <div style="background:#111;color:#fff;font-size:13px;font-weight:800;letter-spacing:2.5px;padding:7px 14px;border-radius:5px;white-space:nowrap;font-family:'Courier New',monospace;">
        {$immat}
      </div>
      <div style="flex:1;min-width:100px;">
        <div style="font-size:14px;font-weight:600;color:#111;margin-bottom:3px;">{$marque} {$modele}</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.6;">
          Direction&nbsp;: <span style="color:#374151;font-weight:500;">{$direction}</span>
          &nbsp;&middot;&nbsp;
          Catégorie&nbsp;: <span style="color:#374151;font-weight:500;">{$categorie}</span>
        </div>
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
        {$optFields}
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">Date d'expiration</div>
          <div style="font-size:13px;font-weight:600;color:{$c['accent']};display:flex;align-items:center;flex-wrap:wrap;gap:4px;">{$dateExp}{$expBadge}</div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:20px;">
      <a href="{$ficheUrl}" class="cta">Accéder à la page des véhicules &rarr;</a>
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