"""
Initialize database with tables and default admin user
"""
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .auth.models import User
from .auth.utils import get_password_hash
from .settings import get_settings

settings = get_settings()


def init_db():
    """Initialize database: create tables and admin user"""

    print("Creating database tables...")
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")

    # Create admin user if not exists
    db: Session = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.username == settings.admin_username).first()

        if not existing_user:
            print(f"Creating admin user: {settings.admin_username}")
            admin_user = User(
                username=settings.admin_username,
                password_hash=get_password_hash(settings.admin_password)
            )
            db.add(admin_user)
            db.commit()
            print(f"✓ Admin user created: {settings.admin_username} / {settings.admin_password}")
        else:
            print(f"✓ Admin user already exists: {settings.admin_username}")

    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

    print("\n✅ Database initialized successfully!")
    print(f"   Username: {settings.admin_username}")
    print(f"   Password: {settings.admin_password}")
    print("\n⚠️  Please change the default password in production!")


if __name__ == "__main__":
    init_db()
