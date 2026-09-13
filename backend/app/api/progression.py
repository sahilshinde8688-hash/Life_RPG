from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.all_models import User, Attribute, UserAttribute, Streak, XPTransaction, GoldTransaction
from ..services.rpg_engine import (
    get_user_total_xp, get_user_gold_balance, calculate_level_from_xp
)

router = APIRouter(prefix="", tags=["Progression"])

@router.get("/progress")
def get_user_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_xp = get_user_total_xp(user.id, db)
    gold_balance = get_user_gold_balance(user.id, db)
    level, level_progress, xp_to_next = calculate_level_from_xp(total_xp)
    progress_percent = round((level_progress / xp_to_next) * 100, 1) if xp_to_next > 0 else 100.0

    # Recent activity ledger
    recent_xp = db.query(XPTransaction).filter(
        XPTransaction.user_id == user.id
    ).order_by(XPTransaction.created_at.desc()).limit(5).all()

    recent_gold = db.query(GoldTransaction).filter(
        GoldTransaction.user_id == user.id
    ).order_by(GoldTransaction.created_at.desc()).limit(5).all()

    return {
        "level": level,
        "total_xp": total_xp,
        "current_level_xp": level_progress,
        "xp_for_next_level": xp_to_next,
        "xp_progress_percent": progress_percent,
        "gold_balance": gold_balance,
        "recent_xp_transactions": [
            {"id": x.id, "amount": x.amount, "source": x.source, "created_at": x.created_at}
            for x in recent_xp
        ],
        "recent_gold_transactions": [
            {"id": g.id, "amount": g.amount, "source": g.source, "created_at": g.created_at}
            for g in recent_gold
        ]
    }

@router.get("/attributes")
def get_user_attributes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    all_attrs = db.query(Attribute).all()
    user_attrs = {
        ua.attribute_id: ua
        for ua in db.query(UserAttribute).filter(UserAttribute.user_id == user.id).all()
    }

    results = []
    for att in all_attrs:
        u_attr = user_attrs.get(att.id)
        val = u_attr.value if u_attr else 10
        mastery = u_attr.mastery_percent if u_attr else 10.0
        results.append({
            "id": att.id,
            "name": att.name,
            "icon": att.icon,
            "description": att.description,
            "value": val,
            "mastery_percent": mastery
        })

    # Sort so top mastery appears first (as recommended in PRD & UI/UX spec)
    results.sort(key=lambda x: x["mastery_percent"], reverse=True)
    return results

@router.get("/streak")
def get_user_streak(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    if not streak:
        streak = Streak(user_id=user.id, current_count=1, longest_count=1)
        db.add(streak)
        db.commit()
        db.refresh(streak)

    return {
        "current_count": streak.current_count,
        "longest_count": streak.longest_count,
        "last_active_date": streak.last_active_date,
        "recovery_quest_available": streak.recovery_quest_id is not None
    }
