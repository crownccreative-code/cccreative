from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from config.database import get_db
from middleware.auth import get_current_user, require_admin
from models.project import (
    ProjectResponse, ProjectUpdate, ProjectStatus,
    TimelineUpdate, TimelineItem
)

router = APIRouter(prefix="/api/projects", tags=["Projects"])

async def get_project_response(db, project: dict) -> ProjectResponse:
    user = await db.users.find_one({"_id": project["user_id"]})
    timeline = [TimelineItem(**t) for t in project.get("timeline", [])]
    return ProjectResponse(
        id=str(project["_id"]),
        order_id=project["order_id"],
        user_id=str(project["user_id"]),
        user_name=user["name"] if user else None,
        user_email=user["email"] if user else None,
        title=project["title"],
        status=project["status"],
        timeline=timeline,
        created_at=project["created_at"]
    )

@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    status: Optional[ProjectStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    query = {}
    if current_user["role"] != "admin":
        query["user_id"] = ObjectId(current_user["id"])
    if status:
        query["status"] = status
    
    projects = await db.projects.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for project in projects:
        result.append(await get_project_response(db, project))
    
    return result

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    if str(project["user_id"]) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return await get_project_response(db, project)

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, update: ProjectUpdate, admin: dict = Depends(require_admin)):
    db = get_db()
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.projects.find_one_and_update(
        {"_id": ObjectId(project_id)},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return await get_project_response(db, result)

@router.post("/{project_id}/timeline", response_model=ProjectResponse)
async def update_timeline(project_id: str, timeline_update: TimelineUpdate, admin: dict = Depends(require_admin)):
    db = get_db()
    
    timeline_data = [t.model_dump() for t in timeline_update.timeline]
    
    result = await db.projects.find_one_and_update(
        {"_id": ObjectId(project_id)},
        {"$set": {"timeline": timeline_data}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return await get_project_response(db, result)
