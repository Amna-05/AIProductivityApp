"""
Analytics API endpoints for productivity insights.

Provides comprehensive analytics for user's task management:
- Overview metrics
- Completion trends
- Priority distribution
- Category performance
- Tag analytics
- Time-based insights
- Complete dashboard data
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.db.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_active_user
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    OverviewAnalytics,
    CompletionTrendsAnalytics,
    PriorityDistributionAnalytics,
    CategoryPerformanceAnalytics,
    TagAnalytics,
    TimeAnalytics,
    DashboardAnalytics,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/overview",
    response_model=OverviewAnalytics,
    summary="Get overview analytics",
    description="""
    Get high-level overview of user's task management productivity.

    **Returns:**
    - Total task counts by status
    - Completion rate
    - Overdue and upcoming tasks
    - Average completion time
    - Productivity score (0-100)

    **Use for:**
    - Dashboard overview cards
    - Quick productivity snapshot
    - KPI monitoring
    """
)
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> OverviewAnalytics:
    """Get overview analytics for current user."""
    logger.info(f"Fetching overview analytics for user {current_user.id}")

    service = AnalyticsService(db)
    return await service.get_overview(current_user.id)


@router.get(
    "/trends",
    response_model=CompletionTrendsAnalytics,
    summary="Get completion trends",
    description="""
    Get task completion trends over time.

    **Parameters:**
    - period: day, week, month, year (affects label only)
    - days: Number of days to analyze (default: 30)

    **Returns:**
    - Daily breakdown of tasks created vs completed
    - Total completion velocity
    - Net change (backlog growth/reduction)

    **Use for:**
    - Line charts showing productivity trends
    - Identifying bottlenecks
    - Workload analysis
    """
)
async def get_completion_trends(
    period: str = Query(
        "month",
        description="Time period label: day, week, month, year"
    ),
    days: int = Query(
        30,
        ge=1,
        le=365,
        description="Number of days to analyze"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CompletionTrendsAnalytics:
    """Get completion trends for current user."""
    logger.info(f"Fetching completion trends for user {current_user.id}, period={period}, days={days}")

    service = AnalyticsService(db)
    return await service.get_completion_trends(current_user.id, period, days)


@router.get(
    "/priority-distribution",
    response_model=PriorityDistributionAnalytics,
    summary="Get priority distribution",
    description="""
    Get distribution of tasks across Eisenhower priority quadrants.

    **Returns:**
    - Stats for each quadrant (DO_FIRST, SCHEDULE, DELEGATE, ELIMINATE)
    - Completion rates by quadrant
    - Average completion time by quadrant
    - Total urgent/important task counts

    **Use for:**
    - Pie charts showing task distribution
    - Priority matrix visualizations
    - Understanding work balance
    """
)
async def get_priority_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PriorityDistributionAnalytics:
    """Get priority distribution for current user."""
    logger.info(f"Fetching priority distribution for user {current_user.id}")

    service = AnalyticsService(db)
    return await service.get_priority_distribution(current_user.id)


@router.get(
    "/categories",
    response_model=CategoryPerformanceAnalytics,
    summary="Get category performance",
    description="""
    Get performance metrics for all categories.

    **Returns:**
    - Stats for each category (task counts, completion rates, average time)
    - Most/least productive categories

    **Use for:**
    - Category comparison tables
    - Bar charts showing category performance
    - Identifying high/low performing areas
    """
)
async def get_category_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CategoryPerformanceAnalytics:
    """Get category performance for current user."""
    logger.info(f"Fetching category performance for user {current_user.id}")

    service = AnalyticsService(db)
    return await service.get_category_performance(current_user.id)


@router.get(
    "/tags",
    response_model=TagAnalytics,
    summary="Get tag analytics",
    description="""
    Get usage and performance statistics for all tags.

    **Returns:**
    - Usage counts for each tag
    - Completion rates by tag
    - Most used tags
    - Tags with highest completion rates

    **Use for:**
    - Tag cloud visualizations
    - Understanding tag effectiveness
    - Optimizing tag usage
    """
)
async def get_tag_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TagAnalytics:
    """Get tag analytics for current user."""
    logger.info(f"Fetching tag analytics for user {current_user.id}")

    service = AnalyticsService(db)
    return await service.get_tag_analytics(current_user.id)


@router.get(
    "/time-analysis",
    response_model=TimeAnalytics,
    summary="Get time-based analytics",
    description="""
    Get time-based insights into task completion patterns.

    **Returns:**
    - Completion time distribution (0-1 days, 2-3 days, etc.)
    - Most/least productive days of week
    - Average tasks per day
    - Longest/fastest task completion times

    **Use for:**
    - Understanding work patterns
    - Identifying optimal working days
    - Time estimation improvements
    """
)
async def get_time_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TimeAnalytics:
    """Get time analytics for current user."""
    logger.info(f"Fetching time analytics for user {current_user.id}")

    service = AnalyticsService(db)
    return await service.get_time_analytics(current_user.id)


@router.get(
    "/dashboard",
    response_model=DashboardAnalytics,
    summary="Get complete dashboard analytics",
    description="""
    Get all analytics in a single call for dashboard rendering.

    **Returns:**
    - Overview metrics
    - Recent completion trends (last 7 days)
    - Priority distribution
    - Top 5 categories by task count
    - Top 5 tags by usage

    **Use for:**
    - Single API call for full dashboard
    - Efficient data loading
    - Initial page load

    **Performance:** Optimized to return in <1 second
    """
)
async def get_dashboard_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DashboardAnalytics:
    """Get complete dashboard analytics for current user."""
    logger.info(f"Fetching complete dashboard analytics for user {current_user.id}")

    service = AnalyticsService(db)
    return await service.get_dashboard_analytics(current_user.id)
