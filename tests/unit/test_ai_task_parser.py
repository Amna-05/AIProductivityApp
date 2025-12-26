"""
Unit tests for AITaskParser service.

Tests AI-powered natural language task parsing with mocked Groq API.
"""

import pytest
from unittest.mock import Mock
from app.services.ai_task_parser import AITaskParser


@pytest.mark.asyncio
async def test_parse_simple_task(mock_groq_client):
    """Test parsing simple task with mocked Groq API."""
    parser = AITaskParser()

    result = await parser.parse(
        user_input="Buy groceries tomorrow",
        available_categories=["Personal", "Work"],
        available_tags=["shopping", "urgent"]
    )

    assert result["title"] == "Test Task"
    assert isinstance(result["is_urgent"], bool)
    assert isinstance(result["is_important"], bool)
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["confidence"] == 0.9


@pytest.mark.asyncio
async def test_parse_with_urgency_keywords(mocker):
    """Test that urgency keywords are detected."""
    mock_groq = mocker.patch('app.services.ai_task_parser.Groq')
    mock_groq.return_value.chat.completions.create.return_value = Mock(
        choices=[
            Mock(
                message=Mock(
                    content='{"title":"Urgent Task","is_urgent":true,"is_important":false,"confidence":0.95}'
                )
            )
        ]
    )

    parser = AITaskParser()
    result = await parser.parse(
        user_input="URGENT: Fix the production bug ASAP",
        available_categories=[],
        available_tags=[]
    )

    assert result["is_urgent"] is True
    assert result["confidence"] == 0.95


@pytest.mark.asyncio
async def test_parse_fallback_on_json_error(mocker):
    """Test fallback parsing when Groq returns invalid JSON."""
    mock_groq = mocker.patch('app.services.ai_task_parser.Groq')
    mock_groq.return_value.chat.completions.create.return_value = Mock(
        choices=[
            Mock(
                message=Mock(
                    content='Invalid JSON {]'
                )
            )
        ]
    )

    parser = AITaskParser()
    result = await parser.parse(
        user_input="important meeting tomorrow",
        available_categories=[],
        available_tags=[]
    )

    # Should fallback to simple parsing
    assert result["title"] == "important meeting tomorrow"
    assert result["is_important"] is True  # Detected from keyword
    assert result["confidence"] == 0.3  # Low confidence for fallback


@pytest.mark.asyncio
async def test_parse_with_api_failure(mocker):
    """Test error handling when Groq API fails."""
    mock_groq = mocker.patch('app.services.ai_task_parser.Groq')
    mock_groq.return_value.chat.completions.create.side_effect = Exception("API Error")

    parser = AITaskParser()

    with pytest.raises(Exception, match="AI parsing failed"):
        await parser.parse(
            user_input="Test task",
            available_categories=[],
            available_tags=[]
        )


@pytest.mark.asyncio
async def test_parse_extracts_all_fields(mocker):
    """Test that all expected fields are extracted."""
    mock_groq = mocker.patch('app.services.ai_task_parser.Groq')
    mock_groq.return_value.chat.completions.create.return_value = Mock(
        choices=[
            Mock(
                message=Mock(
                    content='{"title":"Complete Report","description":"Q4 financial report","due_date":"2025-12-31T00:00:00Z","is_urgent":true,"is_important":true,"suggested_category":"Work","suggested_tags":["finance","report"],"confidence":0.95}'
                )
            )
        ]
    )

    parser = AITaskParser()
    result = await parser.parse(
        user_input="Need to complete Q4 financial report urgently by end of year",
        available_categories=["Work", "Personal"],
        available_tags=["finance", "report", "urgent"]
    )

    assert result["title"] == "Complete Report"
    assert result["description"] == "Q4 financial report"
    assert result["due_date"] == "2025-12-31T00:00:00Z"
    assert result["is_urgent"] is True
    assert result["is_important"] is True
    assert result["suggested_category"] == "Work"
    assert result["suggested_tags"] == ["finance", "report"]
    assert result["confidence"] == 0.95
