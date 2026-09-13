from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.all_models import (
    User, Item, Inventory, Achievement, UserAchievement, GoldTransaction, Profile
)
from ..services.rpg_engine import get_user_gold_balance

router = APIRouter(prefix="", tags=["Economy & Shop"])

class EquipUpdateRequest(BaseModel):
    equipped: bool

@router.get("/shop")
def get_shop_catalog(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    gold_balance = get_user_gold_balance(user.id, db)
    owned_item_ids = {
        inv.item_id for inv in db.query(Inventory.item_id).filter(Inventory.user_id == user.id).all()
    }

    items = db.query(Item).all()
    catalog = []
    for item in items:
        is_owned = item.id in owned_item_ids
        can_afford = gold_balance >= item.price_gold
        shortfall = max(0, item.price_gold - gold_balance)
        catalog.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "type": item.type,
            "price_gold": item.price_gold,
            "rarity": item.rarity,
            "icon": item.icon,
            "is_owned": is_owned,
            "can_afford": can_afford,
            "shortfall": shortfall
        })

    return {
        "gold_balance": gold_balance,
        "items": catalog
    }

@router.post("/shop/{item_id}/purchase")
def purchase_item(
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "ITEM_NOT_FOUND", "message": "Item not found in shop catalog."}}
        )

    # Check if already owned
    already_owned = db.query(Inventory).filter(
        Inventory.user_id == user.id,
        Inventory.item_id == item.id
    ).first()
    if already_owned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "ALREADY_OWNED", "message": "You already own this item."}}
        )

    # Recompute current Gold balance from append-only ledger
    gold_balance = get_user_gold_balance(user.id, db)
    if gold_balance < item.price_gold:
        shortfall = item.price_gold - gold_balance
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INSUFFICIENT_FUNDS",
                    "message": f"Not enough Gold for this purchase. Need {shortfall} more Gold.",
                    "shortfall": shortfall
                }
            }
        )

    # Atomic transaction: negative ledger row + inventory row
    db.add(GoldTransaction(
        user_id=user.id,
        amount=-item.price_gold,
        source="shop_purchase"
    ))

    new_inv = Inventory(
        user_id=user.id,
        item_id=item.id,
        equipped=False
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)

    updated_gold = get_user_gold_balance(user.id, db)

    return {
        "status": "success",
        "message": f"Successfully acquired '{item.name}'!",
        "new_gold_balance": updated_gold,
        "inventory_id": new_inv.id,
        "item": {
            "id": item.id,
            "name": item.name,
            "type": item.type
        }
    }

@router.get("/inventory")
def get_user_inventory(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inventory_entries = db.query(Inventory).filter(Inventory.user_id == user.id).all()
    results = []
    for inv in inventory_entries:
        item = inv.item
        results.append({
            "inventory_id": inv.id,
            "item_id": item.id,
            "name": item.name,
            "description": item.description,
            "type": item.type,
            "rarity": item.rarity,
            "icon": item.icon,
            "equipped": inv.equipped,
            "acquired_at": inv.acquired_at
        })
    return results

@router.patch("/inventory/{inventory_id}")
def update_inventory_equipped(
    inventory_id: str,
    req: EquipUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.user_id == user.id
    ).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "ITEM_NOT_FOUND", "message": "Inventory item not found."}}
        )

    inv.equipped = req.equipped

    # If equipping a title or frame, unequip existing ones of same type and update profile
    if req.equipped:
        other_same_type = db.query(Inventory).join(Item).filter(
            Inventory.user_id == user.id,
            Inventory.id != inv.id,
            Item.type == inv.item.type
        ).all()
        for o in other_same_type:
            o.equipped = False

        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        if profile and inv.item.type == "title":
            clean_title = inv.item.name.replace("Title: ", "")
            profile.character_title = clean_title

    db.commit()

    return {
        "status": "success",
        "inventory_id": inv.id,
        "equipped": inv.equipped,
        "item_name": inv.item.name
    }

@router.get("/achievements")
def get_user_achievements(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    achievements = db.query(Achievement).all()
    earned_map = {
        ua.achievement_id: ua.earned_at
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }

    output = []
    for ach in achievements:
        earned_at = earned_map.get(ach.id)
        output.append({
            "id": ach.id,
            "name": ach.name,
            "description": ach.description,
            "icon": ach.icon,
            "category": ach.category,
            "reward_xp": ach.reward_xp,
            "reward_gold": ach.reward_gold,
            "unlocked": earned_at is not None,
            "earned_at": earned_at
        })

    # Sort unlocked first
    output.sort(key=lambda x: x["unlocked"], reverse=True)
    return output
