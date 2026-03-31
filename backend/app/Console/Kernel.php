$schedule->command('vehicules:check-documents')->dailyAt('07:00');
protected $commands = [
    \App\Console\Commands\CheckDocumentsExpiration::class,
];