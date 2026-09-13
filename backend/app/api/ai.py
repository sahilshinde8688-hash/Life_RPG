from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.all_models import (
    User, Quest, QuestCategory, QuestCompletion, AIInteraction, AIRecommendation
)
from ..services.rpg_engine import get_user_total_xp, calculate_level_from_xp
from ..services.gemini_service import generate_quest_plan, generate_daily_coach, recommend_difficulty

router = APIRouter(prefix="", tags=["Intelligence Layer (AI)"])

class QuestPlanRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=300)
    timeframe_days: int = Field(30, ge=1, le=365)
    auto_save_drafts: bool = True

class DifficultyRequest(BaseModel):
    category: str = "all"

@router.post("/ai/quest-plan")
def plan_quests_with_ai(
    req: QuestPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Log interaction
    interaction = AIInteraction(
        user_id=user.id,
        prompt_summary=f"Goal: {req.goal[:100]}, Timeframe: {req.timeframe_days}d"
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    # Generate structured quests
    proposed = generate_quest_plan(req.goal, req.timeframe_days)

    saved_quests = []
    if req.auto_save_drafts:
        categories_by_name = {c.name.lower(): c.id for c in db.query(QuestCategory).all()}
        for p in proposed:
            cat_name = p.get("category", "Study & Deep Work")
            cat_id = categories_by_name.get(cat_name.lower())
            
            quest = Quest(
                user_id=user.id,
                title=p.get("title", "Untitled Objective"),
                description=p.get("description", ""),
                category_id=cat_id,
                difficulty=p.get("difficulty", "medium").lower(),
                estimated_duration=p.get("estimated_duration", 30),
                status="DRAFT"  # Crucial: generated as DRAFT per specification
            )
            db.add(quest)
            saved_quests.append(quest)
        db.commit()

    # Log recommendation
    db.add(AIRecommendation(
        ai_interaction_id=interaction.id,
        payload={"proposed": proposed}
    ))
    db.commit()

    return {
        "status": "success",
        "goal": req.goal,
        "timeframe_days": req.timeframe_days,
        "proposed_quests": [
            {
                "id": q.id if req.auto_save_drafts else None,
                "title": p.get("title"),
                "description": p.get("description"),
                "category": p.get("category"),
                "difficulty": p.get("difficulty"),
                "estimated_duration_min": p.get("estimated_duration", 30),
                "status": "DRAFT"
            }
            for p, q in zip(proposed, saved_quests if req.auto_save_drafts else [None]*len(proposed))
        ]
    }

@router.post("/ai/daily-coach")
def get_daily_coach_recommendation(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Assemble sanitized context
    total_xp = get_user_total_xp(user.id, db)
    level, _, _ = calculate_level_from_xp(total_xp)
    streak_count = user.streak.current_count if user.streak else 1

    # Attribute rankings
    user_attrs = user.user_attributes
    if user_attrs:
        sorted_attrs = sorted(user_attrs, key=lambda a: a.value, reverse=True)
        top_attr = sorted_attrs[0].attribute.name if sorted_attrs else "Intellect"
        low_attr = sorted_attrs[-1].attribute.name if sorted_attrs else "Focus"
    else:
        top_attr = "Intellect"
        low_attr = "Focus"

    # Completion rate
    total_created = db.query(Quest).filter(Quest.user_id == user.id, Quest.archived == False).count()
    total_completed = db.query(QuestCompletion).filter(QuestCompletion.user_id == user.id).count()
    completion_rate = round((total_completed / max(1, total_created)) * 100, 1)

    sanitized_context = {
        "level": level,
        "streak": streak_count,
        "top_attribute": top_attr,
        "lowest_attribute": low_attr,
        "completion_rate": min(100.0, completion_rate)
    }

    advice = generate_daily_coach(sanitized_context)
    return {
        "sanitized_context": sanitized_context,
        "coach_insight": advice.get("insight"),
        "recommended_quest": advice.get("recommended_quest")
    }

@router.post("/ai/difficulty-recommendation")
def get_difficulty_recommendation(
    req: DifficultyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_created = db.query(Quest).filter(Quest.user_id == user.id, Quest.archived == False).count()
    total_completed = db.query(QuestCompletion).filter(QuestCompletion.user_id == user.id).count()
    completion_rate = (total_completed / max(1, total_created)) * 100.0

    return recommend_difficulty(completion_rate, 35)
