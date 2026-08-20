<?php

namespace App\Mail;

use Carbon\Carbon;
use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * MailPasswordUtilisateurs
 *
 * Mailable SGS — Envoi / Réinitialisation du mot de passe d'un utilisateur.
 * Design identique à MailDocumentVehicule (structure, header, hero, body, footer).
 *
 * Deux modes :
 *   isReset = false → Création de compte (mot de passe initial)  → palette verte
 *   isReset = true  → Réinitialisation par un admin              → palette bleue
 *
 * IMPORTANT : ShouldQueue intentionnellement retiré → envoi synchrone immédiat.
 *
 * SÉCURITÉ : Le mot de passe temporaire est valable 24 heures.
 *   Si l'utilisateur ne le change pas dans ce délai, son compte sera
 *   automatiquement désactivé (est_actif = 0) et devra être réinitialisé
 *   par un administrateur.
 */
class MailPasswordUtilisateurs extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Utilisateur $utilisateur,
        public readonly string      $plainPassword,
        public readonly bool        $isReset = false,
    ) {}

    // =========================================================================
    // ENVELOPE — Sujet de l'email
    // =========================================================================

    public function envelope(): Envelope
    {
        $emoji   = $this->isReset ? '🔑' : '🎉';
        $tag     = $this->isReset ? '[RÉINITIALISATION]' : '[BIENVENUE]';
        $subject = $this->isReset
            ? "{$emoji} {$tag} Votre nouveau mot de passe — Fleetify Management"
            : "{$emoji} {$tag} Vos identifiants de connexion — Fleetify Management";

        return new Envelope(subject: $subject);
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
        // ── Palette couleurs selon le mode (même logique que MailDocumentVehicule) ──
        $c = $this->isReset
            ? [
                'accent'       => '#2563eb',
                'accentLight'  => '#eff6ff',
                'accentBorder' => '#bfdbfe',
                'tagBg'        => '#dbeafe',
                'tagText'      => '#1e40af',
                'label'        => 'RÉINITIALISATION DU MOT DE PASSE',
                'badgeBg'      => '#dbeafe',
                'badgeBorder'  => '#93c5fd',
                'badgeText'    => '#1e40af',
                'dotColor'     => '#2563eb',
                'pillLabel'    => 'SÉCURITÉ',
                'borderTop'    => '#2563eb',
            ]
            : [
                'accent'       => '#16a34a',
                'accentLight'  => '#f0fdf4',
                'accentBorder' => '#bbf7d0',
                'tagBg'        => '#dcfce7',
                'tagText'      => '#15803d',
                'label'        => 'CRÉATION DE COMPTE',
                'badgeBg'      => '#dcfce7',
                'badgeBorder'  => '#86efac',
                'badgeText'    => '#15803d',
                'dotColor'     => '#16a34a',
                'pillLabel'    => 'BIENVENUE',
                'borderTop'    => '#16a34a',
            ];

        // ── Variables ────────────────────────────────────────────────────────
        $appName   = config('app.name', 'Fleetify Management');
        $reactUrl  = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $loginUrl  = "{$reactUrl}/login";
        $annee     = date('Y');
        $dateHeure = now()->format('d/m/Y à H:i');

        // ── Date/heure d'expiration — 24 h après l'envoi ─────────────────────
        $expireAt  = now()->addHours(24)->format('d/m/Y à H:i');

        $destNom   = e($this->utilisateur->nom);
        $destEmail = e($this->utilisateur->email);
        $destRole  = e($this->utilisateur->role?->libelle ?? '—');
        $destDir   = e($this->utilisateur->direction?->nom ?? '—');
        $password  = e($this->plainPassword);

        // ── Messages selon le mode ────────────────────────────────────────────
        if ($this->isReset) {
            $heroTitle = "Votre mot de passe a été réinitialisé";
            $heroMsg   = "Un administrateur a réinitialisé votre mot de passe sur la plateforme <strong>Fleetify Management</strong>. Retrouvez ci-dessous vos nouveaux identifiants de connexion.";
            $noteMsg   = "Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement votre administrateur système. Vos sessions précédentes ont été automatiquement fermées.";
        } else {
            $heroTitle = "Bienvenue sur Fleetify Management !";
            $heroMsg   = "Votre compte vient d'être créé sur la plateforme <strong>Fleetify Management</strong>. Retrouvez ci-dessous vos identifiants pour vous connecter.";
            $noteMsg   = "Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe dès votre première connexion.";
        }

        // ── Logo ─────────────────────────────────────────────────────────────
        $logoB64  = $this->encodeLogoBase64();
        $logoMain = $logoB64
            ? "<img src=\"data:image/png;base64,{$logoB64}\" width=\"36\" height=\"43\" alt=\"SGS\" style=\"display:block;border:0;\">"
            : $this->svgLogo(36, 43);
        $logoFoot = $logoB64
            ? "<img src=\"data:image/png;base64,{$logoB64}\" width=\"24\" height=\"29\" alt=\"SGS\" style=\"display:block;border:0;opacity:0.55;\">"
            : $this->svgLogo(24, 29, '#999999');

        // ── HTML ─────────────────────────────────────────────────────────────
        return <<<HTML
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{$appName} — Identifiants de connexion</title>
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
    .hdr-row  { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .hdr-logo { display:flex; align-items:center; gap:10px; }

    /* ── Grille 2 colonnes ── */
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

    /* ── Bloc mot de passe — fond clair, texte noir lisible ── */
    .pwd-block {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      padding: 20px 22px;
      margin: 16px 0 8px;
      text-align: center;
    }

    /* ── Bloc expiration ── */
    .expire-block {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 0 0 22px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    /* ── CTA ── */
    .cta {
      display:inline-block; background:#111; color:#fff !important;
      font-size:13px; font-weight:600; letter-spacing:.4px;
      padding:13px 28px; border-radius:6px; text-align:center;
    }

    /* ── Footer flex ── */
    .foot-row   { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .foot-right { margin-left:auto; text-align:right; }

    /* ══════════════════════════════
       RESPONSIVE — 480 px et moins
    ══════════════════════════════ */
    @media only screen and (max-width:480px) {
      .ew  { padding:0 !important; }
      .ec  { border-radius:0 !important; box-shadow:none !important; }
      .s-hdr,.s-hero,.s-body,.s-foot { padding:16px !important; }
      .hdr-row { flex-direction:column !important; align-items:flex-start !important; gap:12px !important; }
      .hero-title { font-size:16px !important; }
      .grid2 { grid-template-columns:1fr !important; }
      .cta { display:block !important; width:100% !important; padding:14px 16px !important; }
      .foot-row   { flex-direction:column !important; align-items:flex-start !important; }
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
      Bonjour Mr/Mme <strong style="color:#111;">{$destNom}</strong>,<br>
      {$heroMsg}
    </p>
  </div>

  <!-- ═══ BODY ═══ -->
  <div class="s-body">

    <!-- Informations du compte -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Informations du compte
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-left:3px solid {$c['accent']};border-radius:6px;padding:16px 18px;margin-bottom:22px;">
      <div class="grid2">
        {$this->field('Nom complet',    $destNom)}
        {$this->field('Adresse e-mail', "<span style=\"color:{$c['accent']};\">{$destEmail}</span>")}
        {$this->field('Rôle',           $destRole)}
        {$this->field('Direction',      $destDir)}
      </div>
    </div>

    <!-- Mot de passe -->
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Votre mot de passe temporaire
    </div>

    <!--
      ✅ Fond clair (#f8fafc) + texte noir (#111111) → mot de passe parfaitement lisible
         Bordure pointillée pour attirer l'attention sans agressivité visuelle
    -->
    <div class="pwd-block">
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin-bottom:12px;">
        Mot de passe temporaire
      </div>
      <div style="font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:800;color:#111111;letter-spacing:5px;line-height:1.2;word-break:break-all;">
        {$password}
      </div>
      <div style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:{$c['tagBg']};border-radius:20px;">
        <span style="width:5px;height:5px;border-radius:50%;background:{$c['dotColor']};display:inline-block;"></span>
        <span style="font-size:10px;font-weight:700;color:{$c['tagText']};letter-spacing:.8px;text-transform:uppercase;">Confidentiel — ne pas partager</span>
      </div>
    </div>

    <!-- ✅ Bloc expiration 24 h — information critique de sécurité -->
    <div class="expire-block">
      <span style="font-size:20px;flex-shrink:0;line-height:1;">⏱️</span>
      <div>
        <p style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">
          Mot de passe valable 24 heures seulement
        </p>
        <p style="font-size:12px;color:#78350f;line-height:1.7;margin:0;">
          Ce mot de passe expire le <strong>{$expireAt}</strong>.<br>
          Passé ce délai, si vous ne l'avez pas modifié, votre compte sera <strong>automatiquement désactivé</strong>
          pour des raisons de sécurité. Vous devrez alors contacter un administrateur pour le réactiver.
        </p>
      </div>
    </div>

    <!-- Note de sécurité -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:22px;display:flex;gap:10px;align-items:flex-start;">
      <span style="font-size:18px;flex-shrink:0;">⚠️</span>
      <p style="font-size:12px;color:#92400e;line-height:1.7;margin:0;">
        <strong>Sécurité :</strong> {$noteMsg}
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:20px;">
      <a href="{$loginUrl}" class="cta" style="background:{$c['accent']};">Se connecter et changer mon mot de passe &rarr;</a>
      <div style="margin-top:10px;">
        <span style="font-size:11px;color:#9ca3af;">ou copiez ce lien&nbsp;: </span>
        <a href="{$loginUrl}" style="font-size:11px;color:{$c['accent']};word-break:break-all;">{$loginUrl}</a>
      </div>
    </div>

    <!-- Note bas -->
    <p style="font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;border-top:1px solid #f0f0f0;padding-top:16px;">
      Message généré automatiquement le {$dateHeure} par {$appName}.<br>
      Ne partagez jamais vos identifiants. Ne répondez pas à cet email.
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
    // UTILITAIRES PRIVÉS — identiques à MailDocumentVehicule
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