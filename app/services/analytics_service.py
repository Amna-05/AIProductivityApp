"""
Analytics Service for productivity insights and statistics.

Provides comprehensive analytics by querying and aggregating task data:
- Overview metrics
- Completion trends
- Priority distribution
- Category performance
- Tag analytics
- Time-based insights
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, extract
from loguru import logger

from app.models.task import Task
from app.models.category import Category
from app.models.tag import Tag
from app.schemas.task import TaskStatus
from app.schemas.analytics import (
    OverviewAnalytics,
    CompletionTrendsAnalytics,
    DailyTrend,
    PriorityDistributionAnalytics,
    QuadrantStats,
    CategoryPerformanceAnalytics,
    CategoryStats,
    TagAnalytics,
    TagStats,
    TimeAnalytics,
    TimeDistribution,
    DashboardAnalytics,
)


class AnalyticsService:
    """Service for calculating productivity analytics and insights."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========================================================================
    # OVERVIEW ANALYTICS
    # ========================================================================

    async def get_overview(self, user_id: int) -> OverviewAnalytics:
        """
        Get high-level overview of user's task management productivity.

        Returns:
            OverviewAnalytics with current state and performance metrics
        """
        logger.debug(f"Calculating overview analytics for user {user_id}")

        # Total tasks
        total_result = await self.db.execute(
            select(func.count(Task.id)).where(Task.user_id == user_id)
        )
        total_tasks = total_result.scalar() or 0

        # Completed tasks
        completed_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(Task.user_id == user_id, Task.status == TaskStatus.DONE)
            )
        )
        completed_tasks = completed_result.scalar() or 0

        # Pending tasks (TODO + IN_PROGRESS)
        pending_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    or_(Task.status == TaskStatus.TODO, Task.status == TaskStatus.IN_PROGRESS)
                )
            )
        )
        pending_tasks = pending_result.scalar() or 0

        # In progress tasks
        in_progress_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(Task.user_id == user_id, Task.status == TaskStatus.IN_PROGRESS)
            )
        )
        in_progress_tasks = in_progress_result.scalar() or 0

        # Completion rate
        completion_rate = round((completed_tasks / total_tasks * 100), 2) if total_tasks > 0 else 0.0

        # Overdue tasks
        now = datetime.now(timezone.utc)
        overdue_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.status != TaskStatus.DONE,
                    Task.due_date.isnot(None),
                    Task.due_date < now
                )
            )
        )
        overdue_tasks = overdue_result.scalar() or 0

        # Tasks due today
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        due_today_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.status != TaskStatus.DONE,
                    Task.due_date.isnot(None),
                    Task.due_date <= today_end,
                    Task.due_date >= now
                )
            )
        )
        tasks_due_today = due_today_result.scalar() or 0

        # Tasks due this week (next 7 days)
        week_end = now + timedelta(days=7)
        due_week_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.status != TaskStatus.DONE,
                    Task.due_date.isnot(None),
                    Task.due_date <= week_end,
                    Task.due_date >= now
                )
            )
        )
        tasks_due_this_week = due_week_result.scalar() or 0

        # Average completion time
        avg_time_result = await self.db.execute(
            select(
                func.avg(
                    func.extract('epoch', Task.completed_at - Task.created_at) / 86400
                )
            ).where(
                and_(
                    Task.user_id == user_id,
                    Task.status == TaskStatus.DONE,
                    Task.completed_at.isnot(None)
                )
            )
        )
        avg_completion_time = avg_time_result.scalar() or 0.0
        average_completion_time_days = round(float(avg_completion_time), 1) if avg_completion_time else 0.0

        # Productivity score (weighted formula)
        # Factors: completion rate (40%), velocity (30%), on-time completion (30%)
        velocity_score = min(completed_tasks / 10 * 10, 100) if completed_tasks > 0 else 0  # Scale: 0-100
        on_time_rate = ((total_tasks - overdue_tasks) / total_tasks * 100) if total_tasks > 0 else 0
        productivity_score = round(
            (completion_rate * 0.4) + (velocity_score * 0.3) + (on_time_rate * 0.3),
            1
        )

        return OverviewAnalytics(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            in_progress_tasks=in_progress_tasks,
            completion_rate=completion_rate,
            overdue_tasks=overdue_tasks,
            tasks_due_today=tasks_due_today,
            tasks_due_this_week=tasks_due_this_week,
            average_completion_time_days=average_completion_time_days,
            productivity_score=productivity_score
        )

    # ========================================================================
    # COMPLETION TRENDS
    # ========================================================================

    async def get_completion_trends(
        self,
        user_id: int,
        period: str = "month",
        days: int = 30
    ) -> CompletionTrendsAnalytics:
        """
        Get task completion trends over time.

        Args:
            user_id: User ID
            period: Time period label (day, week, month, year)
            days: Number of days to analyze

        Returns:
            CompletionTrendsAnalytics with time series data
        """
        logger.debug(f"Calculating completion trends for user {user_id}, period: {period}")

        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        # Generate date range
        date_range = [(start_date + timedelta(days=i)).date() for i in range(days + 1)]

        # Get completed tasks grouped by date
        completed_query = await self.db.execute(
            select(
                func.date(Task.completed_at).label('date'),
                func.count(Task.id).label('count')
            ).where(
                and_(
                    Task.user_id == user_id,
                    Task.status == TaskStatus.DONE,
                    Task.completed_at.isnot(None),
                    Task.completed_at >= start_date
                )
            ).group_by(func.date(Task.completed_at))
        )
        completed_by_date = {row.date: row.count for row in completed_query}

        # Get created tasks grouped by date
        created_query = await self.db.execute(
            select(
                func.date(Task.created_at).label('date'),
                func.count(Task.id).label('count')
            ).where(
                and_(
                    Task.user_id == user_id,
                    Task.created_at >= start_date
                )
            ).group_by(func.date(Task.created_at))
        )
        created_by_date = {row.date: row.count for row in created_query}

        # Build time series data
        data = []
        total_completed = 0
        total_created = 0

        for date in date_range:
            completed = completed_by_date.get(date, 0)
            created = created_by_date.get(date, 0)
            total_completed += completed
            total_created += created

            data.append(DailyTrend(
                date=date.isoformat(),
                completed=completed,
                created=created
            ))

        completion_velocity = round(total_completed / days, 2) if days > 0 else 0.0
        net_change = total_created - total_completed

        return CompletionTrendsAnalytics(
            period=period,
            data=data,
            total_completed=total_completed,
            total_created=total_created,
            completion_velocity=completion_velocity,
            net_change=net_change
        )

    # ========================================================================
    # PRIORITY DISTRIBUTION
    # ========================================================================

    async def get_priority_distribution(self, user_id: int) -> PriorityDistributionAnalytics:
        """
        Get distribution of tasks across Eisenhower priority quadrants.

        Returns:
            PriorityDistributionAnalytics with stats for each quadrant
        """
        logger.debug(f"Calculating priority distribution for user {user_id}")

        quadrants = {
            "DO_FIRST": (True, True),      # Urgent + Important
            "SCHEDULE": (False, True),      # Not Urgent + Important
            "DELEGATE": (True, False),      # Urgent + Not Important
            "ELIMINATE": (False, False)     # Not Urgent + Not Important
        }

        by_quadrant = {}

        for quadrant_name, (is_urgent, is_important) in quadrants.items():
            # Count total tasks
            count_result = await self.db.execute(
                select(func.count(Task.id)).where(
                    and_(
                        Task.user_id == user_id,
                        Task.is_urgent == is_urgent,
                        Task.is_important == is_important
                    )
                )
            )
            count = count_result.scalar() or 0

            # Count completed tasks
            completed_result = await self.db.execute(
                select(func.count(Task.id)).where(
                    and_(
                        Task.user_id == user_id,
                        Task.is_urgent == is_urgent,
                        Task.is_important == is_important,
                        Task.status == TaskStatus.DONE
                    )
                )
            )
            completed = completed_result.scalar() or 0

            # Average completion time
            avg_time_result = await self.db.execute(
                select(
                    func.avg(
                        func.extract('epoch', Task.completed_at - Task.created_at) / 86400
                    )
                ).where(
                    and_(
                        Task.user_id == user_id,
                        Task.is_urgent == is_urgent,
                        Task.is_important == is_important,
                        Task.status == TaskStatus.DONE,
                        Task.completed_at.isnot(None)
                    )
                )
            )
            avg_time = avg_time_result.scalar() or 0.0

            completion_rate = round((completed / count * 100), 2) if count > 0 else 0.0
            avg_completion_time = round(float(avg_time), 1) if avg_time else None

            by_quadrant[quadrant_name] = QuadrantStats(
                count=count,
                completed=completed,
                completion_rate=completion_rate,
                average_completion_time_days=avg_completion_time
            )

        # Count urgent and important tasks
        urgent_tasks = by_quadrant["DO_FIRST"].count + by_quadrant["DELEGATE"].count
        important_tasks = by_quadrant["DO_FIRST"].count + by_quadrant["SCHEDULE"].count

        # Total tasks
        total_tasks = sum(quad.count for quad in by_quadrant.values())

        return PriorityDistributionAnalytics(
            by_quadrant=by_quadrant,
            urgent_tasks=urgent_tasks,
            important_tasks=important_tasks,
            total_tasks=total_tasks
        )

    # ========================================================================
    # CATEGORY PERFORMANCE
    # ========================================================================

    async def get_category_performance(self, user_id: int) -> CategoryPerformanceAnalytics:
        """
        Get performance metrics for all categories.

        Returns:
            CategoryPerformanceAnalytics with stats for each category
        """
        logger.debug(f"Calculating category performance for user {user_id}")

        # Get all user categories
        categories_result = await self.db.execute(
            select(Category).where(Category.user_id == user_id)
        )
        categories = categories_result.scalars().all()

        category_stats_list = []
        max_completion_rate = 0
        min_completion_rate = 100
        most_productive = None
        least_productive = None

        for category in categories:
            # Total tasks
            total_result = await self.db.execute(
                select(func.count(Task.id)).where(
                    and_(Task.user_id == user_id, Task.category_id == category.id)
                )
            )
            total = total_result.scalar() or 0

            if total == 0:
                continue  # Skip empty categories

            # Completed tasks
            completed_result = await self.db.execute(
                select(func.count(Task.id)).where(
                    and_(
                        Task.user_id == user_id,
                        Task.category_id == category.id,
                        Task.status == TaskStatus.DONE
                    )
                )
            )
            completed = completed_result.scalar() or 0

            # In progress
            in_progress_result = await self.db.execute(
                select(func.count(Task.id)).where(
                    and_(
                        Task.user_id == user_id,
                        Task.category_id == category.id,
                        Task.status == TaskStatus.IN_PROGRESS
                    )
                )
            )
            in_progress = in_progress_result.scalar() or 0

            # Pending
            pending = total - completed - in_progress

            # Completion rate
            completion_rate = round((completed / total * 100), 2) if total > 0 else 0.0

            # Track most/least productive
            if completion_rate > max_completion_rate:
                max_completion_rate = completion_rate
                most_productive = category.name
            if completion_rate < min_completion_rate:
                min_completion_rate = completion_rate
                least_productive = category.name

            # Average completion time
            avg_time_result = await self.db.execute(
                select(
                    func.avg(
                        func.extract('epoch', Task.completed_at - Task.created_at) / 86400
                    )
                ).where(
                    and_(
                        Task.user_id == user_id,
                        Task.category_id == category.id,
                        Task.status == TaskStatus.DONE,
                        Task.completed_at.isnot(None)
                    )
                )
            )
            avg_time = avg_time_result.scalar() or 0.0

            # Most common quadrant
            # (This is complex, simplified to None for now)
            most_common_quadrant = None

            category_stats_list.append(CategoryStats(
                id=category.id,
                name=category.name,
                color=category.color,
                total_tasks=total,
                completed_tasks=completed,
                in_progress_tasks=in_progress,
                pending_tasks=pending,
                completion_rate=completion_rate,
                average_completion_time_days=round(float(avg_time), 1) if avg_time else None,
                most_common_quadrant=most_common_quadrant
            ))

        return CategoryPerformanceAnalytics(
            categories=category_stats_list,
            total_categories=len(category_stats_list),
            most_productive_category=most_productive,
            least_productive_category=least_productive
        )

    # ========================================================================
    # TAG ANALYTICS
    # ========================================================================

    async def get_tag_analytics(self, user_id: int) -> TagAnalytics:
        """
        Get usage and performance statistics for all tags.

        Returns:
            TagAnalytics with stats for each tag
        """
        logger.debug(f"Calculating tag analytics for user {user_id}")

        # Get all user tags
        tags_result = await self.db.execute(
            select(Tag).where(Tag.user_id == user_id)
        )
        tags = tags_result.scalars().all()

        tag_stats_list = []
        most_used = []
        highest_completion = []

        for tag in tags:
            # Count tasks with this tag
            usage_result = await self.db.execute(
                select(func.count(Task.id))
                .select_from(Task)
                .join(Task.tags)
                .where(and_(Task.user_id == user_id, Tag.id == tag.id))
            )
            usage_count = usage_result.scalar() or 0

            if usage_count == 0:
                continue  # Skip unused tags

            # Count completed tasks with this tag
            completed_result = await self.db.execute(
                select(func.count(Task.id))
                .select_from(Task)
                .join(Task.tags)
                .where(
                    and_(
                        Task.user_id == user_id,
                        Tag.id == tag.id,
                        Task.status == TaskStatus.DONE
                    )
                )
            )
            completed_count = completed_result.scalar() or 0

            completion_rate = round((completed_count / usage_count * 100), 2) if usage_count > 0 else 0.0

            # Average completion time (simplified - actual implementation would be more complex)
            avg_completion_time = None

            tag_stats_list.append(TagStats(
                id=tag.id,
                name=tag.name,
                color=tag.color,
                usage_count=usage_count,
                completed_count=completed_count,
                completion_rate=completion_rate,
                average_completion_time_days=avg_completion_time
            ))

        # Sort for top lists
        sorted_by_usage = sorted(tag_stats_list, key=lambda x: x.usage_count, reverse=True)
        sorted_by_completion = sorted(tag_stats_list, key=lambda x: x.completion_rate, reverse=True)

        most_used = [tag.name for tag in sorted_by_usage[:5]]
        highest_completion = [tag.name for tag in sorted_by_completion[:5]]

        return TagAnalytics(
            tags=tag_stats_list,
            total_tags=len(tag_stats_list),
            most_used_tags=most_used,
            tags_with_highest_completion=highest_completion
        )

    # ========================================================================
    # TIME ANALYTICS
    # ========================================================================

    async def get_time_analytics(self, user_id: int) -> TimeAnalytics:
        """
        Get time-based insights into task completion patterns.

        Returns:
            TimeAnalytics with completion time distribution and patterns
        """
        logger.debug(f"Calculating time analytics for user {user_id}")

        # Get all completed tasks with completion times
        tasks_result = await self.db.execute(
            select(
                Task.id,
                Task.completed_at,
                Task.created_at,
                func.extract('epoch', Task.completed_at - Task.created_at).label('duration_seconds')
            ).where(
                and_(
                    Task.user_id == user_id,
                    Task.status == TaskStatus.DONE,
                    Task.completed_at.isnot(None)
                )
            )
        )
        tasks = tasks_result.all()

        # Categorize by completion time
        range_0_1 = 0
        range_2_3 = 0
        range_4_7 = 0
        range_1_2_weeks = 0
        range_2_plus = 0

        day_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}  # Monday=0, Sunday=6

        longest_days = 0
        fastest_hours = float('inf')

        for task in tasks:
            days = task.duration_seconds / 86400 if task.duration_seconds else 0
            hours = task.duration_seconds / 3600 if task.duration_seconds else 0

            if days <= 1:
                range_0_1 += 1
            elif days <= 3:
                range_2_3 += 1
            elif days <= 7:
                range_4_7 += 1
            elif days <= 14:
                range_1_2_weeks += 1
            else:
                range_2_plus += 1

            if days > longest_days:
                longest_days = int(days)
            if hours < fastest_hours and hours > 0:
                fastest_hours = hours

            # Day of week
            if task.completed_at:
                day_of_week = task.completed_at.weekday()
                day_counts[day_of_week] += 1

        # Find most/least productive days
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        sorted_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)
        most_productive = [day_names[day] for day, count in sorted_days[:3] if count > 0]
        least_productive = [day_names[day] for day, count in sorted_days[-3:] if count > 0]

        # Average tasks per day
        total_days = 30  # Approximate
        avg_per_day = round(len(tasks) / total_days, 1) if total_days > 0 else 0.0

        return TimeAnalytics(
            completion_time_distribution=TimeDistribution(
                range_0_1_days=range_0_1,
                range_2_3_days=range_2_3,
                range_4_7_days=range_4_7,
                range_1_2_weeks=range_1_2_weeks,
                range_2_plus_weeks=range_2_plus
            ),
            most_productive_days=most_productive,
            least_productive_days=least_productive,
            average_tasks_per_day=avg_per_day,
            longest_running_task_days=longest_days if longest_days > 0 else None,
            fastest_completion_hours=round(fastest_hours, 1) if fastest_hours < float('inf') else None
        )

    # ========================================================================
    # COMBINED DASHBOARD
    # ========================================================================

    async def get_dashboard_analytics(self, user_id: int, days: int = 30) -> DashboardAnalytics:
        """
        Get complete analytics dashboard data in a single call.

        Combines all analytics for efficient rendering.

        Args:
            user_id: User ID
            days: Number of days for trends analysis (default: 30)

        Returns:
            DashboardAnalytics with all metrics
        """
        logger.info(f"Generating complete analytics dashboard for user {user_id}, days={days}")

        # Determine period label based on days
        period = "week" if days <= 7 else "month" if days <= 30 else "quarter"

        # Get all analytics (can be optimized with concurrent queries)
        overview = await self.get_overview(user_id)
        trends = await self.get_completion_trends(user_id, period=period, days=days)
        priority_dist = await self.get_priority_distribution(user_id)
        category_perf = await self.get_category_performance(user_id)
        tag_analytics = await self.get_tag_analytics(user_id)

        # Top 5 categories and tags
        top_categories = sorted(
            category_perf.categories,
            key=lambda x: x.total_tasks,
            reverse=True
        )[:5]

        top_tags = sorted(
            tag_analytics.tags,
            key=lambda x: x.usage_count,
            reverse=True
        )[:5]

        return DashboardAnalytics(
            overview=overview,
            recent_trends=trends,
            priority_distribution=priority_dist,
            top_categories=top_categories,
            top_tags=top_tags
        )
