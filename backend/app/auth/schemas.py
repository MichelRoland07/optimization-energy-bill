"""
Pydantic schemas for authentication
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
import re


# ============= Registration Schemas =============

class UserRegistration(BaseModel):
    """Schema for user registration (request)"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    titre: Optional[str] = Field(None, max_length=10)
    poste: str = Field(..., min_length=2, max_length=100)
    entreprise: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = None
    raison_demande: Optional[str] = Field(None, max_length=500)

    @validator('telephone')
    def validate_telephone(cls, v):
        if v and not re.match(r'^\+?[\d\s\-\(\)]+$', v):
            raise ValueError('Format de téléphone invalide')
        return v


class RegistrationResponse(BaseModel):
    """Response after registration"""
    message: str
    status: str
    email: str


# ============= Activation Schemas =============

class AccountActivation(BaseModel):
    """Schema for account activation with OTP"""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=8)

    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not re.search(r'[a-z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not re.search(r'\d', v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v


class ResendOTP(BaseModel):
    """Schema for resending OTP"""
    email: EmailStr


# ============= Login Schemas =============

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


# Legacy support
class UserLoginLegacy(BaseModel):
    """Legacy schema with username"""
    username: str
    password: str


# ============= User Response Schemas =============

class UserResponse(BaseModel):
    """Complete user response schema"""
    id: int
    email: str
    full_name: str
    titre: Optional[str] = None
    poste: str
    entreprise: Optional[str] = None
    role: str
    status: str
    is_active: bool
    permissions: Dict[str, bool]
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    """Summary user info for lists"""
    id: int
    email: str
    full_name: str
    poste: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PendingUserRequest(BaseModel):
    """Pending user request for admin review"""
    id: int
    email: str
    full_name: str
    titre: Optional[str] = None
    poste: str
    entreprise: Optional[str] = None
    telephone: Optional[str] = None
    raison_demande: Optional[str] = None
    created_at: datetime
    status: str

    class Config:
        from_attributes = True


# ============= Admin Action Schemas =============

class ApprovalRequest(BaseModel):
    """Schema for approving user request"""
    user_id: int
    custom_permissions: Optional[Dict[str, bool]] = None


class RejectionRequest(BaseModel):
    """Schema for rejecting user request"""
    user_id: int
    reason: str = Field(..., min_length=10, max_length=500)


class UpdatePermissions(BaseModel):
    """Schema for updating user permissions"""
    permissions: Dict[str, bool]


# ============= Token Schemas =============

class TokenData(BaseModel):
    """Token payload data"""
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str
    user: UserResponse


# ============= Legacy Compatibility =============

class UserBase(BaseModel):
    """Base user schema (legacy)"""
    username: str


class UserCreate(UserBase):
    """Schema for creating a user (legacy)"""
    password: str
