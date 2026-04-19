from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, hash_password, verify_password
from app.utils.token import create_token, verify_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    username: str


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if not data.username.strip() or len(data.username) < 2:
        raise HTTPException(400, "Username must be at least 2 characters")
    if len(data.password) < 4:
        raise HTTPException(400, "Password must be at least 4 characters")

    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(400, "Username already taken")

    pw_hash, salt = hash_password(data.password)
    user = User(username=data.username, password_hash=pw_hash, salt=salt)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.username)
    return AuthResponse(token=token, username=user.username)


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash, user.salt):
        raise HTTPException(401, "Invalid username or password")

    token = create_token(user.id, user.username)
    return AuthResponse(token=token, username=user.username)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    """Optional auth — returns user if token provided, None otherwise."""
    if credentials is None:
        return None
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(401, "Invalid or expired token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if user is None:
        raise HTTPException(401, "User not found")
    return user
