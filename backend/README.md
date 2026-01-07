# Logistiga Backend - Laravel 11 API

## Installation

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

## Utilisateur Admin par défaut

- **Email:** admin@logistiga.com
- **Mot de passe:** Admin@123

## Structure

```
backend/
├── app/
│   ├── Http/Controllers/Api/   # Contrôleurs API
│   ├── Models/                 # Modèles Eloquent
│   └── Services/               # Services métier
├── database/
│   ├── migrations/             # Migrations
│   └── seeders/                # Seeders
├── routes/
│   └── api.php                 # Routes API
└── config/                     # Configuration
```

## API Endpoints

- `POST /api/auth/login` - Connexion
- `GET /api/clients` - Liste clients
- `GET /api/devis` - Liste devis
- `GET /api/ordres` - Liste ordres
- `GET /api/factures` - Liste factures
- ... voir routes/api.php pour la liste complète
