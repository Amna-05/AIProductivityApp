# app/services/ai_task_parser.py (GROQ VERSION)

"""
AI-powered task parsing using Groq (Free + Fast).
"""

import json
import re
from typing import Dict, Any
from datetime import datetime, timedelta, timezone
from groq import Groq
from app.core.config import settings


class AITaskParser:
    """Parse natural language into structured tasks using Groq."""
    
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
    
    def _calculate_relative_date(self, days_offset: int = 0) -> str:
        """Calculate ISO date for relative time references."""
        target = datetime.now(timezone.utc) + timedelta(days=days_offset)
        return target.isoformat()
    
    async def parse(
        self,
        user_input: str,
        available_categories: list[str],
        available_tags: list[str]
    ) -> Dict[str, Any]:
        """Parse natural language into structured task data."""
        
        current_time = datetime.now(timezone.utc)
        
        prompt = f"""You are a task assistant. Parse this into structured task JSON.

**Input:** "{user_input}"

**Current Date/Time:** {current_time.strftime('%A, %B %d, %Y at %I:%M %p')} UTC

**Available Categories:** {', '.join(available_categories) if available_categories else 'None'}
**Available Tags:** {', '.join(available_tags) if available_tags else 'None'}

**Return ONLY valid JSON (no markdown):**

{{
  "title": "Clear task title",
  "description": "Optional context or null",
  "due_date": "ISO 8601 datetime or null",
  "is_urgent": true/false,
  "is_important": true/false,
  "suggested_category": "Best match or null",
  "suggested_tags": ["tag1", "tag2"],
  "confidence": 0.0-1.0
}}

**Date Examples:**
- "tomorrow" → {self._calculate_relative_date(1)}
- "next week" → {self._calculate_relative_date(7)}

**Urgency:** "urgent", "ASAP" → is_urgent: true
**Importance:** "important", "priority" → is_important: true

Return ONLY the JSON, no explanation."""

        try:
            # Call Groq API
            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Fast + accurate
                messages=[
                    {"role": "system", "content": "You are a JSON-only API. Return valid JSON with no markdown."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"}  # ✅ Force JSON output
            )
            
            response_text = completion.choices[0].message.content.strip()
            
            # Parse JSON
            parsed = json.loads(response_text)
            
            return {
                "title": parsed.get("title", user_input[:100]),
                "description": parsed.get("description"),
                "due_date": parsed.get("due_date"),
                "is_urgent": bool(parsed.get("is_urgent", False)),
                "is_important": bool(parsed.get("is_important", False)),
                "suggested_category": parsed.get("suggested_category"),
                "suggested_tags": parsed.get("suggested_tags", []),
                "confidence": float(parsed.get("confidence", 0.5))
            }
            
        except json.JSONDecodeError:
            # Fallback
            return {
                "title": user_input[:100],
                "description": None,
                "due_date": None,
                "is_urgent": "urgent" in user_input.lower(),
                "is_important": "important" in user_input.lower(),
                "suggested_category": None,
                "suggested_tags": [],
                "confidence": 0.3
            }
        
        except Exception as e:
            raise Exception(f"AI parsing failed: {str(e)}")