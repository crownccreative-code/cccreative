from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from config.database import get_db
from middleware.auth import get_current_user, require_admin
from models.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderStatus,
    OrderItemCreate, OrderItemResponse, ApplyCouponRequest
)

router = APIRouter(prefix="/api/orders", tags=["Orders"])

async def calculate_order_totals(db, order_id: str):
    """Recalculate order totals based on items"""
    items = await db.order_items.find({"order_id": order_id}).to_list(100)
    subtotal = sum(item["line_total"] for item in items)
    tax = 0  # Can implement tax calculation later
    total = subtotal + tax
    
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"subtotal": subtotal, "tax": tax, "total": total}}
    )
    return subtotal, tax, total

async def get_order_with_items(db, order_id: str, check_user: str = None):
    """Get order with all items"""
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if check_user and str(order["user_id"]) != check_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get items
    items = await db.order_items.find({"order_id": order_id}).to_list(100)
    
    # Batch fetch all services and packages to avoid N+1 queries
    service_ids = [ObjectId(item["service_id"]) for item in items if item.get("service_id")]
    package_ids = [ObjectId(item["package_id"]) for item in items if item.get("package_id")]
    
    services_map = {}
    packages_map = {}
    
    if service_ids:
        services = await db.services.find({"_id": {"$in": service_ids}}).to_list(100)
        services_map = {str(s["_id"]): s["name"] for s in services}
    
    if package_ids:
        packages = await db.packages.find({"_id": {"$in": package_ids}}).to_list(100)
        packages_map = {str(p["_id"]): p["name"] for p in packages}
    
    item_responses = []
    for item in items:
        service_name = services_map.get(item.get("service_id")) if item.get("service_id") else None
        package_name = packages_map.get(item.get("package_id")) if item.get("package_id") else None
        
        item_responses.append(OrderItemResponse(
            id=str(item["_id"]),
            service_id=item.get("service_id"),
            package_id=item.get("package_id"),
            service_name=service_name,
            package_name=package_name,
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            line_total=item["line_total"]
        ))
    
    # Get user info
    user = await db.users.find_one({"_id": order["user_id"]})
    
    return OrderResponse(
        id=str(order["_id"]),
        user_id=str(order["user_id"]),
        user_name=user["name"] if user else None,
        user_email=user["email"] if user else None,
        status=order["status"],
        items=item_responses,
        subtotal=order.get("subtotal", 0),
        tax=order.get("tax", 0),
        total=order.get("total", 0),
        currency=order.get("currency", "usd"),
        notes=order.get("notes"),
        created_at=order["created_at"]
    )

@router.post("", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    order_doc = {
        "user_id": ObjectId(current_user["id"]),
        "status": OrderStatus.DRAFT,
        "subtotal": 0,
        "tax": 0,
        "total": 0,
        "currency": "usd",
        "notes": order_data.notes,
        "created_at": datetime.utcnow()
    }
    result = await db.orders.insert_one(order_doc)
    order_id = str(result.inserted_id)
    return await get_order_with_items(db, order_id)

@router.post("/{order_id}/items", response_model=OrderResponse)
async def add_order_item(order_id: str, item: OrderItemCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Verify order exists and belongs to user
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order["user_id"]) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    if order["status"] not in [OrderStatus.DRAFT, OrderStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Cannot modify this order")
    
    # Get price from service or package
    unit_price = 0
    if item.service_id:
        service = await db.services.find_one({"_id": ObjectId(item.service_id)})
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        unit_price = service["base_price"]
    elif item.package_id:
        package = await db.packages.find_one({"_id": ObjectId(item.package_id)})
        if not package:
            raise HTTPException(status_code=404, detail="Package not found")
        unit_price = package["price"]
    else:
        raise HTTPException(status_code=400, detail="Must provide service_id or package_id")
    
    # Create item
    item_doc = {
        "order_id": order_id,
        "service_id": item.service_id,
        "package_id": item.package_id,
        "quantity": item.quantity,
        "unit_price": unit_price,
        "line_total": unit_price * item.quantity
    }
    await db.order_items.insert_one(item_doc)
    
    # Recalculate totals
    await calculate_order_totals(db, order_id)
    
    return await get_order_with_items(db, order_id)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    check_user = None if current_user["role"] == "admin" else current_user["id"]
    return await get_order_with_items(db, order_id, check_user)

@router.get("", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[OrderStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    # Build query
    query = {}
    if current_user["role"] != "admin":
        query["user_id"] = ObjectId(current_user["id"])
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for order in orders:
        order_response = await get_order_with_items(db, str(order["_id"]))
        result.append(order_response)
    
    return result

@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, update: OrderUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permissions
    is_owner = str(order["user_id"]) == current_user["id"]
    is_admin = current_user["role"] == "admin"
    
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {}
    
    # Notes can be updated by owner or admin
    if update.notes is not None:
        update_data["notes"] = update.notes
    
    # Status can only be updated by admin (except certain transitions)
    if update.status is not None:
        if not is_admin:
            # Clients can only cancel their draft orders
            if order["status"] == OrderStatus.DRAFT and update.status == OrderStatus.CANCELED:
                update_data["status"] = update.status
            else:
                raise HTTPException(status_code=403, detail="Only admin can change order status")
        else:
            update_data["status"] = update.status
    
    if update_data:
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_data}
        )
    
    return await get_order_with_items(db, order_id)

@router.post("/{order_id}/apply-coupon")
async def apply_coupon(order_id: str, coupon: ApplyCouponRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if str(order["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find coupon
    coupon_doc = await db.coupons.find_one({
        "code": coupon.code.upper(),
        "active": True
    })
    
    if not coupon_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon")
    
    # Check expiration
    if coupon_doc.get("expires_at") and coupon_doc["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Apply discount
    subtotal = order["subtotal"]
    if coupon_doc["type"] == "percent":
        discount = subtotal * (coupon_doc["value"] / 100)
    else:
        discount = min(coupon_doc["value"], subtotal)
    
    new_total = subtotal - discount + order.get("tax", 0)
    
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "coupon_code": coupon.code.upper(),
            "discount": discount,
            "total": new_total
        }}
    )
    
    return {"message": "Coupon applied", "discount": discount, "new_total": new_total}

@router.delete("/{order_id}/items/{item_id}")
async def remove_order_item(order_id: str, item_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if str(order["user_id"]) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    if order["status"] not in [OrderStatus.DRAFT, OrderStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Cannot modify this order")
    
    result = await db.order_items.delete_one({"_id": ObjectId(item_id), "order_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await calculate_order_totals(db, order_id)
    
    return {"message": "Item removed"}
