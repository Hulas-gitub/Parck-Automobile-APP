<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * MailDocumentVehicule
 *
 * Email envoyé aux rôles admin et chef_parc lorsqu'un document véhicule
 * est sur le point d'expirer ou a déjà expiré.
 *
 * Statuts possibles :
 *   - 'expire'         : document déjà expiré
 *   - 'expire_bientot' : expire dans <= 30 jours
 */
class MailDocumentVehicule extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param array $document    Données du document
     * @param array $vehicule    Données du véhicule
     * @param array $destinataire Données du destinataire (nom, email, role_libelle)
     * @param string $statut     'expire' | 'expire_bientot'
     * @param int $joursRestants Nombre de jours avant expiration (négatif si déjà expiré)
     */
    public function __construct(
        public readonly array  $document,
        public readonly array  $vehicule,
        public readonly array  $destinataire,
        public readonly string $statut,
        public readonly int    $joursRestants,
    ) {}

    public function envelope(): Envelope
    {
        $prefix = $this->statut === 'expire'
            ? '🔴 [EXPIRÉ]'
            : '🟠 [EXPIRE BIENTÔT]';

        $subject = "{$prefix} Document véhicule — {$this->vehicule['immatriculation']} · {$this->document['nom_document']}";

        return new Envelope(
            subject: $subject,
            replyTo: config('mail.from.address'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.document-vehicule',
            with: [
                'document'      => $this->document,
                'vehicule'      => $this->vehicule,
                'destinataire'  => $this->destinataire,
                'statut'        => $this->statut,
                'joursRestants' => $this->joursRestants,
                'appName'       => config('app.name', 'Fleetify SGS'),
                'appUrl'        => config('app.url'),
                'annee'         => date('Y'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}