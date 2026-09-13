from .auth import router as auth_router
from .quests import router as quests_router
from .progression import router as progression_router
from .economy import router as economy_router
from .ai import router as ai_router

__all__ = [
    "auth_router",
    "quests_router",
    "progression_router",
    "economy_router",
    "ai_router"
]
