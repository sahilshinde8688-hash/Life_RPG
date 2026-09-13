from sqlalchemy.orm import Session
from ..models.all_models import (
    Attribute, QuestCategory, Item, Achievement, User, Profile,
    UserAttribute, Streak, XPTransaction, GoldTransaction, Quest
)
from .security import get_password_hash

def seed_database(db: Session):
    """Populates reference tables and a default demo character."""
    # 1. Attributes
    default_attrs = [
        {"name": "Intellect", "icon": "Brain", "description": "Mental acuity, problem solving, and analytical study."},
        {"name": "Strength", "icon": "Shield", "description": "Physical capability, conditioning, and bodily power."},
        {"name": "Focus", "icon": "Target", "description": "Sustained attention, deep work, and distraction resistance."},
        {"name": "Discipline", "icon": "Flame", "description": "Consistency, habit retention, and unyielding follow-through."},
        {"name": "Energy", "icon": "Zap", "description": "Vitality, restorative sleep, and daily physiological stamina."}
    ]
    for a in default_attrs:
        existing = db.query(Attribute).filter(Attribute.name == a["name"]).first()
        if not existing:
            db.add(Attribute(name=a["name"], icon=a["icon"], description=a["description"]))
    db.commit()

    # 2. Quest Categories
    categories = [
        {"name": "Coding", "icon": "Code", "primary": "Intellect", "secondary": "Focus"},
        {"name": "Health & Fitness", "icon": "Activity", "primary": "Strength", "secondary": "Energy"},
        {"name": "Study & Deep Work", "icon": "BookOpen", "primary": "Focus", "secondary": "Discipline"},
        {"name": "Mind & Reading", "icon": "Compass", "primary": "Intellect", "secondary": "Discipline"},
        {"name": "Life Ops", "icon": "CheckSquare", "primary": "Discipline", "secondary": "Energy"}
    ]
    for c in categories:
        existing = db.query(QuestCategory).filter(QuestCategory.name == c["name"]).first()
        if not existing:
            db.add(QuestCategory(
                name=c["name"],
                icon=c["icon"],
                primary_attribute=c["primary"],
                secondary_attribute=c["secondary"]
            ))
    db.commit()

    # 3. Shop Items
    items = [
        {"name": "Cyberpunk Neon Frame", "type": "frame", "price_gold": 75, "rarity": "rare", "icon": "Sparkles", "description": "A high-tech luminous holographic avatar frame."},
        {"name": "Title: Code Alchemist", "type": "title", "price_gold": 120, "rarity": "epic", "icon": "Award", "description": "Transmuting syntax errors into golden algorithms."},
        {"name": "Title: Habit Architect", "type": "title", "price_gold": 90, "rarity": "rare", "icon": "Crown", "description": "Master planner of compounding daily routines."},
        {"name": "Golden Aura Theme", "type": "theme", "price_gold": 200, "rarity": "legendary", "icon": "Sun", "description": "Radiate an unyielding glow across your dashboard."},
        {"name": "Relentless Vanguard Badge", "type": "badge", "price_gold": 50, "rarity": "common", "icon": "ShieldCheck", "description": "Awarded to those who never surrender their streak."},
        {"name": "Title: Dragon Slayer", "type": "title", "price_gold": 300, "rarity": "legendary", "icon": "Flame", "description": "For those who vanquish their greatest procrastinations."}
    ]
    for it in items:
        existing = db.query(Item).filter(Item.name == it["name"]).first()
        if not existing:
            db.add(Item(
                name=it["name"],
                type=it["type"],
                price_gold=it["price_gold"],
                rarity=it["rarity"],
                icon=it["icon"],
                description=it["description"]
            ))
    db.commit()

    # 4. Achievements
    achievements = [
        {"name": "First Blood", "description": "Complete your very first RPG quest.", "icon": "CheckCircle2", "trigger_rule": "complete_1_quest", "reward_xp": 50, "reward_gold": 25},
        {"name": "Quest Apprentice", "description": "Complete 5 quests with verified action.", "icon": "Award", "trigger_rule": "complete_5_quests", "reward_xp": 100, "reward_gold": 50},
        {"name": "Grand Adventurer", "description": "Complete 10 quests across your journey.", "icon": "Trophy", "trigger_rule": "complete_10_quests", "reward_xp": 250, "reward_gold": 100},
        {"name": "Ascendance", "description": "Reach Character Level 2.", "icon": "TrendingUp", "trigger_rule": "reach_level_2", "reward_xp": 50, "reward_gold": 25},
        {"name": "Journeyman", "description": "Reach Character Level 5.", "icon": "Medal", "trigger_rule": "reach_level_5", "reward_xp": 150, "reward_gold": 75},
        {"name": "Flame Keeper", "description": "Maintain a 3-day active quest streak.", "icon": "Flame", "trigger_rule": "streak_3_days", "reward_xp": 100, "reward_gold": 50},
        {"name": "Unbreakable", "description": "Maintain a 7-day active quest streak.", "icon": "Zap", "trigger_rule": "streak_7_days", "reward_xp": 200, "reward_gold": 100}
    ]
    for ach in achievements:
        existing = db.query(Achievement).filter(Achievement.name == ach["name"]).first()
        if not existing:
            db.add(Achievement(
                name=ach["name"],
                description=ach["description"],
                icon=ach["icon"],
                trigger_rule=ach["trigger_rule"],
                reward_xp=ach["reward_xp"],
                reward_gold=ach["reward_gold"]
            ))
    db.commit()

    # 5. Seed Demo User
    demo_user = db.query(User).filter(User.email == "wanderer@liferpg.app").first()
    if not demo_user:
        demo_user = User(
            email="wanderer@liferpg.app",
            hashed_password=get_password_hash("password123")
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # Profile
        profile = Profile(
            user_id=demo_user.id,
            display_name="Sahil the Builder",
            avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=SahilBuilder",
            character_title="The Architect"
        )
        db.add(profile)

        # Starting Attributes
        all_attrs = db.query(Attribute).all()
        for att in all_attrs:
            db.add(UserAttribute(
                user_id=demo_user.id,
                attribute_id=att.id,
                value=15,
                mastery_percent=22.5
            ))

        # Initial Streak
        db.add(Streak(
            user_id=demo_user.id,
            current_count=3,
            longest_count=3
        ))

        # Initial ledger grants so demo user has starter XP & Gold
        db.add(XPTransaction(user_id=demo_user.id, amount=120, source="onboarding_bonus"))
        db.add(GoldTransaction(user_id=demo_user.id, amount=85, source="onboarding_bonus"))

        # Add starter quests
        coding_cat = db.query(QuestCategory).filter(QuestCategory.name == "Coding").first()
        fitness_cat = db.query(QuestCategory).filter(QuestCategory.name == "Health & Fitness").first()
        deepwork_cat = db.query(QuestCategory).filter(QuestCategory.name == "Study & Deep Work").first()

        starter_quests = [
            Quest(
                user_id=demo_user.id,
                title="Conquer Dynamic Programming: 2 Practice Problems",
                description="Solve 1 Memoization and 1 Tabulation problem on LeetCode without peeking at solutions.",
                category_id=coding_cat.id if coding_cat else None,
                difficulty="medium",
                status="ACTIVE",
                estimated_duration=45
            ),
            Quest(
                user_id=demo_user.id,
                title="Morning Conditioning: 5km Zone-2 Run",
                description="Maintain heart rate between 130-145 bpm. Focus on rhythmic breathing.",
                category_id=fitness_cat.id if fitness_cat else None,
                difficulty="medium",
                status="ACTIVE",
                estimated_duration=35
            ),
            Quest(
                user_id=demo_user.id,
                title="Deep Work Gauntlet: 50-minute Architecture Focus",
                description="Zero notifications, phone in airplane mode, review system design specs.",
                category_id=deepwork_cat.id if deepwork_cat else None,
                difficulty="hard",
                status="ACTIVE",
                estimated_duration=50
            ),
            Quest(
                user_id=demo_user.id,
                title="Review OS Kernel Concepts: Virtual Memory",
                description="Draft concise notes on page tables and TLB cache invalidation.",
                category_id=deepwork_cat.id if deepwork_cat else None,
                difficulty="easy",
                status="DRAFT",
                estimated_duration=25
            )
        ]
        for sq in starter_quests:
            db.add(sq)

        db.commit()
