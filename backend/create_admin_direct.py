"""
Direct script to create admin user
"""
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.auth.models import User, Base
from app.auth.utils import get_password_hash

# Create engine
DATABASE_URL = "sqlite:///./optimisation_sabc.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Drop all tables and recreate
print("🗑️  Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("📦 Creating all tables with new schema...")
Base.metadata.create_all(bind=engine)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("\n👤 Creating admin user...")

    admin = User(
        email="admin@sabc.com",
        username="admin",  # For legacy compatibility
        full_name="Administrateur SABC",
        titre="M.",
        poste="Administrateur Système",
        entreprise="SABC",
        telephone="+225 XX XX XX XX",
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
    db.refresh(admin)

    print("\n✅ Admin user created successfully!")
    print(f"   Email: {admin.email}")
    print(f"   Password: Admin@2024")
    print(f"   Role: {admin.role}")
    print(f"   Status: {admin.status}")
    print(f"\n⚠️  IMPORTANT: Change this password after first login!\n")

except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
finally:
    db.close()
