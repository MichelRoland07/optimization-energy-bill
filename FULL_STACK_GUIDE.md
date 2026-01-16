# Guide Complet - Application Full Stack SABC

## 🎉 Application Complète Implémentée!

Frontend React + Backend FastAPI avec **tous les graphiques** de votre application Streamlit.

---

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend

```bash
cd webapp/backend
python run.py
```

Backend disponible sur: **http://localhost:8000**
Documentation: **http://localhost:8000/docs**

### 2. Démarrer le Frontend

```bash
cd webapp/frontend
npm install  # (première fois seulement)
npm run dev
```

Frontend disponible sur: **http://localhost:3000**

### 3. Se Connecter

- **URL**: http://localhost:3000
- **Username**: admin
- **Password**: admin123

---

## 📊 Fonctionnalités Implémentées

### ✅ Backend (FastAPI)

**Endpoints:**

1. **Authentication**
   - `POST /api/auth/login` - Login avec JWT
   - `GET /api/auth/me` - Infos utilisateur

2. **Data Management**
   - `POST /api/data/upload` - Upload Excel
   - `POST /api/data/select-service` - Sélection service
   - `GET /api/data/synthese?year=2025` - Tableau synthèse
   - `GET /api/data/graphiques?year=2025` - **Données pour graphiques**

3. **Refacturation**
   - `GET /api/refacturation?year=2025` - Comparaison factures

4. **Optimisation**
   - `GET /api/optimisation/config-actuelle` - Config actuelle
   - `POST /api/optimisation/simulate` - Simulation

**Nouveautés:**
- ✨ Endpoint `/api/data/graphiques` qui retourne toutes les données pour les 5 graphiques
- Format Plotly-compatible pour React
- Métriques calculées (consommation totale, puissance max, etc.)

### ✅ Frontend (React)

**Pages:**

1. **🔐 Login** - Authentification moderne avec design gradient
2. **📤 Upload** - Import Excel avec détection multi-services
3. **📊 Synthèse** - 5 graphiques interactifs + tableau
4. **💰 Refacturation** - Tableau avec gaps mis en évidence
5. **⚙️ Optimisation** - Simulation avec comparaison mensuelle

**Graphiques (Plotly.js):**

1. **Consommation mensuelle** - Line chart avec fill
2. **Heures creuses vs Pointe** - Stacked bar chart
3. **Puissance atteinte vs souscrite** - Dual line chart
4. **Facturation et consommation** - Dual axis (bar + line)
5. **Cos(φ)** - Dual axis avec métriques

**Design:**
- Interface moderne et responsive
- Navigation par onglets
- Cartes métriques
- Tables interactives
- Messages d'erreur/warning
- Loading states

---

## 📁 Structure Complète

```
webapp/
├── backend/
│   ├── app/
│   │   ├── auth/              # Authentication
│   │   ├── data/              # Data management + GRAPHIQUES
│   │   ├── refacturation/     # Invoice comparison
│   │   ├── optimisation/      # Power simulation
│   │   └── core/              # Business logic
│   ├── run.py
│   ├── test_complete.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Chart.jsx      # Plotly wrapper
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── UploadPage.jsx
    │   │   ├── SynthesePage.jsx    # 5 GRAPHIQUES!
    │   │   ├── RefacturationPage.jsx
    │   │   └── OptimisationPage.jsx
    │   ├── services/
    │   │   └── api.js         # Axios API client
    │   ├── App.jsx
    │   └── main.jsx
    ├── vite.config.js
    └── package.json
```

---

## 🎨 Aperçu des Pages

### 1. Page de Login
- Design moderne avec gradient violet
- Formulaire centré
- Gestion des erreurs

### 2. Dashboard avec Navigation
- Header avec logo et infos client
- Tabs: Upload | Synthèse | Refacturation | Optimisation
- Logout button

### 3. Page Upload
- Drag & drop zone pour Excel
- Détection automatique multi-services
- Cartes de sélection pour chaque service
- Validation des colonnes

### 4. Page Synthèse ⭐
- **4 métriques en haut**: Consommation, Puissance max, Facture, Dépassements
- **5 graphiques Plotly interactifs**:
  1. Consommation mensuelle (line+fill)
  2. HC vs HP (stacked bars)
  3. Puissance atteinte vs souscrite (dual lines)
  4. Facturation + Consommation (dual axis)
  5. Cos(φ) + Consommation (dual axis) avec warning si < 0.85
- **Tableau de synthèse** mensuel
- Sélecteur d'année

### 5. Page Refacturation
- 4 métriques: Facture réelle, recalculée, gap, gap %
- Tableau mensuel avec lignes surlignées (gaps > 100 FCFA)
- Dépassements en rouge

### 6. Page Optimisation
- Config actuelle (7 métriques)
- Formulaire de simulation
- Warning si nouvelle puissance < max atteinte
- Comparaison visuelle: Actuel → Simulé → Économies
- Tableau mensuel détaillé

---

## 🔧 Technologies

### Backend
- FastAPI 0.109
- SQLAlchemy (SQLite)
- Pandas, Numpy
- JWT (python-jose)
- bcrypt

### Frontend
- React 18
- React Router 6
- Axios
- Plotly.js + react-plotly.js
- Vite

---

## 📊 Flux de Données

```
1. User Login → JWT Token
              ↓
2. Upload Excel → Multi-service detection
              ↓
3. Select Service → Process data
              ↓
4. APIs:
   ├─ /graphiques → 5 graphs data
   ├─ /synthese → table data
   ├─ /refacturation → comparison
   └─ /optimisation → simulation
              ↓
5. React renders Plotly charts
```

---

## 🎯 Différences avec Streamlit

| Aspect | Streamlit | React |
|--------|-----------|-------|
| **Backend** | Intégré | FastAPI séparé |
| **Frontend** | Streamlit UI | React custom |
| **Graphiques** | st.plotly_chart | react-plotly.js |
| **État** | Session state | localStorage + React state |
| **API** | Aucune | RESTful JSON |
| **Auth** | Basique | JWT tokens |
| **Multi-user** | Limité | Scalable |

### ✅ Avantages React:

- **Scalabilité**: Backend/Frontend séparés
- **Performance**: SPA, pas de rechargement
- **Professionalisme**: Design moderne
- **Déploiement**: Frontend/Backend indépendants
- **Multi-user**: Sessions JWT
- **API**: Réutilisable par d'autres clients

---

## 🧪 Tests

### Backend
```bash
cd webapp/backend
python test_complete.py
```

### Frontend
Ouvrir http://localhost:3000 et tester:
1. ✅ Login
2. ✅ Upload Excel (Multi_company.xlsx)
3. ✅ Sélection service
4. ✅ Synthèse avec 5 graphiques
5. ✅ Refacturation avec gaps
6. ✅ Optimisation avec simulation

---

## 🚀 Déploiement Production

### Backend

```bash
# 1. Changer les secrets (.env)
SECRET_KEY=<random-key>
ADMIN_PASSWORD=<strong-password>

# 2. PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db

# 3. Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend

```bash
# 1. Build
npm run build

# 2. Serve (nginx, caddy, etc.)
# dist/ contient les fichiers statiques
```

### Docker (Optionnel)

Créer `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://...

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

---

## 📝 Notes Importantes

### Backend
- Données en mémoire (session_manager)
- Pour production: Redis ou DB
- CORS configuré pour localhost:3000

### Frontend
- Token JWT dans localStorage
- Auto-logout si 401/403
- Proxy Vite vers backend (dev)
- Build pour production change les URLs

### Graphiques
- Tous générés côté backend
- Format Plotly-compatible
- Responsive (100% width)
- Interactifs (zoom, pan, hover)

---

## 🎨 Personnalisation

### Couleurs
Fichier: `frontend/src/pages/*.jsx`
```javascript
const primaryColor = '#667eea';  // Violet
const successColor = '#27ae60';  // Vert
const errorColor = '#e74c3c';    // Rouge
```

### Graphiques
Fichier: `frontend/src/components/Chart.jsx`
Modifier layout, colors, etc.

### Backend
Fichier: `backend/app/settings.py`
Configuration centralisée

---

## 🐛 Troubleshooting

### Backend ne démarre pas
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend ne démarre pas
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Graphiques ne s'affichent pas
- Vérifier que le backend est démarré
- Check console browser (F12)
- Vérifier `/api/data/graphiques?year=2025`

### CORS errors
- Backend: vérifier `FRONTEND_URL` dans settings
- Frontend: vérifier proxy dans `vite.config.js`

---

## 📚 Documentation

- **Backend API**: http://localhost:8000/docs
- **Backend README**: `backend/API_DOCUMENTATION.md`
- **Backend Summary**: `backend/IMPLEMENTATION_SUMMARY.md`
- **Frontend README**: `frontend/README.md`
- **Ce guide**: `FULL_STACK_GUIDE.md`

---

## ✨ Prochaines Étapes Possibles

### Court terme:
- [ ] Tests E2E (Playwright, Cypress)
- [ ] Export PDF/Excel des résultats
- [ ] Thème sombre (dark mode)
- [ ] Responsive mobile amélioré

### Moyen terme:
- [ ] Multi-utilisateurs avec rôles
- [ ] Historique des simulations
- [ ] Comparaison entre années
- [ ] Notifications email

### Long terme:
- [ ] Dashboard admin
- [ ] Analyse prédictive (ML)
- [ ] API publique
- [ ] Application mobile

---

## 🎉 Conclusion

Vous avez maintenant une **application web complète** avec:

✅ Backend FastAPI professionnel
✅ Frontend React moderne
✅ **5 graphiques Plotly interactifs** (comme Streamlit)
✅ Authentication JWT
✅ Upload multi-services
✅ Refacturation avec détection gaps
✅ Optimisation avec simulation
✅ Design moderne et responsive

**Tout est prêt pour la production!** 🚀

---

## 📞 Support

Pour toute question:
- Backend: Voir `backend/API_DOCUMENTATION.md`
- Frontend: Voir `frontend/README.md`
- Swagger UI: http://localhost:8000/docs

**Bon développement! 💻⚡**
