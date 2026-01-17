# 🚀 Quick Start Guide

## ✅ État Actuel

**Backend** : ✅ Prêt
**Frontend** : ✅ Running sur http://localhost:3000
**Base de données** : ✅ Créée avec le nouveau schéma
**Admin** : ✅ Créé (admin@sabc.com / Admin@2024)

---

## 🎯 Démarrage Rapide

### 1. Backend (Terminal 1)

```bash
cd webapp/backend

# Si la DB n'existe pas encore ou est corrompue:
python create_admin_direct.py

# Démarrer le serveur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend API** : http://localhost:8000
**Documentation** : http://localhost:8000/docs

### 2. Frontend (Terminal 2)

```bash
cd webapp/frontend-nextjs
npm run dev
```

**Frontend** : http://localhost:3000

---

## 🔑 Credentials de Test

### Admin
- **Email** : admin@sabc.com
- **Password** : Admin@2024

---

## 🧪 Test du Flow Complet

### 1. Inscription (Registration)
1. Aller sur http://localhost:3000/register
2. Remplir le formulaire
3. Cliquer "Envoyer la demande"
4. Message de confirmation affiché

### 2. Admin Approval
1. Connectez-vous comme admin : http://localhost:3000/login
2. Allez sur `/admin/pending-requests` (à créer)
3. Approuver la demande
4. OTP envoyé par email (vérifier logs backend)

### 3. Activation
1. Utiliser la page `/activate` (à créer)
2. Entrer email + OTP + nouveau password
3. Compte activé

### 4. Login Normal
1. http://localhost:3000/login
2. Email + Password
3. Redirection vers dashboard

---

## 📝 API Endpoints Disponibles

### Public
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/activate` - Activation OTP
- `POST /api/auth/resend-otp` - Renvoyer OTP

### Protected
- `GET /api/auth/me` - User actuel
- `POST /api/auth/logout` - Déconnexion

### Admin Only
- `GET /api/auth/pending-requests` - Demandes pendantes
- `POST /api/auth/approve-request/{id}` - Approuver
- `POST /api/auth/reject-request/{id}` - Rejeter
- `GET /api/auth/users` - Liste users
- `PUT /api/auth/users/{id}/permissions` - Modifier permissions

---

## 🐛 Troubleshooting

### Backend ne démarre pas
```bash
# Recréer la base de données
python create_admin_direct.py

# Vérifier les dépendances
pip install -r requirements.txt
```

### Frontend erreur de compilation
```bash
cd webapp/frontend-nextjs
rm -rf node_modules .next
npm install
npm run dev
```

### Base de données corrompue
```bash
rm optimisation_sabc.db
python create_admin_direct.py
```

---

## 📂 Structure

```
webapp/
├── backend/
│   ├── app/
│   │   ├── auth/          # Auth system
│   │   ├── core/          # Email service
│   │   ├── data/          # Data endpoints
│   │   ├── optimisation/  # Optimization endpoints
│   │   └── simulateur/    # Simulator endpoints
│   ├── create_admin_direct.py  # ✅ Use this to create admin
│   └── run.py             # Start server
│
└── frontend-nextjs/
    ├── app/
    │   ├── login/         # ✅ Login page
    │   ├── register/      # ✅ Register page
    │   ├── activate/      # ⏳ To create
    │   ├── admin/         # ⏳ Admin pages
    │   └── dashboard/     # ⏳ Main pages
    ├── components/        # ✅ UI components
    ├── services/          # ✅ API services
    └── store/             # ✅ State management
```

---

## ✅ Pages Complétées

- ✅ `/` - Redirection automatique
- ✅ `/login` - Connexion
- ✅ `/register` - Inscription

## ⏳ Pages À Créer

- ⏳ `/activate` - Activation OTP
- ⏳ `/admin/pending-requests` - Gérer demandes
- ⏳ `/admin/users` - Gérer utilisateurs
- ⏳ `/dashboard/*` - 6 pages principales

---

**Dernière mise à jour** : 2026-01-17
