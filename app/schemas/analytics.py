"""
Analytics schemas for productivity insights and statistics.

Provides comprehensive data models for:
- Overview metrics
- Completion trends
- Priority distribution
- Category performance
- Tag analytics
- Time-based insights
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ============================================================================
# OVERVIEW ANALYTICS
# ============================================================================

class OverviewAnalytics(BaseModel):
    """
    High-level overview of user's task management productivity.

    Provides quick snapshot of current state and overall performance.
    """
    total_tasks: int = Field(..., description="Total number of tasks")
    completed_tasks: int = Field(..., description="Number of completed tasks")
    pending_tasks: int = Field(..., description="Tasks with status TODO or IN_PROGRESS")
    in_progress_tasks: int = Field(..., description="Tasks currently being worked on")
    completion_rate: float = Field(..., description="Percentage of tasks completed (0-100)")
    overdue_tasks: int = Field(..., description="Tasks past their due date")
    tasks_due_today: int = Field(..., description="Tasks due today")
    tasks_due_this_week: int = Field(..., description="Tasks due within 7 days")
    average_completion_time_days: float = Field(..., description="Average days to complete a task")
    productivity_score: float = Field(..., description="Overall productivity score (0-100)")

    class Config:
        json_schema_extra = {
            "example": {
                "total_tasks": 150,
                "completed_tasks": 89,
                "pending_tasks": 45,
                "in_progress_tasks": 16,
                "completion_rate": 59.3,
                "overdue_tasks": 8,
                "tasks_due_today": 5,
                "tasks_due_this_week": 12,
                "average_completion_time_days": 3.2,
                "productivity_score": 78.5
            }
        }


# ============================================================================
# COMPLETION TRENDS
# ============================================================================

class DailyTrend(BaseModel):
    """Single day's task activity."""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    completed: int = Field(..., description="Tasks completed on this date")
    created: int = Field(..., description="Tasks created on this date")


class CompletionTrendsAnalytics(BaseModel):
    """
    Task completion trends over time.

    Shows how many tasks were created vs completed each day/week/month.
    Helps identify productivity patterns and bottlenecks.
    """
    period: str = Field(..., description="Time period: day, week, month, year")
    data: List[DailyTrend] = Field(..., description="Time series data")
    total_completed: int = Field(..., description="Total tasks completed in period")
    total_created: int = Field(..., description="Total tasks created in period")
    completion_velocity: float = Field(..., description="Average tasks completed per day")
    net_change: int = Field(..., description="Created - Completed (positive = backlog growing)")

    class Config:
        json_schema_extra = {
            "example": {
                "period": "month",
                "data": [
                    {"date": "2025-12-01", "completed": 5, "created": 8},
                    {"date": "2025-12-02", "completed": 3, "created": 6}
                ],
                "total_completed": 89,
                "total_created": 120,
                "completion_velocity": 3.2,
                "net_change": 31
            }
        }


# ============================================================================
# PRIORITY DISTRIBUTION
# ============================================================================

class QuadrantStats(BaseModel):
    """Statistics for a single Eisenhower quadrant."""
    count: int = Field(..., description="Number of tasks in this quadrant")
    completed: int = Field(..., description="Completed tasks in this quadrant")
    completion_rate: float = Field(..., description="Percentage completed (0-100)")
    average_completion_time_days: float | None = Field(default=None, description="Average days to complete")


class PriorityDistributionAnalytics(BaseModel):
    """
    Distribution of tasks across Eisenhower priority quadrants.

    Shows how tasks are distributed and which quadrants have best completion rates.
    """
    by_quadrant: Dict[str, QuadrantStats] = Field(
        ...,
        description="Stats for each quadrant: DO_FIRST, SCHEDULE, DELEGATE, ELIMINATE"
    )
    urgent_tasks: int = Field(..., description="Total urgent tasks (DO_FIRST + DELEGATE)")
    important_tasks: int = Field(..., description="Total important tasks (DO_FIRST + SCHEDULE)")
    total_tasks: int = Field(..., description="Total tasks analyzed")

    class Config:
        json_schema_extra = {
            "example": {
                "by_quadrant": {
                    "DO_FIRST": {
                        "count": 25,
                        "completed": 18,
                        "completion_rate": 72.0,
                        "average_completion_time_days": 1.5
                    },
                    "SCHEDULE": {
                        "count": 40,
                        "completed": 30,
                        "completion_rate": 75.0,
                        "average_completion_time_days": 5.2
                    }
                },
                "urgent_tasks": 40,
                "important_tasks": 65,
                "total_tasks": 100
            }
        }


# ============================================================================
# CATEGORY PERFORMANCE
# ============================================================================

class CategoryStats(BaseModel):
    """Performance statistics for a single category."""
    id: int = Field(..., description="Category ID")
    name: str = Field(..., description="Category name")
    color: str | None = Field(default=None, description="Category color")
    total_tasks: int = Field(..., description="Total tasks in this category")
    completed_tasks: int = Field(..., description="Completed tasks")
    in_progress_tasks: int = Field(..., description="Tasks in progress")
    pending_tasks: int = Field(..., description="Pending tasks")
    completion_rate: float = Field(..., description="Percentage completed (0-100)")
    average_completion_time_days: float | None = Field(default=None, description="Average days to complete")
    most_common_quadrant: str | None = Field(default=None, description="Most frequently used quadrant")


class CategoryPerformanceAnalytics(BaseModel):
    """
    Performance metrics for all categories.

    Helps identify which categories are most active and successful.
    """
    categories: List[CategoryStats] = Field(..., description="Stats for each category")
    total_categories: int = Field(..., description="Number of categories analyzed")
    most_productive_category: str | None = Field(default=None, description="Category with highest completion rate")
    least_productive_category: str | None = Field(default=None, description="Category with lowest completion rate")

    class Config:
        json_schema_extra = {
            "example": {
                "categories": [
                    {
                        "id": 1,
                        "name": "Development",
                        "color": "#3b82f6",
                        "total_tasks": 45,
                        "completed_tasks": 30,
                        "in_progress_tasks": 10,
                        "pending_tasks": 5,
                        "completion_rate": 66.7,
                        "average_completion_time_days": 2.5,
                        "most_common_quadrant": "DO_FIRST"
                    }
                ],
                "total_categories": 5,
                "most_productive_category": "Development",
                "least_productive_category": "Learning"
            }
        }


# ============================================================================
# TAG ANALYTICS
# ============================================================================

class TagStats(BaseModel):
    """Usage and performance statistics for a single tag."""
    id: int = Field(..., description="Tag ID")
    name: str = Field(..., description="Tag name")
    color: str | None = Field(default=None, description="Tag color")
    usage_count: int = Field(..., description="Number of tasks with this tag")
    completed_count: int = Field(..., description="Completed tasks with this tag")
    completion_rate: float = Field(..., description="Percentage completed (0-100)")
    average_completion_time_days: float | None = Field(default=None, description="Average days to complete")


class TagAnalytics(BaseModel):
    """
    Analytics for tag usage and performance.

    Shows which tags are most used and their correlation with task completion.
    """
    tags: List[TagStats] = Field(..., description="Stats for each tag")
    total_tags: int = Field(..., description="Number of tags analyzed")
    most_used_tags: List[str] = Field(..., description="Top 5 most frequently used tags")
    tags_with_highest_completion: List[str] = Field(..., description="Top 5 tags with best completion rates")

    class Config:
        json_schema_extra = {
            "example": {
                "tags": [
                    {
                        "id": 1,
                        "name": "urgent",
                        "color": "#ef4444",
                        "usage_count": 35,
                        "completed_count": 30,
                        "completion_rate": 85.7,
                        "average_completion_time_days": 1.2
                    }
                ],
                "total_tags": 10,
                "most_used_tags": ["urgent", "bug", "feature", "documentation", "testing"],
                "tags_with_highest_completion": ["urgent", "bug", "hotfix", "meeting", "review"]
            }
        }


# ============================================================================
# TIME-BASED ANALYTICS
# ============================================================================

class TimeDistribution(BaseModel):
    """Distribution of tasks by completion time."""
    range_0_1_days: int = Field(..., description="Completed in 0-1 days")
    range_2_3_days: int = Field(..., description="Completed in 2-3 days")
    range_4_7_days: int = Field(..., description="Completed in 4-7 days")
    range_1_2_weeks: int = Field(..., description="Completed in 1-2 weeks")
    range_2_plus_weeks: int = Field(..., description="Completed in 2+ weeks")


class TimeAnalytics(BaseModel):
    """
    Time-based insights into task completion patterns.

    Shows when and how quickly tasks get completed.
    """
    completion_time_distribution: TimeDistribution = Field(
        ...,
        description="Breakdown of completion times"
    )
    most_productive_days: List[str] = Field(
        ...,
        description="Days of week with most completions"
    )
    least_productive_days: List[str] = Field(
        ...,
        description="Days of week with least completions"
    )
    average_tasks_per_day: float = Field(..., description="Average tasks completed per day")
    longest_running_task_days: int | None = Field(default=None, description="Longest time to complete a task")
    fastest_completion_hours: float | None = Field(default=None, description="Fastest task completion time")

    class Config:
        json_schema_extra = {
            "example": {
                "completion_time_distribution": {
                    "range_0_1_days": 20,
                    "range_2_3_days": 35,
                    "range_4_7_days": 25,
                    "range_1_2_weeks": 15,
                    "range_2_plus_weeks": 5
                },
                "most_productive_days": ["Monday", "Tuesday", "Wednesday"],
                "least_productive_days": ["Saturday", "Sunday"],
                "average_tasks_per_day": 4.2,
                "longest_running_task_days": 45,
                "fastest_completion_hours": 0.5
            }
        }


# ============================================================================
# COMBINED DASHBOARD RESPONSE
# ============================================================================

class DashboardAnalytics(BaseModel):
    """
    Complete analytics dashboard data.

    Combines all analytics in a single response for dashboard rendering.
    """
    overview: OverviewAnalytics
    recent_trends: CompletionTrendsAnalytics
    priority_distribution: PriorityDistributionAnalytics
    top_categories: List[CategoryStats] = Field(..., description="Top 5 categories by task count")
    top_tags: List[TagStats] = Field(..., description="Top 5 tags by usage")

    class Config:
        json_schema_extra = {
            "example": {
                "overview": {
                    "total_tasks": 150,
                    "completed_tasks": 89,
                    "completion_rate": 59.3
                },
                "recent_trends": {
                    "period": "week",
                    "data": []
                },
                "priority_distribution": {
                    "by_quadrant": {}
                },
                "top_categories": [],
                "top_tags": []
            }
        }
