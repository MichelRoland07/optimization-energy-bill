# Energy Optimization API Documentation

## Overview

Backend API for SABC Energy Optimization and Billing Analysis application.

**Base URL:** `http://localhost:8000`

**Interactive Documentation:** `http://localhost:8000/docs` (Swagger UI)

## Architecture

- **Framework:** FastAPI
- **Database:** SQLite (development) - upgradeable to PostgreSQL
- **Authentication:** JWT Bearer tokens
- **Session Management:** In-memory storage per user
- **Data Processing:** Pandas-based calculations

## Authentication

### POST `/api/auth/login`

Login with username and password to receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "created_at": "2026-01-15T21:48:54.091220",
    "last_login": "2026-01-16T03:54:05.752380"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

### GET `/api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "created_at": "2026-01-15T21:48:54.091220",
  "last_login": "2026-01-16T03:54:05.752380"
}
```

**Error Responses:**
- `403 Forbidden` - Missing or invalid token
- `401 Unauthorized` - User not found

---

## Data Management

### POST `/api/data/upload`

Upload Excel file containing energy consumption data.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request:**
- File: Excel file (.xlsx or .xls)

**Required Columns:**
- SERVICE_NO
- CUST_NAME
- REGION
- DIVISION
- AGENCE
- READING_DATE
- SUBSCRIPTION_LOAD
- PUISSANCE_ATTEINTE
- MV_CONSUMPTION
- ACTIVE_OFF_PEAK_IMP
- ACTIVE_PEAK_IMP
- ACTIVE_OFF_PEAK_EXP
- ACTIVE_PEAK_EXP
- AMOUNT_WITHOUT_TAX
- AMOUNT_WITH_TAX

**Response (200 OK) - Single Service:**
```json
{
  "single_service": true,
  "service_no": "201750454",
  "nom_client": "SOCAVER",
  "data_ready": true
}
```

**Response (200 OK) - Multiple Services:**
```json
{
  "single_service": false,
  "services": [
    {
      "service_no": "201750454",
      "nom_client": "SOCAVER",
      "region": "DCUD",
      "puissance": 3200.0,
      "nb_lignes": 36
    },
    {
      "service_no": "203486623",
      "nom_client": "SOCIETE ANONYME DES BOISSONS DU CAMEROUN",
      "region": "DCUD",
      "puissance": 100.0,
      "nb_lignes": 36
    }
  ],
  "data_ready": false
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file format or missing columns
- `500 Internal Server Error` - Processing error

---

### POST `/api/data/select-service`

Select a specific service from a multi-service file.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "service_no": "201750454"
}
```

**Response (200 OK):**
```json
{
  "data_ready": true,
  "service_no": "201750454",
  "nom_client": "SOCAVER"
}
```

**Error Responses:**
- `404 Not Found` - No uploaded data or service not found

---

### GET `/api/data/synthese`

Get monthly synthesis table for a specific year.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `year` (required): Year to analyze (e.g., 2025)

**Response (200 OK):**
```json
{
  "year": 2025,
  "nom_client": "SOCAVER",
  "service_no": "201750454",
  "tableau": [
    {
      "Mois": "Énergie (kWh)",
      "Année 2025": 27154277,
      "1": 2753086.0,
      "2": 2580258.0,
      "3": 2555396.0,
      "4": 2839123.0,
      "5": 2804261.0,
      "6": 2123479.0,
      "7": 1555863.0,
      "8": 1567777.0,
      "9": 1138399.0,
      "10": 1907734.0,
      "11": 2573911.0,
      "12": 2754990.0
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - No data available
- `500 Internal Server Error` - Processing error

---

## Refacturation (Invoice Reconstruction)

### GET `/api/refacturation`

Compare real invoices vs recalculated invoices with gap detection.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `year` (required): Year to analyze (e.g., 2025)

**Response (200 OK):**
```json
{
  "year": 2025,
  "metriques": {
    "facture_reelle_total": 1873655031.00,
    "facture_recalculee_total": 1762663472.21,
    "gap_total": -110991558.79,
    "gap_pct": -5.92,
    "nb_depassements": 9
  },
  "tableau": [
    {
      "mois": "Jan",
      "puissance_souscrite": 3200,
      "puissance_atteinte": 4465,
      "depassement": 1265,
      "type_tarifaire": 6,
      "consommation": 2753086.0,
      "facture_reelle": 181674031.00,
      "facture_recalculee": 167714895.00,
      "ecart": -13959136.00,
      "has_gap": true
    }
  ]
}
```

**Fields:**
- `has_gap`: `true` if absolute gap > 100 FCFA
- `gap_total`: Negative means recalculated is lower than real
- `depassement`: Power overrun in kW (0 if none)

**Error Responses:**
- `404 Not Found` - No data available or no data for specified year

---

## Optimisation

### GET `/api/optimisation/config-actuelle`

Get current power configuration and metrics for 2025.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "puissance_actuelle": 3200,
  "puissance_max_atteinte": 4465.00,
  "puissance_min_atteinte": 2169.00,
  "puissance_moyenne": 3832.92,
  "type_tarifaire": 6,
  "cout_annuel_2025": 1873655031.00,
  "nb_depassements": 9
}
```

**Error Responses:**
- `404 Not Found` - No data available or no data for 2025

---

### POST `/api/optimisation/simulate`

Simulate costs with a new power subscription.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "nouvelle_puissance": 4018
}
```

**Response (200 OK):**
```json
{
  "nouvelle_puissance": 4018,
  "nouveau_type_tarifaire": 7,
  "warning": "La puissance saisie (4018 kW) est inférieure à votre puissance maximale atteinte (4465 kW). Vous aurez des dépassements sur 9 mois.",
  "has_warning": true,
  "resultats": {
    "cout_actuel": 1873655031.00,
    "cout_simule": 1873655031.00,
    "economies": 0.00,
    "economies_pct": 0.00,
    "nb_depassements_actuel": 9,
    "nb_depassements_simule": 9
  },
  "tableau_mensuel": [
    {
      "mois": "Jan",
      "facture_actuelle": 181674031.00,
      "facture_simulee": 181674031.00,
      "economie": 0.00
    },
    {
      "mois": "Fév",
      "facture_actuelle": 173945548.00,
      "facture_simulee": 173945548.00,
      "economie": 0.00
    }
  ]
}
```

**Warning Logic:**
- `has_warning`: `true` if nouvelle_puissance < puissance_max_atteinte
- `warning`: Message explaining potential overruns

**Error Responses:**
- `404 Not Found` - No data available or no data for 2025

---

## Health Check

### GET `/health`

Check if the API is running.

**Response (200 OK):**
```json
{
  "status": "healthy"
}
```

### GET `/`

Root endpoint with API information.

**Response (200 OK):**
```json
{
  "message": "Energy Optimization API",
  "version": "1.0.0",
  "status": "running"
}
```

---

## Error Responses

All endpoints may return these common errors:

### 400 Bad Request
Invalid request format or parameters.

```json
{
  "detail": "Le fichier ne contient pas toutes les colonnes requises"
}
```

### 401 Unauthorized
Invalid or expired token.

```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
Missing authentication token.

```json
{
  "detail": "Not authenticated"
}
```

### 404 Not Found
Resource not found (data, service, year, etc.).

```json
{
  "detail": "Aucune donnée disponible. Veuillez d'abord uploader un fichier."
}
```

### 500 Internal Server Error
Server-side processing error.

```json
{
  "detail": "Erreur lors du traitement du fichier: [error details]"
}
```

---

## Data Flow

1. **Login** → Receive JWT token
2. **Upload File** → Detect single/multiple services
3. **Select Service** (if multiple) → Process selected service data
4. **Access Endpoints:**
   - Synthese → Monthly summary table
   - Refacturation → Invoice comparison with gaps
   - Optimisation → Current config + simulation

---

## Configuration

### Environment Variables (.env)

```env
APP_NAME=Energy Optimization API
DEBUG=True
DATABASE_URL=sqlite:///./energy_opt.db
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

---

## Testing

### Run test suite:
```bash
cd webapp/backend
python test_complete.py
```

### Access Swagger UI:
```
http://localhost:8000/docs
```

### Access ReDoc:
```
http://localhost:8000/redoc
```

---

## Database Schema

### users Table

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| username | String | Unique username |
| password_hash | String | Hashed password (bcrypt) |
| created_at | DateTime | Account creation timestamp |
| last_login | DateTime | Last login timestamp |

---

## Session Management

Data is stored **in-memory** per user session:

```python
{
  user_id: {
    'raw_df': DataFrame,        # Original uploaded data
    'processed_df': DataFrame,  # Calculated data
    'service_no': str          # Selected service number
  }
}
```

**Note:** Data is lost on server restart. For production, consider:
- Redis for session storage
- PostgreSQL for data persistence
- File system cache

---

## Production Deployment

### Recommendations:

1. **Change Default Credentials**
   - Update `ADMIN_PASSWORD` in `.env`
   - Use strong, unique passwords

2. **Update Secret Key**
   - Generate secure random key: `openssl rand -hex 32`
   - Set in `.env` file

3. **Use PostgreSQL**
   - Update `DATABASE_URL` to PostgreSQL connection string
   - Example: `postgresql://user:password@localhost/dbname`

4. **Enable HTTPS**
   - Use reverse proxy (nginx, caddy)
   - Configure SSL certificates

5. **Configure CORS**
   - Update `FRONTEND_URL` in settings
   - Restrict allowed origins

6. **Session Storage**
   - Implement Redis for session management
   - Add data persistence layer

7. **Logging**
   - Configure proper logging
   - Monitor errors and performance

---

## Development

### Start Server:
```bash
cd webapp/backend
python run.py
```

Server runs on `http://0.0.0.0:8000` with auto-reload enabled.

### Project Structure:
```
webapp/backend/
├── app/
│   ├── auth/           # Authentication module
│   ├── data/           # Data upload and processing
│   ├── refacturation/  # Invoice reconstruction
│   ├── optimisation/   # Power optimization
│   ├── core/           # Business logic (calculs, synthese, config)
│   ├── main.py         # FastAPI application
│   ├── database.py     # Database configuration
│   └── settings.py     # Application settings
├── run.py              # Server startup script
├── requirements.txt    # Python dependencies
└── test_complete.py    # Test suite
```

---

## Support

For issues or questions:
- Review this documentation
- Check Swagger UI at `/docs`
- Review test examples in `test_complete.py`
- Check server logs for errors
