"""
AI-powered priority suggestion service using semantic similarity.

This service analyzes historical task patterns to suggest priorities for new tasks.

Algorithm:
1. Find similar completed tasks using vector similarity search
2. Calculate urgency score based on deadline
3. Calculate importance score from historical patterns
4. Combine scores with confidence level
5. Generate human-readable explanation

Key Features:
- Semantic similarity search (not just keyword matching)
- Weighted scoring based on similarity
- Confidence calculation
- Explainable AI (shows reasoning)
- Graceful degradation (works without history)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from loguru import logger
import numpy as np

from app.models.task import Task
from app.schemas.task import TaskStatus
from app.services.embedding_service import get_embedding_service


class PrioritySuggestionService:
    """
    Suggest task priorities based on semantic similarity and historical patterns.

    This is the "AI brain" that learns from your completed tasks to make
    intelligent priority suggestions for new tasks.

    Example:
        service = PrioritySuggestionService(db)
        suggestion = await service.suggest_priority(task_id=123, user_id=456)
        # Returns: {
        #     "suggested_urgent": True,
        #     "suggested_important": True,
        #     "confidence": 0.85,
        #     "reasoning": "Based on 3 similar tasks...",
        #     "similar_tasks": [...]
        # }
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize priority suggestion service.

        Args:
            db: Async database session for queries
        """
        self.db = db
        self.embedding_service = get_embedding_service()

    async def suggest_priority(
        self,
        task_id: int,
        user_id: int,
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """
        Suggest priority for a task based on similar historical tasks.

        Algorithm:
        1. Get current task and its embedding
        2. Find top K most similar completed tasks (vector search)
        3. Calculate urgency score (deadline-based)
        4. Calculate importance score (weighted by similarity)
        5. Determine suggested priority
        6. Calculate confidence level
        7. Generate explanation

        Args:
            task_id: ID of task to suggest priority for
            user_id: User ID (for privacy - only search user's tasks)
            top_k: Number of similar tasks to consider (default: 5)

        Returns:
            Dict with:
            - suggested_urgent: bool
            - suggested_important: bool
            - suggested_quadrant: str ("DO_FIRST", "SCHEDULE", etc.)
            - urgency_score: float (0-1)
            - importance_score: float (0-1)
            - confidence: float (0-1)
            - reasoning: str (human-readable explanation)
            - similar_tasks: List[Dict] (top 3 for display)

        Raises:
            ValueError: If task not found or has no embedding
        """
        # Get current task
        result = await self.db.execute(
            select(Task).where(
                and_(
                    Task.id == task_id,
                    Task.user_id == user_id,
                )
            )
        )
        current_task = result.scalars().first()

        if not current_task:
            raise ValueError(f"Task {task_id} not found for user {user_id}")

        if current_task.embedding is None:
            raise ValueError(
                f"Task {task_id} has no embedding. "
                "Embeddings are generated automatically on task creation. "
                "For existing tasks, use POST /ai/priority/generate-embeddings"
            )

        logger.info(
            f"Generating priority suggestion for task {task_id}",
            task_title=current_task.title,
            user_id=user_id,
        )

        # Find similar completed tasks
        similar_tasks = await self._find_similar_tasks(
            current_task.embedding,
            user_id,
            top_k=top_k,
        )

        # If no historical data, use fallback
        if not similar_tasks:
            logger.warning(
                f"No similar completed tasks found for task {task_id}",
                user_id=user_id,
            )
            return await self._fallback_suggestion(current_task)

        # Calculate priority scores
        urgency_score = self._calculate_urgency_score(current_task)
        importance_score = self._calculate_importance_score(similar_tasks)

        # Determine suggested priority
        suggested_urgent = urgency_score > 0.5
        suggested_important = importance_score > 0.5

        # Calculate confidence
        confidence = self._calculate_confidence(
            similar_tasks,
            urgency_score,
            importance_score,
        )

        # Generate explanation
        explanation = self._generate_explanation(
            current_task,
            similar_tasks,
            urgency_score,
            importance_score,
            suggested_urgent,
            suggested_important,
        )

        logger.info(
            f"Priority suggestion generated for task {task_id}",
            suggested_urgent=suggested_urgent,
            suggested_important=suggested_important,
            confidence=confidence,
            similar_tasks_count=len(similar_tasks),
        )

        return {
            "task_id": task_id,
            "suggested_urgent": suggested_urgent,
            "suggested_important": suggested_important,
            "suggested_quadrant": self._get_quadrant(
                suggested_urgent, suggested_important
            ),
            "urgency_score": round(urgency_score, 2),
            "importance_score": round(importance_score, 2),
            "confidence": round(confidence, 2),
            "reasoning": explanation,
            "similar_tasks": [
                {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description[:100] if task.description else None,
                    "similarity": round(task.similarity, 3),
                    "was_urgent": task.is_urgent,
                    "was_important": task.is_important,
                    "quadrant": task.quadrant,
                    "completion_time_days": (
                        (task.completed_at - task.created_at).days
                        if task.completed_at
                        else None
                    ),
                    "created_at": task.created_at.isoformat(),
                    "completed_at": (
                        task.completed_at.isoformat() if task.completed_at else None
                    ),
                }
                for task in similar_tasks[:3]  # Top 3 for response
            ],
        }

    async def _find_similar_tasks(
        self,
        embedding: bytes,
        user_id: int,
        top_k: int = 5,
    ) -> List[Task]:
        """
        Find similar completed tasks using vector similarity.

        Uses cosine similarity to find tasks with similar semantic meaning.
        Only searches user's own completed tasks (privacy + relevance).

        Args:
            embedding: Query embedding (as bytes from database)
            user_id: User ID for privacy
            top_k: Number of similar tasks to return

        Returns:
            List[Task]: Similar tasks sorted by similarity (highest first)
                        Each task has a `.similarity` attribute added
        """
        # Convert embedding bytes to numpy array
        query_embedding = np.frombuffer(embedding, dtype=np.float32)

        # Get completed tasks with embeddings
        # Limit to 100 most recent for performance
        result = await self.db.execute(
            select(Task)
            .where(
                and_(
                    Task.user_id == user_id,
                    Task.status == TaskStatus.DONE,
                    Task.embedding.isnot(None),
                    Task.completed_at.isnot(None),
                )
            )
            .order_by(desc(Task.completed_at))
            .limit(100)
        )

        tasks = result.scalars().all()

        if not tasks:
            return []

        logger.debug(
            f"Searching {len(tasks)} completed tasks for similarities",
            user_id=user_id,
        )

        # Calculate similarities
        similarities = []
        for task in tasks:
            task_embedding = np.frombuffer(task.embedding, dtype=np.float32)
            similarity = self.embedding_service.compute_similarity(
                query_embedding,
                task_embedding,
            )
            similarities.append((task, similarity))

        # Sort by similarity (highest first)
        similarities.sort(key=lambda x: x[1], reverse=True)

        # Take top K
        top_tasks = []
        for task, similarity in similarities[:top_k]:
            # Attach similarity score to task object (for later use)
            task.similarity = similarity
            top_tasks.append(task)

        if top_tasks:
            avg_similarity = np.mean([t.similarity for t in top_tasks])
            logger.info(
                f"Found {len(top_tasks)} similar tasks",
                avg_similarity=round(avg_similarity, 3),
                top_similarity=round(top_tasks[0].similarity, 3),
            )

        return top_tasks

    def _calculate_urgency_score(self, task: Task) -> float:
        """
        Calculate urgency score based on deadline.

        Score mapping:
        - Overdue: 1.0 (max urgency!)
        - 0-1 days: 1.0 (very urgent)
        - 2-3 days: 0.8 (urgent)
        - 4-7 days: 0.6 (moderately urgent)
        - 8-14 days: 0.4 (some urgency)
        - 15-30 days: 0.2 (low urgency)
        - 30+ days or no deadline: 0.1 (not urgent)

        Args:
            task: Task to calculate urgency for

        Returns:
            float: Urgency score (0-1)
        """
        if not task.due_date:
            return 0.1  # No deadline = low urgency by default

        now = datetime.now(timezone.utc)
        days_until_due = (task.due_date - now).days

        # Score mapping
        if days_until_due < 0:
            return 1.0  # Overdue = max urgency
        elif days_until_due <= 1:
            return 1.0
        elif days_until_due <= 3:
            return 0.8
        elif days_until_due <= 7:
            return 0.6
        elif days_until_due <= 14:
            return 0.4
        elif days_until_due <= 30:
            return 0.2
        else:
            return 0.1

    def _calculate_importance_score(self, similar_tasks: List[Task]) -> float:
        """
        Calculate importance score from similar tasks.

        Uses weighted average based on similarity:
        - More similar tasks have more influence
        - If 80% of similar tasks were important → high importance score
        - Weighted by similarity to give more weight to very similar tasks

        Args:
            similar_tasks: List of similar tasks (must have .similarity attribute)

        Returns:
            float: Importance score (0-1)
        """
        if not similar_tasks:
            return 0.5  # Neutral if no history

        # Weighted average based on similarity
        total_weight = 0.0
        weighted_sum = 0.0

        for task in similar_tasks:
            weight = task.similarity  # More similar = more weight
            importance = 1.0 if task.is_important else 0.0

            weighted_sum += importance * weight
            total_weight += weight

        if total_weight == 0:
            return 0.5

        importance_score = weighted_sum / total_weight
        return importance_score

    def _calculate_confidence(
        self,
        similar_tasks: List[Task],
        urgency_score: float,
        importance_score: float,
    ) -> float:
        """
        Calculate confidence in the suggestion.

        Factors affecting confidence:
        1. Average similarity of similar tasks (higher = more confident)
        2. Consistency (do similar tasks agree on importance?)
        3. Number of samples (more = more confident, up to 5)
        4. Recency (more recent = more confident)

        Args:
            similar_tasks: Similar tasks found
            urgency_score: Calculated urgency
            importance_score: Calculated importance

        Returns:
            float: Confidence score (0-1)
        """
        if not similar_tasks:
            return 0.3  # Low confidence without history

        # Factor 1: Average similarity (0-1)
        avg_similarity = np.mean([t.similarity for t in similar_tasks])

        # Factor 2: Consistency - how much do similar tasks agree?
        important_count = sum(1 for t in similar_tasks if t.is_important)
        important_ratio = important_count / len(similar_tasks)
        # Consistency = distance from 50/50 split
        # 100% or 0% agree = high consistency
        # 50% agree = low consistency
        consistency = abs(important_ratio - 0.5) * 2  # Scale to 0-1

        # Factor 3: Number of samples (capped at 5)
        count_factor = min(len(similar_tasks) / 5.0, 1.0)

        # Factor 4: Recency (how recent are similar tasks?)
        now = datetime.now(timezone.utc)
        if similar_tasks[0].completed_at:
            days_since = (now - similar_tasks[0].completed_at).days
            # Recently completed = more confident
            # 0-30 days: 1.0, 30-90 days: 0.7, 90+ days: 0.5
            if days_since <= 30:
                recency_factor = 1.0
            elif days_since <= 90:
                recency_factor = 0.7
            else:
                recency_factor = 0.5
        else:
            recency_factor = 0.5

        # Combine factors (weighted)
        confidence = (
            avg_similarity * 0.4  # Most important
            + consistency * 0.3  # Agreement matters
            + count_factor * 0.2  # More samples helps
            + recency_factor * 0.1  # Recency helps a bit
        )

        # Cap confidence at 95% (never 100% certain)
        return min(confidence, 0.95)

    def _generate_explanation(
        self,
        task: Task,
        similar_tasks: List[Task],
        urgency_score: float,
        importance_score: float,
        suggested_urgent: bool,
        suggested_important: bool,
    ) -> str:
        """
        Generate human-readable explanation for the suggestion.

        Explains:
        - Why this urgency (deadline-based)
        - Why this importance (pattern-based)
        - What similar tasks show
        - Recommended action

        Args:
            task: Current task
            similar_tasks: Similar historical tasks
            urgency_score: Calculated urgency
            importance_score: Calculated importance
            suggested_urgent: Suggested urgency
            suggested_important: Suggested importance

        Returns:
            str: Human-readable explanation
        """
        parts = []

        # Part 1: Urgency reasoning
        if task.due_date:
            now = datetime.now(timezone.utc)
            days = (task.due_date - now).days

            if days < 0:
                parts.append(f"This task is overdue by {abs(days)} day(s). ")
            elif days == 0:
                parts.append("This task is due today. ")
            elif days == 1:
                parts.append("This task is due tomorrow. ")
            elif days <= 7:
                parts.append(f"This task is due in {days} days. ")
            elif days <= 30:
                parts.append(f"This task is due in {days} days. ")
            else:
                parts.append(f"This task is due in {days} days (plenty of time). ")
        else:
            parts.append("No deadline set for this task. ")

        # Part 2: Historical pattern analysis
        if similar_tasks:
            avg_sim = np.mean([t.similarity for t in similar_tasks])
            important_pct = (
                sum(1 for t in similar_tasks if t.is_important)
                / len(similar_tasks)
                * 100
            )
            urgent_pct = (
                sum(1 for t in similar_tasks if t.is_urgent)
                / len(similar_tasks)
                * 100
            )

            parts.append(
                f"Based on {len(similar_tasks)} similar task(s) "
                f"(average similarity: {avg_sim:.0%}), "
            )

            if important_pct >= 70:
                parts.append(f"{important_pct:.0f}% were marked as important. ")
            elif important_pct >= 40:
                parts.append(f"about half ({important_pct:.0f}%) were important. ")
            else:
                parts.append(f"only {important_pct:.0f}% were marked as important. ")

            # Completion time insights
            completion_times = [
                (t.completed_at - t.created_at).days
                for t in similar_tasks
                if t.completed_at
            ]
            if completion_times:
                avg_completion = np.mean(completion_times)
                min_completion = min(completion_times)
                max_completion = max(completion_times)

                if min_completion == max_completion:
                    parts.append(
                        f"Similar tasks took about {avg_completion:.0f} day(s) to complete. "
                    )
                else:
                    parts.append(
                        f"Similar tasks took {min_completion:.0f}-{max_completion:.0f} days "
                        f"(average: {avg_completion:.0f} days) to complete. "
                    )
        else:
            parts.append(
                "No similar completed tasks found in your history. "
                "This suggestion is based solely on the deadline. "
            )

        # Part 3: Recommendation
        quadrant = self._get_quadrant(suggested_urgent, suggested_important)

        quadrant_actions = {
            "DO_FIRST": "Do this first - it's both urgent and important. Prioritize this task immediately.",
            "SCHEDULE": "Schedule dedicated time for this - it's important but not urgent. Plan when you'll work on it.",
            "DELEGATE": "Consider delegating if possible - it's urgent but may not be critical to your core goals.",
            "ELIMINATE": "Question if this is necessary - it's neither urgent nor important. Consider removing or deferring indefinitely.",
        }

        parts.append(f"Recommendation: {quadrant_actions[quadrant]}")

        return "".join(parts)

    @staticmethod
    def _get_quadrant(is_urgent: bool, is_important: bool) -> str:
        """
        Get Eisenhower quadrant name.

        Args:
            is_urgent: Whether task is urgent
            is_important: Whether task is important

        Returns:
            str: Quadrant name
        """
        if is_urgent and is_important:
            return "DO_FIRST"
        elif not is_urgent and is_important:
            return "SCHEDULE"
        elif is_urgent and not is_important:
            return "DELEGATE"
        else:
            return "ELIMINATE"

    async def _fallback_suggestion(self, task: Task) -> Dict[str, Any]:
        """
        Fallback suggestion when no historical data available.

        Uses only deadline-based urgency, assumes neutral importance.

        Args:
            task: Task to suggest priority for

        Returns:
            Dict: Suggestion with low confidence
        """
        urgency_score = self._calculate_urgency_score(task)
        suggested_urgent = urgency_score > 0.5

        # Default to not important (let user decide)
        suggested_important = False

        logger.info(
            f"Using fallback suggestion for task {task.id} (no historical data)",
            suggested_urgent=suggested_urgent,
        )

        return {
            "task_id": task.id,
            "suggested_urgent": suggested_urgent,
            "suggested_important": suggested_important,
            "suggested_quadrant": (
                "DELEGATE" if suggested_urgent else "ELIMINATE"
            ),
            "urgency_score": round(urgency_score, 2),
            "importance_score": 0.5,  # Neutral
            "confidence": 0.3,  # Low confidence
            "reasoning": (
                "No similar historical tasks found in your completed tasks. "
                "This suggestion is based only on the deadline. "
                f"{'Task is urgent based on deadline. ' if suggested_urgent else 'No urgency based on deadline. '}"
                "As you complete more tasks, suggestions will become more personalized and accurate. "
                "Consider marking this task as important based on your own judgment."
            ),
            "similar_tasks": [],
        }
