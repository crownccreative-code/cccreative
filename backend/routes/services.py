from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from config.database import get_db
from middleware.auth import get_current_user, require_admin
from models.service import (
    ServiceCreate, ServiceUpdate, ServiceResponse,
    PackageCreate, PackageUpdate, PackageResponse
)

router = APIRouter(prefix="/api", tags=["Services"])

# ============ SERVICES ============

@router.get("/services", response_model=List[ServiceResponse])
async def get_services(active_only: bool = True):
    db = get_db()
    query = {"active": True} if active_only else {}
    services = await db.services.find(query).to_list(100)
    return [
        ServiceResponse(
            id=str(s["_id"]),
            name=s["name"],
            description=s["description"],
            base_price=s["base_price"],
            category=s["category"],
            deliverables_text=s.get("deliverables_text"),
            active=s["active"],
            created_at=s["created_at"]
        ) for s in services
    ]

@router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: str):
    db = get_db()
    service = await db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return ServiceResponse(
        id=str(service["_id"]),
        name=service["name"],
        description=service["description"],
        base_price=service["base_price"],
        category=service["category"],
        deliverables_text=service.get("deliverables_text"),
        active=service["active"],
        created_at=service["created_at"]
    )

@router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, admin: dict = Depends(require_admin)):
    db = get_db()
    service_doc = {
        **service.model_dump(),
        "created_at": datetime.utcnow()
    }
    result = await db.services.insert_one(service_doc)
    service_doc["_id"] = result.inserted_id
    return ServiceResponse(
        id=str(result.inserted_id),
        **service.model_dump(),
        created_at=service_doc["created_at"]
    )

@router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, update: ServiceUpdate, admin: dict = Depends(require_admin)):
    db = get_db()
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.services.find_one_and_update(
        {"_id": ObjectId(service_id)},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return ServiceResponse(
        id=str(result["_id"]),
        name=result["name"],
        description=result["description"],
        base_price=result["base_price"],
        category=result["category"],
        deliverables_text=result.get("deliverables_text"),
        active=result["active"],
        created_at=result["created_at"]
    )

@router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.services.delete_one({"_id": ObjectId(service_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

# ============ PACKAGES ============

@router.get("/packages", response_model=List[PackageResponse])
async def get_packages(active_only: bool = True):
    db = get_db()
    query = {"active": True} if active_only else {}
    packages = await db.packages.find(query).to_list(100)
    return [
        PackageResponse(
            id=str(p["_id"]),
            name=p["name"],
            tier=p["tier"],
            price=p["price"],
            included_services=p.get("included_services", []),
            active=p["active"],
            created_at=p["created_at"]
        ) for p in packages
    ]

@router.post("/packages", response_model=PackageResponse)
async def create_package(package: PackageCreate, admin: dict = Depends(require_admin)):
    db = get_db()
    package_doc = {
        **package.model_dump(),
        "created_at": datetime.utcnow()
    }
    result = await db.packages.insert_one(package_doc)
    return PackageResponse(
        id=str(result.inserted_id),
        **package.model_dump(),
        created_at=package_doc["created_at"]
    )

@router.put("/packages/{package_id}", response_model=PackageResponse)
async def update_package(package_id: str, update: PackageUpdate, admin: dict = Depends(require_admin)):
    db = get_db()
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.packages.find_one_and_update(
        {"_id": ObjectId(package_id)},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Package not found")
    
    return PackageResponse(
        id=str(result["_id"]),
        name=result["name"],
        tier=result["tier"],
        price=result["price"],
        included_services=result.get("included_services", []),
        active=result["active"],
        created_at=result["created_at"]
    )

@router.delete("/packages/{package_id}")
async def delete_package(package_id: str, admin: dict = Depends(require_admin)):
    db = get_db()
    result = await db.packages.delete_one({"_id": ObjectId(package_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"message": "Package deleted successfully"}
