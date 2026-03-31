<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>{{ $appName ?? 'SGS Fleetify' }} — Alerte Document Véhicule</title>

    {{-- Google Fonts --}}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

    {{-- Feuille de style externalisée --}}
    <link rel="stylesheet" href="{{ asset('assets/css/email-document-vehicule.css') }}" />
</head>
<body>

{{-- Canvas particules (JS) --}}
<canvas id="particles-canvas"></canvas>

<div class="email-wrapper">
<div class="email-container" id="emailContainer">

    {{-- ══════════════════════════════════════════════ --}}
    {{-- TOP BAR                                        --}}
    {{-- ══════════════════════════════════════════════ --}}
    <div class="top-bar {{ $statut }}"></div>

    {{-- ══════════════════════════════════════════════ --}}
    {{-- HEADER                                         --}}
    {{-- ══════════════════════════════════════════════ --}}
    <div class="header">
        <div class="header-logo-block">
            <img
                src="{{ asset('storage/logo.png') }}"
                alt="SGS Logo"
                class="logo-img"
                width="52"
                height="52"
            />
            <div class="header-brand">
                <div class="header-brand-name">SGS</div>
                <div class="header-brand-sub">Parc Automobile · Fleetify</div>
            </div>
        </div>

        <span class="header-alert-pill {{ $statut }}">
            <span class="pill-dot"></span>
            @if($statut === 'expire')
                Document Expiré
            @else
                Expire Bientôt
            @endif
        </span>
    </div>

    {{-- ══════════════════════════════════════════════ --}}
    {{-- HERO BAND                                      --}}
    {{-- ══════════════════════════════════════════════ --}}
    <div class="hero-band {{ $statut }}">

        <div class="hero-tag {{ $statut }}">
            @if($statut === 'expire')
                ⚠ Alerte Critique
            @else
                ⏳ Alerte Préventive
            @endif
        </div>

        <div class="hero-title">
            @if($statut === 'expire')
                Document expiré — action immédiate requise
            @else
                Document expire bientôt — renouvellement requis
            @endif
        </div>

        <p class="hero-sub">
            Bonjour <strong>{{ $destinataire['nom'] }}</strong>,<br>
            le document <strong>« {{ $document['nom_document'] }} »</strong>
            du véhicule <strong>{{ $vehicule['immatriculation'] }}</strong>

            @if($statut === 'expire')
                a expiré il y a
                <strong>{{ abs($joursRestants) }} jour{{ abs($joursRestants) > 1 ? 's' : '' }}</strong>.
                Ce véhicule <strong>ne peut pas circuler légalement</strong>
                tant que ce document n'est pas renouvelé.
            @else
                expire dans
                <strong>{{ $joursRestants }} jour{{ $joursRestants > 1 ? 's' : '' }}</strong>.
                Veuillez procéder au renouvellement avant la date d'échéance.
            @endif
        </p>

        {{-- Compteur jours --}}
        <div class="countdown {{ $statut }}" id="countdown">
            <span class="countdown-number" id="countdown-number">
                @if($statut === 'expire')
                    −{{ abs($joursRestants) }}
                @else
                    {{ $joursRestants }}
                @endif
            </span>
            <span class="countdown-label">
                jour{{ (abs($joursRestants) > 1) ? 's' : '' }}
                @if($statut === 'expire') de retard @else restant(s) @endif
            </span>
        </div>
    </div>

    {{-- ══════════════════════════════════════════════ --}}
    {{-- BODY                                           --}}
    {{-- ══════════════════════════════════════════════ --}}
    <div class="email-body">

        {{-- ── Véhicule concerné ── --}}
        <div class="section-label">Véhicule concerné</div>

        <div class="vehicle-card">
            <div class="vehicle-plate">{{ $vehicule['immatriculation'] }}</div>

            <div class="vehicle-info">
                <div class="vehicle-name">
                    {{ $vehicule['marque'] ?? '—' }}
                    @if(!empty($vehicule['modele'])) {{ $vehicule['modele'] }} @endif
                </div>
                <div class="vehicle-meta">
                    Direction : <span>{{ $vehicule['direction'] ?? '—' }}</span><br>
                    @if(!empty($vehicule['categorie']))
                        Catégorie : <span>{{ $vehicule['categorie'] }}</span>
                    @endif
                </div>
            </div>

            <div class="vehicle-status">
                {{ $vehicule['statut'] ?? 'Disponible' }}
            </div>
        </div>

        {{-- ── Détails du document ── --}}
        <div class="section-label">Détails du document</div>

        <div class="doc-block">
            <div class="doc-title">{{ $document['nom_document'] }}</div>

            <div class="doc-grid">
                <div class="doc-field">
                    <div class="doc-field-label">Type de document</div>
                    <div class="doc-field-value">
                        {{ ucfirst(str_replace('_', ' ', $document['type_document'])) }}
                    </div>
                </div>

                @if(!empty($document['compagnie_assurance']))
                <div class="doc-field">
                    <div class="doc-field-label">Compagnie d'assurance</div>
                    <div class="doc-field-value">{{ $document['compagnie_assurance'] }}</div>
                </div>
                @endif

                @if(!empty($document['numero_contrat']))
                <div class="doc-field">
                    <div class="doc-field-label">N° de contrat</div>
                    <div class="doc-field-value">{{ $document['numero_contrat'] }}</div>
                </div>
                @endif

                @if(!empty($document['type_couverture']))
                <div class="doc-field">
                    <div class="doc-field-label">Type de couverture</div>
                    <div class="doc-field-value">{{ $document['type_couverture'] }}</div>
                </div>
                @endif

                @if(!empty($document['montant_prime']))
                <div class="doc-field">
                    <div class="doc-field-label">Prime d'assurance</div>
                    <div class="doc-field-value">
                        {{ number_format($document['montant_prime'], 0, ',', ' ') }} CFA
                    </div>
                </div>
                @endif

                @if(!empty($document['date_emission']))
                <div class="doc-field">
                    <div class="doc-field-label">Date d'émission</div>
                    <div class="doc-field-value">
                        {{ \Carbon\Carbon::parse($document['date_emission'])->format('d/m/Y') }}
                    </div>
                </div>
                @endif

                <div class="doc-field">
                    <div class="doc-field-label">Date d'expiration</div>
                    <div class="doc-field-value {{ $statut === 'expire' ? 'danger' : 'warning' }}">
                        {{ \Carbon\Carbon::parse($document['date_expiration'])->format('d/m/Y') }}
                        @if($statut === 'expire')
                            &nbsp;· EXPIRÉE
                        @else
                            &nbsp;· J−{{ $joursRestants }}
                        @endif
                    </div>
                </div>
            </div>
        </div>

        <div class="divider"></div>

        {{-- ── CTA ── --}}
        @if(!empty($appUrl))
        <div class="cta-row">
            <a
                href="{{ $appUrl }}/admin/vehicules/{{ $vehicule['immatriculation'] }}"
                class="cta-btn"
            >
                Accéder à la fiche véhicule →
            </a>
        </div>
        @endif

        <p class="auto-note">
            Alerte générée automatiquement le {{ now()->format('d/m/Y à H\hi') }} par Fleetify SGS.<br>
            Cet email est envoyé automatiquement — merci de ne pas y répondre.
        </p>

    </div>{{-- /email-body --}}

    {{-- ══════════════════════════════════════════════ --}}
    {{-- FOOTER                                         --}}
    {{-- ══════════════════════════════════════════════ --}}
    <div class="email-footer">
        <div class="footer-top">
            <img
                src="{{ asset('storage/logo.png') }}"
                alt="SGS"
                class="footer-logo-img"
                width="36"
                height="36"
            />
            <div class="footer-brand-col">
                <div class="footer-brand-name">SGS</div>
                <div class="footer-brand-tagline">Système de Gestion du Parc Automobile</div>
            </div>
            <div class="footer-noreply">
                <strong>noreply@sgs-gabon.com</strong>
                Message automatique
            </div>
        </div>

        <div class="footer-bottom">
            <div class="footer-legal">
                © {{ $annee ?? now()->year }} SGS — Tous droits réservés.
                Cet email et son contenu sont strictement confidentiels.
            </div>
            <div class="footer-recipient">
                Destinataire :
                <strong>{{ $destinataire['nom'] }}</strong>
                ({{ $destinataire['role_libelle'] ?? 'Gestionnaire' }})
            </div>
        </div>
    </div>

    <div class="bottom-bar"></div>

</div>{{-- /email-container --}}
</div>{{-- /email-wrapper --}}


{{-- ============================================================
     JAVASCRIPT — Animations & Particules
     ============================================================ --}}
<script>
(function () {
    'use strict';

    // ── 1. Animation d'entrée du container ──────────────────
    const container = document.getElementById('emailContainer');
    if (container) {
        requestAnimationFrame(() => {
            setTimeout(() => container.classList.add('visible'), 80);
        });
    }

    // ── 2. Détection du statut ───────────────────────────────
    const isExpire = document.querySelector('.top-bar.expire') !== null;
    const goldColor   = '#f5c400';
    const accentColor = isExpire ? '#dc2626' : '#d97706';

    // ── 3. Canvas particules ─────────────────────────────────
    const canvas  = document.getElementById('particles-canvas');
    const ctx     = canvas.getContext('2d');
    let W, H, particles = [], animId;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createParticle() {
        const isGold = Math.random() > 0.4;
        return {
            x:     Math.random() * W,
            y:     Math.random() * H,
            r:     Math.random() * 1.6 + 0.3,
            color: isGold ? goldColor : accentColor,
            vx:    (Math.random() - 0.5) * 0.25,
            vy:    -(Math.random() * 0.4 + 0.1),
            alpha: Math.random() * 0.4 + 0.05,
            // variation d'opacité (scintillement)
            dAlpha: (Math.random() - 0.5) * 0.005,
        };
    }

    function initParticles(count) {
        particles = [];
        for (let i = 0; i < count; i++) particles.push(createParticle());
    }

    function drawParticle(p) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function tick() {
        ctx.clearRect(0, 0, W, H);

        particles.forEach((p, i) => {
            p.x    += p.vx;
            p.y    += p.vy;
            p.alpha += p.dAlpha;

            // Rebond alpha
            if (p.alpha <= 0.03 || p.alpha >= 0.45) p.dAlpha *= -1;

            // Reset si sortie d'écran
            if (p.y < -10 || p.x < -10 || p.x > W + 10) {
                particles[i] = createParticle();
                particles[i].y = H + 10;
            }

            drawParticle(p);
        });

        animId = requestAnimationFrame(tick);
    }

    window.addEventListener('resize', () => {
        resize();
        initParticles(70);
    });

    resize();
    initParticles(70);
    tick();

    // ── 4. Animation du compteur (effet odométre) ────────────
    const countEl = document.getElementById('countdown-number');
    if (countEl) {
        const target   = parseInt(countEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        const isNeg    = countEl.textContent.trim().startsWith('−');
        const prefix   = isNeg ? '−' : '';
        const duration = 1200;
        const start    = performance.now();

        function animateCount(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Easing easeOutExpo
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.round(ease * target);
            countEl.textContent = prefix + current;
            if (progress < 1) requestAnimationFrame(animateCount);
            else countEl.textContent = prefix + target;
        }

        countEl.textContent = prefix + '0';
        setTimeout(() => requestAnimationFrame(animateCount), 600);
    }

    // ── 5. Hover sur le bouton CTA ───────────────────────────
    const cta = document.querySelector('.cta-btn');
    if (cta) {
        cta.addEventListener('mouseenter', () => {
            cta.style.transform = 'translateY(-2px) scale(1.01)';
            cta.style.boxShadow = '0 8px 30px rgba(245,196,0,0.55), 0 2px 8px rgba(0,0,0,0.3)';
        });
        cta.addEventListener('mouseleave', () => {
            cta.style.transform = '';
            cta.style.boxShadow = '';
        });
    }

    // ── 6. Légère rotation du logo au hover ─────────────────
    const logo = document.querySelector('.logo-img');
    if (logo) {
        logo.addEventListener('mouseenter', () => {
            logo.style.transition = 'filter 0.4s ease, transform 0.4s ease';
            logo.style.transform  = 'scale(1.08) rotate(3deg)';
        });
        logo.addEventListener('mouseleave', () => {
            logo.style.transform = '';
        });
    }

})();
</script>

</body>
</html>