"""
Pydantic schemas for authentication
"""
from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    username: str


class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None
    user_id: Optional[int] = None


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    username: str
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str
    user: UserResponse
