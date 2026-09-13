import json
import logging
from typing import Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini if API key is provided
gemini_model = None
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-key":
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        logger.warning(f"Could not initialize Gemini: {e}")

def generate_quest_plan(goal: str, timeframe_days: int = 30) -> list[dict]:
    """Generates a structured set of DRAFT quests for a user's goal."""
    if gemini_model:
        prompt = f"""
You are an RPG Quest Master in a gamified productivity system.
Turn this real-world user goal into 3-5 structured RPG quests:
Goal: "{goal}"
Timeframe: {timeframe_days} days.

Respond with ONLY valid JSON (no markdown formatting, no code blocks) matching this exact format:
[
  {{
    "title": "Clear actionable quest title",
    "description": "Short explanation of the milestone",
    "category": "Coding or Fitness or Deep Work or Reading or Life Ops",
    "difficulty": "easy or medium or hard",
    "estimated_duration": 45
  }}
]
"""
        try:
            response = gemini_model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            parsed = json.loads(clean_text.strip())
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception as e:
            logger.warning(f"Gemini API error in quest plan: {e}. Using intelligent fallback.")

    # Intelligent fallback generator based on keywords in goal
    lower_goal = goal.lower()
    if "code" in lower_goal or "dsa" in lower_goal or "dev" in lower_goal or "program" in lower_goal:
        return [
            {
                "title": f"Fundamentals of {goal[:25]}: Syntax & Basics",
                "description": "Review core concepts and complete 3 interactive problems.",
                "category": "Coding",
                "difficulty": "easy",
                "estimated_duration": 30
            },
            {
                "title": f"Algorithmic Gauntlet: Data Structures for {goal[:20]}",
                "description": "Implement key patterns: Array traversals and Hash table lookups.",
                "category": "Coding",
                "difficulty": "medium",
                "estimated_duration": 45
            },
            {
                "title": f"Capstone Prototype: Build & Test {goal[:20]}",
                "description": "Synthesize knowledge by assembling a working module with unit tests.",
                "category": "Coding",
                "difficulty": "hard",
                "estimated_duration": 60
            }
        ]
    elif "gym" in lower_goal or "run" in lower_goal or "workout" in lower_goal or "fit" in lower_goal:
        return [
            {
                "title": "Conditioning & Dynamic Mobility Routine",
                "description": "Complete full-body activation, stretching, and 20 min base cardio.",
                "category": "Health & Fitness",
                "difficulty": "easy",
                "estimated_duration": 30
            },
            {
                "title": "Hypertrophy Circuit: Core Compound Lifts",
                "description": "Perform 4 sets of compound movements focusing on strict form.",
                "category": "Health & Fitness",
                "difficulty": "medium",
                "estimated_duration": 45
            },
            {
                "title": "High-Intensity Endurance Challenge",
                "description": "Complete interval sprints and post-workout active recovery.",
                "category": "Health & Fitness",
                "difficulty": "hard",
                "estimated_duration": 50
            }
        ]
    else:
        return [
            {
                "title": f"Deep Focus: Research & Roadmap {goal[:25]}",
                "description": "Map out the prerequisites, resources, and weekly timeline.",
                "category": "Study & Deep Work",
                "difficulty": "easy",
                "estimated_duration": 30
            },
            {
                "title": f"Execution Sprint: Milestone 1 of {goal[:25]}",
                "description": "Immerse in a distraction-free 45-minute deep work block.",
                "category": "Study & Deep Work",
                "difficulty": "medium",
                "estimated_duration": 45
            },
            {
                "title": f"Mastery Review: Benchmark {goal[:25]}",
                "description": "Evaluate outputs, document key takeaways, and lock in the habit.",
                "category": "Mind & Reading",
                "difficulty": "medium",
                "estimated_duration": 30
            }
        ]

def generate_daily_coach(context: dict) -> dict:
    """Generates daily coaching insight grounded in sanitized user stats."""
    level = context.get("level", 1)
    streak = context.get("streak", 1)
    top_attr = context.get("top_attribute", "Intellect")
    low_attr = context.get("lowest_attribute", "Focus")
    completion_rate = context.get("completion_rate", 100)

    if gemini_model:
        prompt = f"""
You are the Life RPG AI Coach.
Context:
- Player Level: {level}
- Active Streak: {streak} days
- Leading Attribute: {top_attr}
- Growth Area Attribute: {low_attr}
- Recent Completion Rate: {completion_rate}%

Provide a high-impact, encouraging 2-sentence tactical recommendation and suggest ONE specific micro-quest to boost their lowest attribute ({low_attr}).
Output ONLY valid JSON (no markdown) in this format:
{{
  "insight": "Two-sentence tactical insight here.",
  "recommended_quest": {{
    "title": "Quest title",
    "category": "Category",
    "difficulty": "easy or medium",
    "estimated_duration": 30
  }}
}}
"""
        try:
            response = gemini_model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            return json.loads(clean_text.strip())
        except Exception as e:
            logger.warning(f"Gemini API error in daily coach: {e}")

    # Fallback contextual recommendation
    return {
        "insight": f"Your {top_attr} is surging with a strong {streak}-day streak! To balance your character stat block, channel your momentum into elevating {low_attr} today.",
        "recommended_quest": {
            "title": f"Tactical Focus Sprint: 25-min {low_attr} Deep Work",
            "category": "Study & Deep Work",
            "difficulty": "medium",
            "estimated_duration": 25
        }
    }

def recommend_difficulty(completion_rate: float, average_duration: int) -> dict:
    """Recommends difficulty adjustment based on performance history."""
    if completion_rate >= 85.0:
        return {
            "suggested_difficulty": "hard",
            "reason": f"High completion rate ({completion_rate:.0f}%). You are ready for higher XP/Gold multiplier quests to accelerate your level progression."
        }
    elif completion_rate >= 50.0:
        return {
            "suggested_difficulty": "medium",
            "reason": f"Balanced completion rate ({completion_rate:.0f}%). Consistent pacing maintains streak momentum without cognitive burnout."
        }
    else:
        return {
            "suggested_difficulty": "easy",
            "reason": f"Lower recent completion ({completion_rate:.0f}%). Smaller quick-win quests will re-ignite your streak and rebuild daily momentum."
        }
