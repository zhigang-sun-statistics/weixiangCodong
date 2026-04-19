"""Unit tests for the local rule-based parser."""
from datetime import datetime, timedelta
from app.ai.local_parser import parse_with_local


class TestLocalParser:
    def test_parse_relative_date_tomorrow(self):
        result = parse_with_local("明天下午3点提醒我开会")
        assert result.confidence >= 0.6
        assert result.due_date is not None
        assert "会" in result.title or "开" in result.title

    def test_parse_absolute_date(self):
        result = parse_with_local("6月15日提交报告")
        assert result.confidence >= 0.6
        assert result.due_date is not None
        assert "6" in result.due_date.split("-")[1] or "15" in result.due_date

    def test_parse_priority_high(self):
        result = parse_with_local("紧急修复线上Bug")
        assert result.priority == "high"
        assert result.confidence >= 0.6

    def test_parse_tags(self):
        result = parse_with_local("明天去买菜")
        assert result.tags is not None
        assert "购物" in result.tags

    def test_parse_low_confidence_english(self):
        result = parse_with_local("schedule a sync with the design team next sprint")
        assert result.confidence < 0.6

    def test_parse_empty_input(self):
        result = parse_with_local("")
        assert result.confidence == 0.0

    def test_parse_simple_task(self):
        result = parse_with_local("买菜")
        assert result.title  # non-empty
        assert result.method == "local"

    def test_parse_today(self):
        result = parse_with_local("今天下午6点健身")
        assert result.due_date is not None
        assert result.confidence >= 0.6
