from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import (
    verify_password, get_password_hash, create_access_token, get_current_user
)
from ..models.all_models import User, Profile, Attribute, UserAttribute, Streak, XPTransaction, GoldTransaction

router = APIRouter(prefix="", tags=["Auth & Identity"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str = "Wanderer"
    character_title: str = "The Novice"

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    display_name: str
    character_title: str

@router.post("/auth/register", response_model=AuthResponse)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "USER_ALREADY_EXISTS", "message": "A character with this email already exists."}}
        )

    user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize Profile
    profile = Profile(
        user_id=user.id,
        display_name=req.display_name,
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={req.display_name}",
        character_title=req.character_title
    )
    db.add(profile)

    # Initialize Default 5 Attributes
    attrs = db.query(Attribute).all()
    for a in attrs:
        db.add(UserAttribute(
            user_id=user.id,
            attribute_id=a.id,
            value=10,
            mastery_percent=15.0
        ))

    # Initialize Streak
    db.add(Streak(user_id=user.id, current_count=1, longest_count=1))

    # Welcome bonus grant (append-only ledger)
    db.add(XPTransaction(user_id=user.id, amount=50, source="signup_bonus"))
    db.add(GoldTransaction(user_id=user.id, amount=25, source="signup_bonus"))

    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        display_name=profile.display_name,
        character_title=profile.character_title
    )

@router.post("/auth/login", response_model=AuthResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."}}
        )

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    display_name = profile.display_name if profile else "Wanderer"
    title = profile.character_title if profile else "Novice"

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        display_name=display_name,
        character_title=title
    )

@router.post("/auth/logout")
def logout_user():
    return {"status": "ok", "message": "Logged out successfully."}

@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id, display_name="Wanderer", character_title="Novice")
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "id": user.id,
        "email": user.email,
        "display_name": profile.display_name,
        "avatar_url": profile.avatar_url,
        "character_title": profile.character_title,
        "character_created_at": profile.character_created_at
    }
