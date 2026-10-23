<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * MailDemandeInterventionExterne
 *
 * Mailable SGS — Nouvelle demande d'intervention EXTERNE à traiter par le DAAL.
 * Template HTML intégré dans build() via $this->html() (même approche que MailDocumentChauffeur).
 * Logo public/logo.png intégré au mail (cid:) — fallback SVG si le fichier est absent.
 *
 * IMPORTANT : ShouldQueue intentionnellement retiré → envoi synchrone immédiat.
 *
 * Déclenchement : DemandeInterventionController::store() quand nature_intervention = 'externe'.
 * Destinataires : utilisateurs actifs du rôle « daal » (un envoi par destinataire).
 *
 * Couleur selon la priorité :
 *   urgente → rouge · haute → orange · normale → bleu · faible → vert
 *
 * Lien du bouton : config('app.frontend_url') + /Admin/Navigation/DemandesIntervention
 * → 'frontend_url' => env('FRONTEND_URL') dans config/app.php et FRONTEND_URL=... dans .env.
 */
class MailDemandeInterventionExterne extends Mailable
{
    use Queueable, SerializesModels;

    private const LOGO_CID  = 'logo-sgs';
    private const FRONT_URL = '/Admin/Navigation/DemandesIntervention';

    public function __construct(
        public readonly array $demande,       // demande formatée (DemandeInterventionController::format)
        public readonly array $destinataire,  // { nom, role_libelle }
    ) {}

    // =========================================================================
    // ENVELOPE
    // =========================================================================

    public function envelope(): Envelope
    {
        $priorite = $this->demande['priorite'] ?? 'normale';

        $emoji = match ($priorite) {
            'urgente' => '🚨',
            'haute'   => '🟠',
            default   => '🔧',
        };
        $tag = match ($priorite) {
            'urgente' => '[URGENT] ',
            'haute'   => '[PRIORITÉ HAUTE] ',
            default   => '',
        };

        return new Envelope(
            subject: "{$emoji} {$tag}Demande d'intervention externe {$this->demande['reference']} — {$this->demande['vehicule_immatriculation']}",
        );
    }

    // =========================================================================
    // BUILD
    // =========================================================================

    public function build(): static
    {
        $logoPath = $this->findLogoPath();

        if ($logoPath !== null) {
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
        $d = $this->demande;

        // ── Palette selon la priorité ────────────────────────────────────────
        $c = match ($d['priorite'] ?? 'normale') {
            'urgente' => [
                'accent' => '#dc2626', 'accentLight' => '#fff5f5', 'accentBorder' => '#fecaca',
                'tagBg' => '#fee2e2', 'tagText' => '#991b1b', 'label' => 'DEMANDE URGENTE',
                'badgeBg' => '#fee2e2', 'badgeBorder' => '#fca5a5', 'badgeText' => '#991b1b',
                'dotColor' => '#dc2626', 'pillLabel' => 'URGENTE', 'borderTop' => '#dc2626',
            ],
            'haute' => [
                'accent' => '#ea580c', 'accentLight' => '#fff7ed', 'accentBorder' => '#fed7aa',
                'tagBg' => '#ffedd5', 'tagText' => '#9a3412', 'label' => 'PRIORITÉ HAUTE',
                'badgeBg' => '#ffedd5', 'badgeBorder' => '#fdba74', 'badgeText' => '#9a3412',
                'dotColor' => '#ea580c', 'pillLabel' => 'HAUTE', 'borderTop' => '#ea580c',
            ],
            'faible' => [
                'accent' => '#059669', 'accentLight' => '#f0fdf4', 'accentBorder' => '#bbf7d0',
                'tagBg' => '#dcfce7', 'tagText' => '#166534', 'label' => "DEMANDE D'INTERVENTION",
                'badgeBg' => '#dcfce7', 'badgeBorder' => '#86efac', 'badgeText' => '#166534',
                'dotColor' => '#059669', 'pillLabel' => 'FAIBLE', 'borderTop' => '#059669',
            ],
            default => [
                'accent' => '#4f46e5', 'accentLight' => '#eef2ff', 'accentBorder' => '#c7d2fe',
                'tagBg' => '#e0e7ff', 'tagText' => '#3730a3', 'label' => "DEMANDE D'INTERVENTION",
                'badgeBg' => '#e0e7ff', 'badgeBorder' => '#a5b4fc', 'badgeText' => '#3730a3',
                'dotColor' => '#4f46e5', 'pillLabel' => 'NORMALE', 'borderTop' => '#4f46e5',
            ],
        };

        // ── Variables ────────────────────────────────────────────────────────
        $appName   = e(config('app.name', 'Fleetify Management'));
        $reactUrl  = rtrim((string) (config('app.frontend_url') ?: 'http://localhost:5173'), '/');
        $pageUrl   = $reactUrl . self::FRONT_URL;
        $annee     = date('Y');
        $dateHeure = now()->format('d/m/Y à H:i');

        $ref        = e($d['reference']);
        $destNom    = e($this->destinataire['nom']);
        $destRole   = e($this->destinataire['role_libelle']);

        $immat      = e($d['vehicule_immatriculation']);
        $marqueMod  = e(trim(($d['vehicule_marque'] ?? '') . ' ' . ($d['vehicule_modele'] ?? '')) ?: '—');
        $kmVeh      = isset($d['vehicule_kilometrage']) && $d['vehicule_kilometrage'] !== null
                        ? number_format((int) $d['vehicule_kilometrage'], 0, ',', ' ') . ' km' : '—';

        $demandeur  = e($d['demandeur_nom'] ?? '—');
        $demRole    = e($d['demandeur_role_libelle'] ?? 'Saisie libre');
        $dateDem    = !empty($d['date_demande']) ? Carbon::parse($d['date_demande'])->format('d/m/Y à H:i') : '—';

        $typeInt    = e(ucfirst(str_replace('_', ' ', (string) ($d['type_intervention'] ?? '—'))));
        $typeMaint  = ($d['type_maintenance'] ?? '') === 'preventive' ? 'Préventive' : 'Corrective';
        $prioLabel  = e(ucfirst((string) ($d['priorite'] ?? 'normale')));
        $service    = e($d['direction_service'] ?? '—');
        $kmDemande  = isset($d['kilometrage']) && $d['kilometrage'] !== null
                        ? number_format((int) $d['kilometrage'], 0, ',', ' ') . ' km' : null;
        $statutVeh  = !empty($d['statut_vehicule']) ? e(ucfirst(str_replace('_', ' ', $d['statut_vehicule']))) : null;

        $anomalie   = nl2br(e($d['anomalie_constatee'] ?? '—'));
        $anomalieLiee = !empty($d['anomalie_description']) ? e($d['anomalie_description']) : null;
        $reco       = !empty($d['recommandation']) ? nl2br(e($d['recommandation'])) : null;
        $comment    = !empty($d['commentaire'])    ? nl2br(e($d['commentaire']))    : null;

        // ── Logo ─────────────────────────────────────────────────────────────
        $logoMain = $logoIntegre
            ? "<img src=\"cid:" . self::LOGO_CID . "\" width=\"36\" height=\"43\" alt=\"SGS\" style=\"display:block;border:0;\">"
            : $this->svgLogo(36, 43);
        $logoFoot = $logoIntegre
            ? "<img src=\"cid:" . self::LOGO_CID . "\" width=\"24\" height=\"29\" alt=\"SGS\" style=\"display:block;border:0;opacity:0.55;\">"
            : $this->svgLogo(24, 29, '#999999');

        // ── Blocs optionnels ─────────────────────────────────────────────────
        $optFields = '';
        if ($kmDemande) $optFields .= $this->field('Kilométrage relevé', $kmDemande);
        if ($statutVeh) $optFields .= $this->field('Statut véhicule demandé', $statutVeh);

        $blocTexte = function (string $titre, string $contenu, string $bg = '#f9fafb', string $border = '#e5e7eb'): string {
            return "<div style=\"background:{$bg};border:1px solid {$border};border-radius:6px;padding:12px 16px;margin-bottom:14px;\">"
                 . "<div style=\"font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;\">{$titre}</div>"
                 . "<div style=\"font-size:13px;color:#374151;line-height:1.65;\">{$contenu}</div></div>";
        };

        $blocsHtml  = $blocTexte('Anomalie constatée', $anomalie, $c['accentLight'], $c['accentBorder']);
        if ($anomalieLiee) $blocsHtml .= $blocTexte('Anomalie liée (signalement)', $anomalieLiee);
        if ($reco)         $blocsHtml .= $blocTexte('Recommandation', $reco);
        if ($comment)      $blocsHtml .= $blocTexte('Commentaire', $comment);

        $fieldNature   = $this->field('Nature', 'Externe');
        $fieldMaint    = $this->field('Type de maintenance', $typeMaint);
        $fieldInt      = $this->field("Type d'intervention", $typeInt);
        $fieldPrio     = $this->field('Priorité', $prioLabel);
        $fieldService  = $this->field('Direction / service', $service);
        $fieldDemandeur= $this->field('Demandeur', "{$demandeur} ({$demRole})");

        // ── HTML ─────────────────────────────────────────────────────────────
        return <<<HTML
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>  Demande d'intervention externe</title>
  <style>
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Helvetica,Arial,sans-serif; background:#f1f5f9; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; width:100%; }
    img { border:0; display:block; }
    a { text-decoration:none; color:inherit; }
    .ew { width:100%; padding:28px 16px; background:#f1f5f9; }
    .ec { width:100%; max-width:600px; margin:0 auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,.08); }
    .s-hdr  { padding:20px 28px; border-bottom:1px solid #f0f0f0; }
    .s-hero { padding:26px 28px; }
    .s-body { padding:26px 28px; }
    .s-foot { padding:16px 28px 20px; background:#f9fafb; border-top:1px solid #f0f0f0; }
    .hdr-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .hdr-logo { display:flex; align-items:center; gap:10px; }
    .vcard { display:flex; align-items:center; gap:14px; flex-wrap:wrap; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin-bottom:22px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .cta { display:inline-block; background:#111; color:#fff !important; font-size:13px; font-weight:600; letter-spacing:.4px; padding:13px 28px; border-radius:6px; text-align:center; }
    .foot-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .foot-right { margin-left:auto; text-align:right; }
    @media only screen and (max-width:480px) {
      .ew { padding:0 !important; }
      .ec { border-radius:0 !important; box-shadow:none !important; }
      .s-hdr, .s-hero, .s-body, .s-foot { padding:16px !important; }
      .hdr-row { flex-direction:column !important; align-items:flex-start !important; gap:12px !important; }
      .hero-title { font-size:16px !important; }
      .vcard { flex-direction:column !important; align-items:flex-start !important; }
      .grid2 { grid-template-columns:1fr !important; }
      .cta { display:block !important; width:100% !important; padding:14px 16px !important; }
      .foot-row { flex-direction:column !important; align-items:flex-start !important; }
      .foot-right { margin-left:0 !important; text-align:left !important; }
    }
  </style>
</head>
<body>
<div class="ew">
<div class="ec">

  <div style="height:4px;background:{$c['borderTop']};"></div>

  <!-- HEADER -->
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

  <!-- HERO -->
  <div class="s-hero" style="background:{$c['accentLight']};border-bottom:1px solid {$c['accentBorder']};">
    <div style="display:inline-block;background:{$c['tagBg']};color:{$c['tagText']};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:4px;margin-bottom:12px;">
      {$c['label']}
    </div>
    <div class="hero-title" style="font-size:18px;font-weight:700;color:#111;margin-bottom:10px;line-height:1.35;">
      Intervention externe 
    </div>
    <p style="font-size:14px;color:#4b5563;line-height:1.75;">
      Bonjour <strong style="color:#111;">{$destNom}</strong>,<br>
      La demande <strong style="color:{$c['accent']};">{$ref}</strong> concernant le véhicule <strong>{$immat}</strong>
      nécessite une <strong>intervention externe</strong>. 
    
    </p>
  </div>

  <!-- BODY -->
  <div class="s-body">

    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Véhicule concerné
    </div>
    <div class="vcard">
      <div style="width:44px;height:44px;border-radius:10px;background:{$c['accent']};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        
      </div>
      <div style="flex:1;min-width:120px;">
        <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:3px;">{$immat}</div>
        <div style="font-size:12px;color:#6b7280;">{$marqueMod}</div>
      </div>
      <div style="text-align:right;white-space:nowrap;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;">Kilométrage</div>
        <div style="font-size:12px;font-weight:600;color:#374151;">{$kmVeh}</div>
      </div>
    </div>

    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">
      Détails de la demande
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-left:3px solid {$c['accent']};border-radius:6px;padding:16px 18px;margin-bottom:22px;">
      <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:14px;">{$ref} · soumise le {$dateDem}</div>
      <div class="grid2">
        {$fieldNature}
        {$fieldPrio}
        {$fieldInt}
        {$fieldMaint}
        {$fieldDemandeur}
        {$fieldService}
        {$optFields}
      </div>
    </div>

    {$blocsHtml}

    <div style="text-align:center;margin:24px 0 20px;">
      <a href="{$pageUrl}" class="cta">Traiter la demande &rarr;</a>
      <div style="margin-top:10px;">
        <span style="font-size:11px;color:#9ca3af;">ou copiez ce lien&nbsp;: </span>
        <a href="{$pageUrl}" style="font-size:11px;color:{$c['accent']};word-break:break-all;">{$pageUrl}</a>
      </div>
    </div>

    <p style="font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;border-top:1px solid #f0f0f0;padding-top:16px;">
      Notification générée automatiquement le {$dateHeure} par {$appName}.<br>
      Ce message est informatif — merci de ne pas y répondre.
    </p>
  </div>

  <!-- FOOTER -->
  <div class="s-foot">
    <div class="foot-row">
      {$logoFoot}
      <div><div style="font-size:11px;color:#9ca3af;">noreply@sgs-gabon.com &mdash; Message automatique</div></div>
      <div class="foot-right">
        <div style="font-size:11px;color:#9ca3af;">&copy; {$annee} SGS — Tous droits réservés</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
          Destinataire&nbsp;: <span style="color:#6b7280;font-weight:500;">{$destNom}</span> ({$destRole})
        </div>
      </div>
    </div>
  </div>

</div>
</div>
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

        Log::warning('[MailDemandeInterventionExterne] logo.png introuvable (' . implode(' | ', $candidats) . ') — logo SVG de secours utilisé.');
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