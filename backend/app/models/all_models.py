import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from ..core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    quests = relationship("Quest", back_populates="user", cascade="all, delete-orphan")
    xp_transactions = relationship("XPTransaction", back_populates="user", cascade="all, delete-orphan")
    gold_transactions = relationship("GoldTransaction", back_populates="user", cascade="all, delete-orphan")
    user_attributes = relationship("UserAttribute", back_populates="user", cascade="all, delete-orphan")
    streak = relationship("Streak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="user", cascade="all, delete-orphan")
    user_achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    display_name = Column(String(100), default="Wanderer")
    avatar_url = Column(String(255), default="https://api.dicebear.com/7.x/bottts/svg?seed=Adventurer")
    character_title = Column(String(100), default="The Novice")
    character_created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class QuestCategory(Base):
    __tablename__ = "quest_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False)
    icon = Column(String(50), default="Sword")
    primary_attribute = Column(String(50), default="Intellect")
    secondary_attribute = Column(String(50), default="Focus")

    quests = relationship("Quest", back_populates="category")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    category_id = Column(String(36), ForeignKey("quest_categories.id"), nullable=True)
    difficulty = Column(String(20), default="medium")  # trivial, easy, medium, hard, epic
    status = Column(String(20), default="ACTIVE")  # DRAFT, ACTIVE, IN_PROGRESS, COMPLETED, ARCHIVED, PAUSED, FAILED, CANCELLED
    deadline = Column(DateTime, nullable=True)
    estimated_duration = Column(Integer, default=30)  # minutes
    recurrence = Column(String(20), default="none")  # none, daily, weekly
    created_at = Column(DateTime, default=datetime.utcnow)
    archived = Column(Boolean, default=False)

    user = relationship("User", back_populates="quests")
    category = relationship("QuestCategory", back_populates="quests")
    completions = relationship("QuestCompletion", back_populates="quest", cascade="all, delete-orphan")


class QuestCompletion(Base):
    __tablename__ = "quest_completions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quest_id = Column(String(36), ForeignKey("quests.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
    xp_awarded = Column(Integer, nullable=False)
    gold_awarded = Column(Integer, nullable=False)

    quest = relationship("Quest", back_populates="completions")


class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Integer, nullable=False)
    source = Column(String(50), default="quest_completion")
    quest_completion_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="xp_transactions")


class GoldTransaction(Base):
    __tablename__ = "gold_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Integer, nullable=False)  # signed, positive for earnings, negative for purchases
    source = Column(String(50), default="quest_completion")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="gold_transactions")


class Attribute(Base):
    __tablename__ = "attributes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False)  # Intellect, Strength, Focus, Discipline, Energy
    icon = Column(String(50), default="Zap")
    description = Column(String(255), default="")


class UserAttribute(Base):
    __tablename__ = "user_attributes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    attribute_id = Column(String(36), ForeignKey("attributes.id"), nullable=False)
    value = Column(Integer, default=10)
    mastery_percent = Column(Float, default=10.0)

    user = relationship("User", back_populates="user_attributes")
    attribute = relationship("Attribute")


class Streak(Base):
    __tablename__ = "streaks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_count = Column(Integer, default=1)
    longest_count = Column(Integer, default=1)
    last_active_date = Column(DateTime, default=datetime.utcnow)
    recovery_quest_id = Column(String(36), nullable=True)

    user = relationship("User", back_populates="streak")


class Item(Base):
    __tablename__ = "items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    type = Column(String(50), default="title")  # title, frame, theme, badge, effect
    price_gold = Column(Integer, nullable=False)
    icon = Column(String(50), default="Award")
    rarity = Column(String(20), default="common")  # common, rare, epic, legendary


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    item_id = Column(String(36), ForeignKey("items.id"), nullable=False)
    equipped = Column(Boolean, default=False)
    acquired_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="inventory")
    item = relationship("Item")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(String(255), default="")
    icon = Column(String(50), default="Trophy")
    category = Column(String(50), default="quest")
    trigger_rule = Column(String(100), default="complete_1_quest")
    reward_xp = Column(Integer, default=50)
    reward_gold = Column(Integer, default=25)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    achievement_id = Column(String(36), ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_achievements")
    achievement = relationship("Achievement")


class AIInteraction(Base):
    __tablename__ = "ai_interactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    prompt_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ai_interaction_id = Column(String(36), ForeignKey("ai_interactions.id", ondelete="CASCADE"), nullable=False)
    payload = Column(JSON, nullable=False)
    accepted = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    object_type = Column(String(50), nullable=False)
    object_id = Column(String(36), nullable=False)
    result = Column(String(20), default="SUCCESS")
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    type = Column(String(50), default="info")
    title = Column(String(100), nullable=False)
    message = Column(Text, default="")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
