"""
Authentication routes with advanced registration system
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
import string

from ..database import get_db
from ..settings import get_settings
from .models import User
from .schemas import (
    UserLogin, UserLoginLegacy, Token, UserResponse, UserSummary,
    UserRegistration, RegistrationResponse, AccountActivation,
    ResendOTP, PendingUserRequest, ApprovalRequest, RejectionRequest,
    UpdatePermissions
)
from .utils import authenticate_user, create_access_token, get_current_user, get_password_hash, verify_password
from ..core.email_service import (
    send_new_request_notification_to_admin,
    send_approval_email_with_otp,
    send_rejection_email,
    send_welcome_email
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()


def generate_otp(length: int = 6) -> str:
    """Generate random OTP code"""
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def is_admin(user: User) -> bool:
    """Check if user is admin"""
    if not user:
        return False
    return user.role == "admin"


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role"""
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user


# ============= PUBLIC ENDPOINTS =============

@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register(registration: UserRegistration, db: Session = Depends(get_db)):
    """
    Register new user (public endpoint)

    Flow:
    1. User submits registration form
    2. Create user with status="pending"
    3. Send notification to admin
    4. Return confirmation message
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == registration.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà enregistré"
        )

    # Create new user with pending status
    new_user = User(
        email=registration.email,
        full_name=registration.full_name,
        titre=registration.titre,
        poste=registration.poste,
        entreprise=registration.entreprise,
        telephone=registration.telephone,
        raison_demande=registration.raison_demande,
        status="pending",
        role="user",
        is_active=False,
        permissions={
            "view_profil": True,
            "view_reconstitution": True,
            "view_optimisation": False,
            "view_simulateur": True,
            "upload_data": False,
            "manage_users": False
        }
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send notification to admin
    try:
        await send_new_request_notification_to_admin({
            'full_name': new_user.full_name,
            'email': new_user.email,
            'poste': new_user.poste,
            'entreprise': new_user.entreprise,
            'telephone': new_user.telephone,
            'raison_demande': new_user.raison_demande
        })
    except Exception as e:
        print(f"Error sending admin notification: {e}")
        # Continue even if email fails

    return RegistrationResponse(
        message="Demande envoyée avec succès. Vous recevrez un email une fois votre compte approuvé.",
        status="pending",
        email=new_user.email
    )


@router.post("/activate", response_model=Token)
async def activate_account(activation: AccountActivation, db: Session = Depends(get_db)):
    """
    Activate user account with OTP (public endpoint)

    Flow:
    1. User receives OTP by email after admin approval
    2. User enters email + OTP + new password
    3. Validate OTP
    4. Set password and activate account
    5. Return JWT token for immediate login
    """
    # Find user by email
    user = db.query(User).filter(User.email == activation.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    # Check if user is approved
    if user.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Votre compte n'est pas encore approuvé. Statut actuel: {user.status}"
        )

    # Verify OTP
    if not user.otp_code or user.otp_code != activation.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code OTP invalide"
        )

    # Check if OTP expired
    if user.otp_expires_at and user.otp_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le code OTP a expiré. Veuillez demander un nouveau code."
        )

    # Set password and activate account
    user.password_hash = get_password_hash(activation.password)
    user.status = "active"
    user.is_active = True
    user.otp_code = None  # Clear OTP after use
    user.otp_created_at = None
    user.otp_expires_at = None
    user.last_login = datetime.utcnow()

    db.commit()
    db.refresh(user)

    # Send welcome email
    try:
        await send_welcome_email(user.email, user.full_name)
    except Exception as e:
        print(f"Error sending welcome email: {e}")

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/resend-otp")
async def resend_otp(request: ResendOTP, db: Session = Depends(get_db)):
    """
    Resend OTP to user (public endpoint)
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user or user.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé ou pas encore approuvé"
        )

    # Generate new OTP
    new_otp = generate_otp()
    user.otp_code = new_otp
    user.otp_created_at = datetime.utcnow()
    user.otp_expires_at = datetime.utcnow() + timedelta(hours=24)

    db.commit()

    # Send email
    try:
        await send_approval_email_with_otp(user.email, user.full_name, new_otp)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de l'email: {str(e)}"
        )

    return {"message": "Un nouveau code OTP a été envoyé à votre email"}


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint with email/password (public endpoint)
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is active
    if not user.is_active or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Votre compte n'est pas actif. Statut: {user.status}"
        )

    # Verify password
    if not user.password_hash or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role},
        expires_delta=access_token_expires
    )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/login-legacy", response_model=Token)
def login_legacy(credentials: UserLoginLegacy, db: Session = Depends(get_db)):
    """
    Legacy login endpoint with username/password (for backwards compatibility)
    """
    user = authenticate_user(db, credentials.username, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username or user.email, "user_id": user.id, "role": user.role},
        expires_delta=access_token_expires
    )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


# ============= PROTECTED ENDPOINTS =============

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user
    """
    return UserResponse.from_orm(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint (token invalidation handled on frontend)
    """
    return {"message": "Déconnecté avec succès"}


# ============= ADMIN ENDPOINTS =============

@router.get("/pending-requests", response_model=List[PendingUserRequest])
async def get_pending_requests(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Get all pending user requests (admin only)
    """
    pending_users = db.query(User).filter(User.status == "pending").order_by(User.created_at.desc()).all()
    return [PendingUserRequest.from_orm(user) for user in pending_users]


@router.post("/approve-request/{user_id}")
async def approve_request(
    user_id: int,
    custom_permissions: UpdatePermissions = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Approve user request and send OTP (admin only)

    Flow:
    1. Admin approves request
    2. Generate OTP code
    3. Update user status to "approved"
    4. Send email with OTP
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    if user.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cet utilisateur a déjà été traité. Statut: {user.status}"
        )

    # Generate OTP
    otp = generate_otp()

    # Update user
    user.status = "approved"
    user.approved_at = datetime.utcnow()
    user.approved_by = admin.id
    user.otp_code = otp
    user.otp_created_at = datetime.utcnow()
    user.otp_expires_at = datetime.utcnow() + timedelta(hours=24)

    # Update permissions if provided
    if custom_permissions and custom_permissions.permissions:
        user.permissions = custom_permissions.permissions

    db.commit()
    db.refresh(user)

    # Send email with OTP
    try:
        await send_approval_email_with_otp(user.email, user.full_name, otp)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Utilisateur approuvé mais erreur lors de l'envoi de l'email: {str(e)}"
        )

    return {
        "message": "Utilisateur approuvé. Un email avec le code OTP a été envoyé.",
        "otp_sent_to": user.email,
        "user": UserSummary.from_orm(user)
    }


@router.post("/reject-request/{user_id}")
async def reject_request(
    user_id: int,
    rejection: RejectionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Reject user request (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    if user.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cet utilisateur a déjà été traité. Statut: {user.status}"
        )

    # Update user
    user.status = "rejected"
    user.rejected_at = datetime.utcnow()
    user.rejection_reason = rejection.reason

    db.commit()
    db.refresh(user)

    # Send rejection email
    try:
        await send_rejection_email(user.email, user.full_name, rejection.reason)
    except Exception as e:
        print(f"Error sending rejection email: {e}")

    return {
        "message": "Demande rejetée. Un email a été envoyé à l'utilisateur.",
        "user": UserSummary.from_orm(user)
    }


@router.get("/users", response_model=List[UserSummary])
async def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Get all users (admin only)
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserSummary.from_orm(user) for user in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Get user details by ID (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    return UserResponse.from_orm(user)


@router.put("/users/{user_id}/permissions", response_model=UserResponse)
async def update_user_permissions(
    user_id: int,
    permissions_update: UpdatePermissions,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Update user permissions (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    # Update permissions
    if user.permissions:
        user.permissions.update(permissions_update.permissions)
    else:
        user.permissions = permissions_update.permissions

    db.commit()
    db.refresh(user)

    return UserResponse.from_orm(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Delete user (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte"
        )

    db.delete(user)
    db.commit()

    return {"message": f"Utilisateur {user.email} supprimé avec succès"}
