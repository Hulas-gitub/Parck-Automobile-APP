<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Exception;

class MailService
{
    /**
     * Envoie un email de test
     *
     * @param string $to Email destinataire
     * @param string|null $subject Sujet du mail
     * @return array
     */
    public function sendTestEmail(string $to, ?string $subject = null): array
    {
        try {
            $subject = $subject ?? 'Test Email - Fleetify SGS';
            
            Mail::raw(
                "Ceci est un email de test envoyé depuis Fleetify SGS.\n\n" .
                "Si vous recevez ce message, la configuration SMTP fonctionne correctement.\n\n" .
                "Date d'envoi: " . now()->format('d/m/Y H:i:s') . "\n" .
                "Serveur: " . config('mail.host') . "\n" .
                "Port: " . config('mail.port'),
                function ($message) use ($to, $subject) {
                    $message->to($to)->subject($subject);
                }
            );

            Log::info("Email de test envoyé avec succès à: {$to}");

            return [
                'success' => true,
                'message' => "Email envoyé avec succès à {$to}",
                'config' => [
                    'host' => config('mail.host'),
                    'port' => config('mail.port'),
                    'from' => config('mail.from.address'),
                ]
            ];

        } catch (Exception $e) {
            Log::error("Erreur d'envoi d'email: " . $e->getMessage());

            return [
                'success' => false,
                'message' => "Erreur lors de l'envoi: " . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     *
     * @param string $to Email destinataire
     * @param string $subject Sujet
     * @param string $content Contenu HTML
     * @return bool
     */
    public function sendNotification(string $to, string $subject, string $content): bool
    {
        try {
            Mail::html($content, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });

            Log::info("Email de notification envoyé à: {$to}");
            return true;

        } catch (Exception $e) {
            Log::error("Erreur notification email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Teste la connexion SMTP
     *
     * @return array
     */
    public function testConnection(): array
    {
        try {
            $transport = Mail::getSwiftMailer()->getTransport();
            $transport->start();

            return [
                'success' => true,
                'message' => 'Connexion SMTP réussie',
                'host' => config('mail.host'),
                'port' => config('mail.port'),
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Échec de connexion SMTP',
                'error' => $e->getMessage()
            ];
        }
    }
}