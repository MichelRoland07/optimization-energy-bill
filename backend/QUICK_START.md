# Quick Start Guide

## 🚀 Start the Backend Server

```bash
cd webapp/backend
python run.py
```

The server will start on `http://localhost:8000`

---

## 📚 Access Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 🔐 Default Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change these in production!**

---

## 🧪 Run Tests

```bash
cd webapp/backend
python test_complete.py
```

---

## 📝 Common API Flows

### 1. Login and Get Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {...}
}
```

### 2. Upload File

```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8000/api/data/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.xlsx"
```

### 3. Get Synthese

```bash
curl "http://localhost:8000/api/data/synthese?year=2025" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Refacturation

```bash
curl "http://localhost:8000/api/refacturation?year=2025" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Current Config

```bash
curl http://localhost:8000/api/optimisation/config-actuelle \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Simulate Optimization

```bash
curl -X POST http://localhost:8000/api/optimisation/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nouvelle_puissance": 4000}'
```

---

## 🐍 Python API Client Example

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Login
response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": "admin", "password": "admin123"}
)
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Upload file
with open("data.xlsx", "rb") as f:
    files = {"file": f}
    response = requests.post(
        f"{BASE_URL}/api/data/upload",
        headers=headers,
        files=files
    )
print(response.json())

# 3. Get synthese
response = requests.get(
    f"{BASE_URL}/api/data/synthese",
    headers=headers,
    params={"year": 2025}
)
print(response.json())

# 4. Get refacturation
response = requests.get(
    f"{BASE_URL}/api/refacturation",
    headers=headers,
    params={"year": 2025}
)
print(response.json())

# 5. Get current config
response = requests.get(
    f"{BASE_URL}/api/optimisation/config-actuelle",
    headers=headers
)
config = response.json()
print(f"Current power: {config['puissance_actuelle']} kW")

# 6. Simulate optimization
response = requests.post(
    f"{BASE_URL}/api/optimisation/simulate",
    headers=headers,
    json={"nouvelle_puissance": 4000}
)
sim = response.json()
print(f"Economies: {sim['resultats']['economies']:.2f} FCFA")
```

---

## 🌐 JavaScript/React Example

```javascript
const BASE_URL = "http://localhost:8000";

// 1. Login
const login = async (username, password) => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  return data;
};

// 2. Upload file
const uploadFile = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/api/data/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });
  return await response.json();
};

// 3. Get synthese
const getSynthese = async (year) => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${BASE_URL}/api/data/synthese?year=${year}`,
    { headers: { "Authorization": `Bearer ${token}` } }
  );
  return await response.json();
};

// 4. Get refacturation
const getRefacturation = async (year) => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${BASE_URL}/api/refacturation?year=${year}`,
    { headers: { "Authorization": `Bearer ${token}` } }
  );
  return await response.json();
};

// 5. Simulate optimization
const simulateOptimization = async (nouvellePuissance) => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${BASE_URL}/api/optimisation/simulate`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nouvelle_puissance: nouvellePuissance })
    }
  );
  return await response.json();
};

// Usage
await login("admin", "admin123");
const uploadResult = await uploadFile(fileInput.files[0]);
const synthese = await getSynthese(2025);
const refacturation = await getRefacturation(2025);
const simulation = await simulateOptimization(4000);
```

---

## 📦 File Structure

```
webapp/backend/
├── app/              # Application code
│   ├── auth/        # Authentication
│   ├── data/        # Data management
│   ├── refacturation/  # Invoice reconstruction
│   ├── optimisation/   # Power optimization
│   └── core/        # Business logic
├── run.py           # Start server
├── test_complete.py # Run tests
└── requirements.txt # Dependencies
```

---

## ⚙️ Configuration

Edit `.env` file:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 8000 is available
lsof -i :8000

# Kill process if needed
kill -9 <PID>
```

### Database issues
```bash
# Delete and recreate database
rm energy_opt.db
python run.py
```

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### Authentication errors
- Check token is included in Authorization header
- Token format: `Bearer <token>`
- Token expires after 24 hours by default

---

## 📖 Documentation

- **Full API Docs**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Implementation Summary**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Swagger UI**: http://localhost:8000/docs

---

## ✅ Test Checklist

1. [ ] Server starts without errors
2. [ ] Login endpoint returns token
3. [ ] Upload file works (single service)
4. [ ] Upload file works (multiple services)
5. [ ] Service selection works
6. [ ] Synthese table displays
7. [ ] Refacturation shows gaps
8. [ ] Optimization simulation works
9. [ ] All tests pass (`test_complete.py`)

---

## 🚀 Production Deployment

Before deploying:

1. **Change admin password** in `.env`
2. **Generate new secret key**: `openssl rand -hex 32`
3. **Update CORS settings** for your domain
4. **Use PostgreSQL** instead of SQLite
5. **Enable HTTPS**
6. **Set DEBUG=False**

---

## 💡 Tips

- Use Swagger UI (`/docs`) to test endpoints interactively
- Check server logs for detailed error messages
- Token expires after 24 hours (configurable)
- Data is stored in memory (lost on restart)
- Multi-service files require service selection

---

## 📞 Support

- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint details
- Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for architecture
- Run tests to verify functionality
- Check server console for error messages
