# Energy Optimization API - Backend

FastAPI backend for energy optimization and billing analysis.

## Setup

### 1. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

### 4. Run the server

```bash
python run.py
```

The server will:
- Initialize the database
- Create tables
- Create admin user (username: admin, password: admin123)
- Start on http://localhost:8000

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Default Credentials

- Username: `admin`
- Password: `admin123`

⚠️ **Change these in production!**

## Project Structure

```
backend/
├── app/
│   ├── auth/           # Authentication module
│   ├── data/           # Data upload & processing
│   ├── refacturation/  # Invoice reconstruction
│   ├── optimisation/   # Power optimization
│   ├── core/           # Business logic (calculs, synthese, config)
│   ├── main.py         # FastAPI app
│   ├── database.py     # Database config
│   ├── settings.py     # App settings
│   └── init_db.py      # DB initialization
├── requirements.txt
├── .env
└── run.py
```

## Development

### Run with auto-reload

```bash
uvicorn app.main:app --reload
```

### Initialize/Reset database

```bash
python -m app.init_db
```
