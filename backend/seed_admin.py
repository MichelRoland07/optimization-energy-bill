"""
Script to create default admin user
Usage: python seed_admin.py
"""
from app.database import SessionLocal, engine
from app.auth.models import User
from app.auth.utils import get_password_hash
from datetime import datetime


def create_admin_user():
    """Create default admin user if it doesn't exist"""
    db = SessionLocal()

    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@sabc.com").first()

        if admin:
            print("✅ Admin user already exists")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            print(f"   Status: {admin.status}")
            return

        # Create admin user
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
            password_hash=get_password_hash("Admin@2024"),  # Default password
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

        print("✅ Admin user created successfully!")
        print(f"   Email: {admin.email}")
        print(f"   Default Password: Admin@2024")
        print(f"   ⚠️  IMPORTANT: Please change this password after first login!")

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Creating default admin user...")
    create_admin_user()
