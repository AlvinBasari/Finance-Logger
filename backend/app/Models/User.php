<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isLoger(): bool
    {
        return in_array($this->role, ['loger', 'logger', 'admin']);
    }

    public function isLogger(): bool
    {
        return $this->isLoger();
    }

    public function isFp(): bool
    {
        return in_array($this->role, ['fp', 'supervisor', 'admin']);
    }

    public function isSupervisor(): bool
    {
        return $this->isFp();
    }

    public function isWare(): bool
    {
        return in_array($this->role, ['ware', 'warehouse', 'admin']);
    }

    public function isWarehouse(): bool
    {
        return $this->isWare();
    }
}
