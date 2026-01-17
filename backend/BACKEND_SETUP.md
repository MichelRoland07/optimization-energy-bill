# 🚀 Backend Setup Guide - Système d'Authentification Avancé

## 📋 Table des matières
1. [Installation des dépendances](#installation)
2. [Configuration](#configuration)
3. [Migration de la base de données](#migration)
4. [Création de l'admin](#admin)
5. [Démarrage du serveur](#démarrage)

---

## 📦 Installation

### 1. Créer un environnement virtuel

```bash
cd webapp/backend
python -m venv venv

# Activer l'environnement
# Sur Linux/Mac:
source venv/bin/activate
# Sur Windows:
venv\Scripts\activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

---

## ⚙️ Configuration

### 1. Créer le fichier `.env`

```bash
cp .env.example .env
```

### 2. Configurer les variables d'environnement

Éditez le fichier `.env` :

```env
# SECRET_KEY: Générez une clé secrète
# Sur Linux/Mac:
openssl rand -hex 32

# Copiez la sortie dans SECRET_KEY
SECRET_KEY=votre-clé-générée-ici

# Email Configuration (Gmail)
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-app-password

# Admin Email
ADMIN_EMAIL=admin@sabc.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Configuration Gmail (pour les emails)

1. Allez sur https://myaccount.google.com/apppasswords
2. Créez un "Mot de passe d'application"
3. Sélectionnez "Mail" et "Other"
4. Copiez le mot de passe généré
5. Mettez-le dans `MAIL_PASSWORD` dans `.env`

---

## 🗄️ Migration de la base de données

### Option 1: Nouveau projet (Alembic non initialisé)

```bash
# 1. Initialiser Alembic
alembic init alembic

# 2. Éditer alembic.ini
# Remplacer:
sqlalchemy.url = driver://user:pass@localhost/dbname
# Par:
sqlalchemy.url = sqlite:///./optimisation_sabc.db

# 3. Éditer alembic/env.py
# Ajouter après les imports:
from app.database import Base
from app.auth.models import User
from app.data.models import *  # Si vous avez d'autres modèles

# Remplacer:
target_metadata = None
# Par:
target_metadata = Base.metadata

# 4. Créer la migration initiale
alembic revision --autogenerate -m "Add advanced user model with permissions"

# 5. Appliquer la migration
alembic upgrade head
```

### Option 2: Projet existant (mise à jour du modèle User)

Si vous avez déjà une base de données avec l'ancien modèle User :

```bash
# 1. Créer une migration pour mettre à jour le modèle User
alembic revision --autogenerate -m "Update user model with professional fields and permissions"

# 2. Vérifier le fichier de migration généré dans alembic/versions/

# 3. Appliquer la migration
alembic upgrade head
```

### Option 3: Reset complet (développement uniquement)

```bash
# ⚠️ ATTENTION: Ceci supprime toutes les données!

# 1. Supprimer la base de données
rm optimisation_sabc.db

# 2. Supprimer les versions Alembic
rm -rf alembic/versions/*

# 3. Créer nouvelle migration
alembic revision --autogenerate -m "Initial migration with advanced auth"

# 4. Appliquer
alembic upgrade head
```

---

## 👤 Création de l'utilisateur admin

### Méthode 1: Script automatique (Recommandé)

```bash
python seed_admin.py
```

Sortie attendue:
```
Creating default admin user...
✅ Admin user created successfully!
   Email: admin@sabc.com
   Default Password: Admin@2024
   ⚠️  IMPORTANT: Please change this password after first login!
```

### Méthode 2: Manuellement via Python

```bash
python
```

```python
from app.database import SessionLocal
from app.auth.models import User
from app.auth.utils import get_password_hash
from datetime import datetime

db = SessionLocal()

admin = User(
    email="admin@sabc.com",
    username="admin",
    full_name="Administrateur SABC",
    titre="M.",
    poste="Administrateur Système",
    entreprise="SABC",
    role="admin",
    status="active",
    is_active=True,
    password_hash=get_password_hash("Admin@2024"),
    permissions={
        "view_profil": True,
        "view_reconstitution": True,
        "view_optimisation": True,
        "view_simulateur": True,
        "upload_data": True,
        "manage_users": True
    },
    created_at=datetime.utcnow()
)

db.add(admin)
db.commit()
print("Admin created!")
db.close()
```

---

## 🚀 Démarrage du serveur

### Mode développement

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Mode production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Le serveur démarre sur: `http://localhost:8000`

Documentation API: `http://localhost:8000/docs`

---

## ✅ Vérification de l'installation

### 1. Tester l'API

```bash
curl http://localhost:8000/docs
```

Vous devriez voir la documentation Swagger.

### 2. Tester le login admin

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sabc.com",
    "password": "Admin@2024"
  }'
```

Réponse attendue:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@sabc.com",
    "full_name": "Administrateur SABC",
    "role": "admin",
    "status": "active",
    ...
  }
}
```

### 3. Tester l'endpoint protégé

```bash
# Remplacez <TOKEN> par le token reçu ci-dessus
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔄 Flow complet de test

### 1. Registration (utilisateur normal)

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Jean Dupont",
    "titre": "Ing.",
    "poste": "Ingénieur Électrique",
    "entreprise": "SABC",
    "telephone": "+225 XX XX XX XX",
    "raison_demande": "Besoin d accéder aux analyses"
  }'
```

### 2. Login admin

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sabc.com",
    "password": "Admin@2024"
  }'
```

### 3. Lister les demandes pendantes (avec token admin)

```bash
curl -X GET "http://localhost:8000/api/auth/pending-requests" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 4. Approuver la demande

```bash
curl -X POST "http://localhost:8000/api/auth/approve-request/2" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

L'utilisateur reçoit un email avec un code OTP.

### 5. Activer le compte (utilisateur)

```bash
curl -X POST "http://localhost:8000/api/auth/activate" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "password": "SecurePass123!"
  }'
```

### 6. Login utilisateur

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## 📝 Nouveaux Endpoints Disponibles

### Public
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/activate` - Activation avec OTP
- `POST /api/auth/resend-otp` - Renvoyer OTP

### Protected
- `GET /api/auth/me` - Infos utilisateur actuel
- `POST /api/auth/logout` - Déconnexion

### Admin Only
- `GET /api/auth/pending-requests` - Demandes pendantes
- `POST /api/auth/approve-request/{id}` - Approuver demande
- `POST /api/auth/reject-request/{id}` - Rejeter demande
- `GET /api/auth/users` - Liste des utilisateurs
- `GET /api/auth/users/{id}` - Détails utilisateur
- `PUT /api/auth/users/{id}/permissions` - Modifier permissions
- `DELETE /api/auth/users/{id}` - Supprimer utilisateur

---

## 🔧 Troubleshooting

### Erreur: "Module 'fastapi_mail' not found"

```bash
pip install fastapi-mail aiosmtplib
```

### Erreur: "No such table: users"

```bash
alembic upgrade head
```

### Erreur Email: "Authentication failed"

- Vérifiez que vous utilisez un "App Password" et non votre mot de passe Gmail normal
- Activez "Less secure app access" (si nécessaire)
- Vérifiez `MAIL_USERNAME` et `MAIL_PASSWORD` dans `.env`

### L'admin ne peut pas se connecter

```bash
# Réinitialiser le mot de passe admin
python -c "
from app.database import SessionLocal
from app.auth.models import User
from app.auth.utils import get_password_hash

db = SessionLocal()
admin = db.query(User).filter(User.email == 'admin@sabc.com').first()
admin.password_hash = get_password_hash('Admin@2024')
db.commit()
print('Password reset!')
"
```

---

## 🎯 Prochaines étapes

1. ✅ Backend complété
2. ⏭️ Développer le frontend Next.js 14
3. ⏭️ Intégrer les 6 pages principales
4. ⏭️ Tests end-to-end

---

**Documentation créée le**: 2026-01-17
**Auteur**: Claude Sonnet 4.5
