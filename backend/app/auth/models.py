"""
Database models for authentication
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey
from datetime import datetime
from ..database import Base


class User(Base):
    """User model for authentication with advanced registration and permissions"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Authentification
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Null jusqu'à activation

    # Informations professionnelles
    full_name = Column(String, nullable=False)
    titre = Column(String, nullable=True)  # "Dr.", "Ing.", "M.", "Mme", etc.
    poste = Column(String, nullable=False)  # "Ingénieur Électrique", "Manager", etc.
    entreprise = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    raison_demande = Column(Text, nullable=True)

    # Gestion du compte
    role = Column(String, default="user", nullable=False)  # "admin" ou "user"
    status = Column(String, default="pending", nullable=False)  # "pending", "approved", "active", "rejected"
    is_active = Column(Boolean, default=False)

    # OTP pour activation
    otp_code = Column(String, nullable=True)
    otp_created_at = Column(DateTime, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # Permissions spécifiques (JSON)
    permissions = Column(JSON, default={
        "view_profil": True,
        "view_reconstitution": True,
        "view_optimisation": False,  # Réservé admin par défaut
        "view_simulateur": True,
        "upload_data": False,  # Réservé admin par défaut
        "manage_users": False  # Réservé admin
    })

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    last_login = Column(DateTime, nullable=True)

    # Compatibilité avec ancien système (username)
    username = Column(String, unique=True, index=True, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}', status='{self.status}')>"

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission"""
        if self.role == "admin":
            return True  # Admin a toutes les permissions
        if not self.permissions:
            return False
        return self.permissions.get(permission, False)
