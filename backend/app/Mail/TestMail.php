<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $content;

    public function __construct($content = null)
    {
        $this->content = $content ?? "Ceci est un email de test envoyé depuis Fleetify SGS.\n\nSi vous recevez ce message, la configuration SMTP fonctionne correctement.\n\nDate d'envoi: " . now()->format('d/m/Y H:i:s');
    }

    public function build()
    {
        return $this->from(config('mail.from.address'), config('mail.from.address'))
                    ->subject('Test Email - Fleetify SGS')
                    ->text('emails.test');
    }
}