import pytest
from app.services.rpg_engine import (
    total_xp_to_reach, calculate_level_from_xp, calculate_quest_reward
)

def test_xp_curve_progression():
    # Level 1 requires 0 XP
    assert total_xp_to_reach(1) == 0
    # Level 2 requires 100 * (2^1.8) ≈ 348 XP
    lvl2_xp = total_xp_to_reach(2)
    assert lvl2_xp > 300 and lvl2_xp < 400
    # Level 5 requires 100 * (5^1.8) ≈ 1811 XP
    lvl5_xp = total_xp_to_reach(5)
    assert lvl5_xp > 1500 and lvl5_xp < 2000
    # Strict monotonic increase
    assert total_xp_to_reach(3) > total_xp_to_reach(2)
    assert total_xp_to_reach(10) > total_xp_to_reach(5)

def test_calculate_level_from_xp():
    # 0 XP -> Level 1
    lvl, prog, needed = calculate_level_from_xp(0)
    assert lvl == 1
    assert prog == 0
    assert needed == total_xp_to_reach(2)

    # Reaching exact level 2 threshold
    lvl2_req = total_xp_to_reach(2)
    lvl, prog, needed = calculate_level_from_xp(lvl2_req)
    assert lvl == 2
    assert prog == 0

    # Intermediate XP between level 2 and 3
    lvl3_req = total_xp_to_reach(3)
    midpoint = lvl2_req + (lvl3_req - lvl2_req) // 2
    lvl, prog, needed = calculate_level_from_xp(midpoint)
    assert lvl == 2
    assert prog > 0
    assert prog < needed

def test_reward_calculation_difficulty_tiers():
    xp_trivial, gold_trivial = calculate_quest_reward("trivial", estimated_duration=30, current_level=1)
    xp_medium, gold_medium = calculate_quest_reward("medium", estimated_duration=30, current_level=1)
    xp_epic, gold_epic = calculate_quest_reward("epic", estimated_duration=30, current_level=1)

    assert xp_trivial < xp_medium < xp_epic
    assert gold_trivial < gold_medium < gold_epic

def test_reward_duration_scaling():
    xp_short, _ = calculate_quest_reward("medium", estimated_duration=15, current_level=1)
    xp_standard, _ = calculate_quest_reward("medium", estimated_duration=30, current_level=1)
    xp_long, _ = calculate_quest_reward("medium", estimated_duration=95, current_level=1)

    assert xp_short <= xp_standard <= xp_long
