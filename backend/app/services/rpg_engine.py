import math
from datetime import datetime, date, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..models.all_models import (
    User, XPTransaction, GoldTransaction, UserAttribute,
    Attribute, Streak, QuestCompletion, Achievement, UserAchievement, Notification
)

BASE_REWARDS = {
    "trivial": {"xp": 10, "gold": 5},
    "easy": {"xp": 25, "gold": 10},
    "medium": {"xp": 50, "gold": 25},
    "hard": {"xp": 90, "gold": 45},
    "epic": {"xp": 150, "gold": 75},
}

def total_xp_to_reach(level: int) -> int:
    """Cumulative XP required to reach a specific level.
    Formula: 100 * (level ^ 1.8)
    """
    if level <= 1:
        return 0
    # Soft-cap past level 45
    if level > 45:
        base_45 = 100 * (45 ** 1.8)
        return int(base_45 + (level - 45) * 2000)
    return int(100 * (level ** 1.8))

def calculate_level_from_xp(total_xp: int) -> tuple[int, int, int]:
    """Given total accumulated XP, calculates:
    (current_level, current_level_xp, xp_needed_for_next_level)
    """
    if total_xp <= 0:
        return (1, 0, total_xp_to_reach(2))

    level = 1
    while True:
        xp_next = total_xp_to_reach(level + 1)
        if total_xp < xp_next:
            break
        level += 1

    xp_current_base = total_xp_to_reach(level)
    xp_next_base = total_xp_to_reach(level + 1)
    current_level_progress = total_xp - xp_current_base
    xp_to_next = xp_next_base - xp_current_base

    return (level, current_level_progress, xp_to_next)

def get_user_total_xp(user_id: str, db: Session) -> int:
    """Ledger principle: Total XP is strictly SUM(amount) from xp_transactions."""
    result = db.query(func.sum(XPTransaction.amount)).filter(XPTransaction.user_id == user_id).scalar()
    return int(result) if result else 0

def get_user_gold_balance(user_id: str, db: Session) -> int:
    """Ledger principle: Current Gold balance is strictly SUM(amount) from gold_transactions."""
    result = db.query(func.sum(GoldTransaction.amount)).filter(GoldTransaction.user_id == user_id).scalar()
    return int(result) if result else 0

def calculate_quest_reward(
    difficulty: str,
    estimated_duration: int = 30,
    current_level: int = 1
) -> tuple[int, int]:
    """Calculates server-side XP and Gold rewards based on difficulty and modifiers."""
    diff_key = difficulty.lower() if difficulty else "medium"
    base = BASE_REWARDS.get(diff_key, BASE_REWARDS["medium"])

    # Duration modifier
    if estimated_duration <= 15:
        dur_mod = 0.9
    elif estimated_duration <= 45:
        dur_mod = 1.0
    elif estimated_duration <= 90:
        dur_mod = 1.15
    else:
        dur_mod = 1.3

    # Progression modifier (slight level boost)
    prog_mod = 1.0 + min(0.3, current_level * 0.01)

    final_xp = int(round(base["xp"] * dur_mod * prog_mod))
    final_gold = int(round(base["gold"] * dur_mod * prog_mod))

    return max(5, final_xp), max(2, final_gold)

def update_user_streak(user_id: str, db: Session) -> tuple[int, bool]:
    """Updates user streak on activity.
    Returns (current_streak, is_new_record)
    """
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    today = date.today()

    if not streak:
        streak = Streak(
            user_id=user_id,
            current_count=1,
            longest_count=1,
            last_active_date=datetime.utcnow()
        )
        db.add(streak)
        db.commit()
        db.refresh(streak)
        return 1, True

    last_active = streak.last_active_date.date() if streak.last_active_date else None

    if last_active == today:
        # Already logged activity today, streak continues unchanged
        return streak.current_count, False

    yesterday = today - timedelta(days=1)
    is_record = False

    if last_active == yesterday:
        # Streak continued!
        streak.current_count += 1
        if streak.current_count > streak.longest_count:
            streak.longest_count = streak.current_count
            is_record = True
        streak.recovery_quest_id = None
    else:
        # Missed a day -> Provide recovery quest rather than punitive zero wipe
        streak.recovery_quest_id = "recovery_daily_boost"
        # Reset current streak to 1
        streak.current_count = 1

    streak.last_active_date = datetime.utcnow()
    db.commit()
    return streak.current_count, is_record

def update_user_attributes(
    user_id: str,
    primary_name: str,
    secondary_name: str,
    db: Session
) -> dict[str, int]:
    """Increments primary (+5) and secondary (+2) attributes and updates mastery %."""
    deltas = {}
    primary_delta = 5
    secondary_delta = 2

    # Map primary
    prim_attr = db.query(Attribute).filter(Attribute.name.ilike(primary_name)).first()
    if prim_attr:
        u_attr = db.query(UserAttribute).filter(
            UserAttribute.user_id == user_id,
            UserAttribute.attribute_id == prim_attr.id
        ).first()
        if not u_attr:
            u_attr = UserAttribute(user_id=user_id, attribute_id=prim_attr.id, value=10, mastery_percent=10.0)
            db.add(u_attr)
        u_attr.value += primary_delta
        u_attr.mastery_percent = min(100.0, round(u_attr.value * 1.5, 1))
        deltas[prim_attr.name.lower()] = primary_delta

    # Map secondary
    if secondary_name and secondary_name != primary_name:
        sec_attr = db.query(Attribute).filter(Attribute.name.ilike(secondary_name)).first()
        if sec_attr:
            u_attr = db.query(UserAttribute).filter(
                UserAttribute.user_id == user_id,
                UserAttribute.attribute_id == sec_attr.id
            ).first()
            if not u_attr:
                u_attr = UserAttribute(user_id=user_id, attribute_id=sec_attr.id, value=10, mastery_percent=10.0)
                db.add(u_attr)
            u_attr.value += secondary_delta
            u_attr.mastery_percent = min(100.0, round(u_attr.value * 1.5, 1))
            deltas[sec_attr.name.lower()] = secondary_delta

    db.commit()
    return deltas

def evaluate_achievements(user_id: str, db: Session) -> list[str]:
    """Checks rules and unlocks new achievements."""
    unlocked_names = []
    earned_ids = {
        ua.achievement_id for ua in db.query(UserAchievement.achievement_id).filter(UserAchievement.user_id == user_id)
    }

    achievements = db.query(Achievement).all()
    completions_count = db.query(QuestCompletion).filter(QuestCompletion.user_id == user_id).count()
    total_xp = get_user_total_xp(user_id, db)
    level, _, _ = calculate_level_from_xp(total_xp)
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    streak_count = streak.current_count if streak else 1

    for ach in achievements:
        if ach.id in earned_ids:
            continue

        unlocked = False
        if ach.trigger_rule == "complete_1_quest" and completions_count >= 1:
            unlocked = True
        elif ach.trigger_rule == "complete_5_quests" and completions_count >= 5:
            unlocked = True
        elif ach.trigger_rule == "complete_10_quests" and completions_count >= 10:
            unlocked = True
        elif ach.trigger_rule == "reach_level_2" and level >= 2:
            unlocked = True
        elif ach.trigger_rule == "reach_level_5" and level >= 5:
            unlocked = True
        elif ach.trigger_rule == "reach_level_10" and level >= 10:
            unlocked = True
        elif ach.trigger_rule == "streak_3_days" and streak_count >= 3:
            unlocked = True
        elif ach.trigger_rule == "streak_7_days" and streak_count >= 7:
            unlocked = True

        if unlocked:
            ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
            db.add(ua)
            # Award achievement XP & Gold to the append-only ledger
            if ach.reward_xp > 0:
                db.add(XPTransaction(user_id=user_id, amount=ach.reward_xp, source="achievement"))
            if ach.reward_gold > 0:
                db.add(GoldTransaction(user_id=user_id, amount=ach.reward_gold, source="achievement"))
            
            # Add notification
            db.add(Notification(
                user_id=user_id,
                type="achievement",
                title=f"Achievement Unlocked: {ach.name}",
                message=ach.description
            ))
            unlocked_names.append(ach.name)

    if unlocked_names:
        db.commit()

    return unlocked_names
