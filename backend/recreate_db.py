"""
Script to recreate database with new schema
"""
import os
from app.database import Base, engine
from app.auth.models import User

def recreate_database():
    """Recreate database with new schema"""

    # Remove old database if exists
    db_file = "optimisation_sabc.db"
    if os.path.exists(db_file):
        print(f"🗑️  Removing old database: {db_file}")
        os.remove(db_file)

    # Create all tables with new schema
    print("📦 Creating database tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

    print("\n" + "="*50)
    print("Database recreated with new schema!")
    print("="*50)
    print("\nNext steps:")
    print("1. Run: python seed_admin.py")
    print("2. Start backend: python run.py")
    print("3. Start frontend: cd ../frontend-nextjs && npm run dev")
    print("\n")

if __name__ == "__main__":
    recreate_database()
