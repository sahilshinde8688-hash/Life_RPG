from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.all_models import (
    User, Quest, QuestCategory, QuestCompletion, XPTransaction, GoldTransaction
)
from ..services.rpg_engine import (
    calculate_quest_reward, calculate_level_from_xp, get_user_total_xp,
    update_user_streak, update_user_attributes, evaluate_achievements
)

router = APIRouter(prefix="", tags=["Quests"])

class QuestCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    difficulty: str = Field("medium", pattern="^(trivial|easy|medium|hard|epic)$")
    estimated_duration: int = Field(30, ge=5, le=480)
    deadline: Optional[datetime] = None
    recurrence: str = Field("none", pattern="^(none|daily|weekly)$")
    status: str = Field("ACTIVE", pattern="^(DRAFT|ACTIVE|IN_PROGRESS)$")

class QuestUpdateRequest(BaseModel):
    # Strict field allow-list (prevents Mass Assignment / Broken Object Property)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[str] = None
    difficulty: Optional[str] = Field(None, pattern="^(trivial|easy|medium|hard|epic)$")
    estimated_duration: Optional[int] = Field(None, ge=5, le=480)
    deadline: Optional[datetime] = None
    recurrence: Optional[str] = Field(None, pattern="^(none|daily|weekly)$")
    status: Optional[str] = Field(None, pattern="^(DRAFT|ACTIVE|IN_PROGRESS|PAUSED|FAILED|CANCELLED|ARCHIVED)$")

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(QuestCategory).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "icon": c.icon,
            "primary_attribute": c.primary_attribute,
            "secondary_attribute": c.secondary_attribute
        }
        for c in categories
    ]

@router.get("/quests")
def list_quests(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Quest).filter(Quest.user_id == user.id, Quest.archived == False)
    if status_filter:
        query = query.filter(Quest.status == status_filter.upper())
    if category_filter:
        query = query.join(QuestCategory).filter(QuestCategory.name.ilike(category_filter))

    quests = query.order_by(Quest.created_at.desc()).all()
    
    # Calculate preview rewards
    total_xp = get_user_total_xp(user.id, db)
    level, _, _ = calculate_level_from_xp(total_xp)

    output = []
    for q in quests:
        preview_xp, preview_gold = calculate_quest_reward(q.difficulty, q.estimated_duration, level)
        output.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "category_id": q.category_id,
            "category_name": q.category.name if q.category else "General",
            "category_icon": q.category.icon if q.category else "Sword",
            "difficulty": q.difficulty,
            "status": q.status,
            "estimated_duration": q.estimated_duration,
            "deadline": q.deadline,
            "recurrence": q.recurrence,
            "created_at": q.created_at,
            "preview_xp": preview_xp,
            "preview_gold": preview_gold
        })
    return output

@router.post("/quests", status_code=status.HTTP_201_CREATED)
def create_quest(
    req: QuestCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat_id = req.category_id
    if not cat_id and req.category_name:
        cat = db.query(QuestCategory).filter(QuestCategory.name.ilike(req.category_name)).first()
        if cat:
            cat_id = cat.id

    quest = Quest(
        user_id=user.id,
        title=req.title.strip(),
        description=req.description or "",
        category_id=cat_id,
        difficulty=req.difficulty,
        status=req.status,
        estimated_duration=req.estimated_duration,
        deadline=req.deadline,
        recurrence=req.recurrence
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)

    return {
        "id": quest.id,
        "title": quest.title,
        "status": quest.status,
        "difficulty": quest.difficulty,
        "category_id": quest.category_id,
        "estimated_duration": quest.estimated_duration,
        "created_at": quest.created_at
    }

@router.get("/quests/{quest_id}")
def get_quest_detail(
    quest_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # BOLA protection: 404 if not found or does not belong to caller
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == user.id, Quest.archived == False).first()
    if not quest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "QUEST_NOT_FOUND", "message": "Quest not found."}}
        )

    return {
        "id": quest.id,
        "title": quest.title,
        "description": quest.description,
        "category_id": quest.category_id,
        "category_name": quest.category.name if quest.category else "General",
        "difficulty": quest.difficulty,
        "status": quest.status,
        "estimated_duration": quest.estimated_duration,
        "deadline": quest.deadline,
        "recurrence": quest.recurrence,
        "created_at": quest.created_at
    }

@router.patch("/quests/{quest_id}")
def update_quest(
    quest_id: str,
    req: QuestUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == user.id, Quest.archived == False).first()
    if not quest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "QUEST_NOT_FOUND", "message": "Quest not found."}}
        )

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(quest, field, val)

    db.commit()
    db.refresh(quest)

    return {
        "id": quest.id,
        "title": quest.title,
        "status": quest.status,
        "difficulty": quest.difficulty
    }

@router.delete("/quests/{quest_id}")
def delete_quest(
    quest_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == user.id).first()
    if not quest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "QUEST_NOT_FOUND", "message": "Quest not found."}}
        )

    # Soft delete (archive)
    quest.archived = True
    quest.status = "ARCHIVED"
    db.commit()

    return {"status": "ok", "message": "Quest archived successfully."}

@router.post("/quests/{quest_id}/complete")
def complete_quest(
    quest_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == user.id, Quest.archived == False).first()
    if not quest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "QUEST_NOT_FOUND", "message": "Quest not found."}}
        )

    if quest.status == "COMPLETED" and quest.recurrence == "none":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "ALREADY_COMPLETED", "message": "This quest has already been completed."}}
        )

    # 1. Calculate current player progression level before reward
    initial_total_xp = get_user_total_xp(user.id, db)
    initial_level, _, _ = calculate_level_from_xp(initial_total_xp)

    # 2. Compute server-side rewards
    xp_awarded, gold_awarded = calculate_quest_reward(
        quest.difficulty, quest.estimated_duration, initial_level
    )

    # 3. Transition status
    quest.status = "COMPLETED"

    # 4. Insert QuestCompletion record
    completion = QuestCompletion(
        quest_id=quest.id,
        user_id=user.id,
        xp_awarded=xp_awarded,
        gold_awarded=gold_awarded
    )
    db.add(completion)

    # 5. Insert Append-Only Ledger Transactions
    db.add(XPTransaction(
        user_id=user.id,
        amount=xp_awarded,
        source="quest_completion",
        quest_completion_id=completion.id
    ))
    db.add(GoldTransaction(
        user_id=user.id,
        amount=gold_awarded,
        source="quest_completion"
    ))
    db.commit()

    # 6. Update Attributes
    prim_attr = quest.category.primary_attribute if quest.category else "Intellect"
    sec_attr = quest.category.secondary_attribute if quest.category else "Focus"
    attribute_deltas = update_user_attributes(user.id, prim_attr, sec_attr, db)

    # 7. Update Streak
    streak_count, is_streak_record = update_user_streak(user.id, db)

    # 8. Check Level-up threshold
    new_total_xp = get_user_total_xp(user.id, db)
    new_level, level_progress, xp_needed = calculate_level_from_xp(new_total_xp)
    level_up = new_level > initial_level

    # 9. Evaluate Achievements
    unlocked_achievements = evaluate_achievements(user.id, db)

    return {
        "quest_id": quest.id,
        "xp_awarded": xp_awarded,
        "gold_awarded": gold_awarded,
        "attribute_deltas": attribute_deltas,
        "level_up": level_up,
        "old_level": initial_level,
        "new_level": new_level,
        "total_xp": new_total_xp,
        "level_progress_xp": level_progress,
        "xp_needed_for_next": xp_needed,
        "streak": {
            "current": streak_count,
            "is_record": is_streak_record
        },
        "unlocked_achievements": unlocked_achievements
    }
