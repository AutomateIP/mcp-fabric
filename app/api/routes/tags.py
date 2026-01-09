"""API routes for tag management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import uuid

from app.core.database import get_db
from app.api.schemas.tag import TagCreate, TagUpdate, TagResponse
from app.models.tag import Tag
from app.core.logging import get_logger

router = APIRouter(prefix="/api/tags", tags=["tags"])
logger = get_logger("api.tags")


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate, db: AsyncSession = Depends(get_db)
) -> TagResponse:
    """Create a new tag."""
    # Check if tag with same name exists
    result = await db.execute(select(Tag).where(Tag.name == tag_data.name))
    existing_tag = result.scalar_one_or_none()

    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag with name '{tag_data.name}' already exists",
        )

    tag = Tag(
        id=str(uuid.uuid4()),
        name=tag_data.name,
        color=tag_data.color,
        description=tag_data.description,
    )

    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        created_at=tag.created_at,
        tool_count=len(tag.tools),
        instance_count=len(tag.instances),
    )


@router.get("", response_model=list[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)) -> list[TagResponse]:
    """List all tags."""
    result = await db.execute(
        select(Tag).options(selectinload(Tag.tools), selectinload(Tag.instances))
    )
    tags = result.scalars().all()

    return [
        TagResponse(
            id=tag.id,
            name=tag.name,
            color=tag.color,
            description=tag.description,
            created_at=tag.created_at,
            tool_count=len(tag.tools),
            instance_count=len(tag.instances),
        )
        for tag in tags
    ]


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: str, db: AsyncSession = Depends(get_db)) -> TagResponse:
    """Get a specific tag."""
    result = await db.execute(
        select(Tag)
        .where(Tag.id == tag_id)
        .options(selectinload(Tag.tools), selectinload(Tag.instances))
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )

    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        created_at=tag.created_at,
        tool_count=len(tag.tools),
        instance_count=len(tag.instances),
    )


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: str, tag_data: TagUpdate, db: AsyncSession = Depends(get_db)
) -> TagResponse:
    """Update a tag."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )

    # Update fields
    if tag_data.name is not None:
        # Check if new name conflicts with existing tag
        result = await db.execute(
            select(Tag).where(Tag.name == tag_data.name, Tag.id != tag_id)
        )
        existing_tag = result.scalar_one_or_none()
        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag with name '{tag_data.name}' already exists",
            )
        tag.name = tag_data.name

    if tag_data.color is not None:
        tag.color = tag_data.color

    if tag_data.description is not None:
        tag.description = tag_data.description

    await db.commit()
    await db.refresh(tag)

    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        created_at=tag.created_at,
        tool_count=len(tag.tools),
        instance_count=len(tag.instances),
    )


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: str, db: AsyncSession = Depends(get_db)) -> None:
    """Delete a tag."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )

    # Check if tag is in use
    if len(tag.tools) > 0 or len(tag.instances) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag is in use by {len(tag.tools)} tools and {len(tag.instances)} instances",
        )

    await db.delete(tag)
    await db.commit()
