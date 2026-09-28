<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Jenssegers\Agent\Agent;

class HistoriqueConnexion extends Model
{
    protected $fillable = [
        'user_id', 'personal_access_token_id', 'adresse_ip', 'user_agent', 'login_at', 'logout_at',
    ];

    protected $casts = [
        'login_at'  => 'datetime',
        'logout_at' => 'datetime',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    public function getIsActiveAttribute(): bool
    {
        return is_null($this->logout_at);
    }

    public function getDureeMinsAttribute(): int
    {
        $fin = $this->logout_at ?? now();
        return max(0, (int) $this->login_at->diffInMinutes($fin));
    }

    public function getIsExterneAttribute(): bool
    {
        if (!$this->adresse_ip) return false;
        return !collect(['192.168.', '10.', '127.', '172.16.'])
            ->contains(fn ($p) => str_starts_with($this->adresse_ip, $p));
    }

    public function parsedAgent(): array
    {
        $agent = new Agent();
        $agent->setUserAgent($this->user_agent);
        $browser  = $agent->browser();
        $platform = $agent->platform();
        return [
            'navigateur'         => $browser ?: 'Inconnu',
            'navigateur_version' => $agent->version($browser),
            'os'                 => $platform ?: 'Inconnu',
            'os_version'         => $agent->version($platform),
        ];
    }
}