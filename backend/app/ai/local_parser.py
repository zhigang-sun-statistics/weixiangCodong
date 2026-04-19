"""Local rule-based parser for Chinese natural language task descriptions.

Uses jieba word segmentation + regex for date/time extraction + keyword matching
for priority and tags. Returns a confidence score; caller decides whether to use
this result or fall back to a full LLM.
"""
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

import jieba


@dataclass
class LocalParseResult:
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[list[str]] = None
    due_date: Optional[str] = None
    confidence: float = 0.0
    method: str = "local"


# ── Priority keywords ──────────────────────────────────────────────
_PRIORITY_KEYWORDS: dict[str, list[str]] = {
    "high": ["紧急", "急", "重要", "尽快", "立刻", "马上", "asap", "urgent", "critical", "赶紧", "火速"],
    "medium": ["一般", "正常", "注意", "适当"],
    "low": ["不急", "有空", "随意", "闲时", "慢慢", "不忙", "when free"],
}

# ── Tag keyword → tag name mapping ─────────────────────────────────
_TAG_KEYWORDS: dict[str, str] = {
    "买": "购物", "购物": "购物", "下单": "购物", "采购": "购物",
    "开会": "会议", "会议": "会议", "讨论": "会议", "评审": "会议", "同步": "会议",
    "写": "文档", "文档": "文档", "报告": "文档", "总结": "文档", "方案": "文档",
    "修": "开发", "bug": "开发", "Bug": "开发", "修复": "开发", "开发": "开发", "部署": "开发", "上线": "开发",
    "学习": "学习", "看书": "学习", "复习": "学习", "练习": "学习", "研究": "学习",
    "运动": "健康", "健身": "健康", "跑步": "健康", "体检": "健康", "看病": "健康",
    "电话": "沟通", "邮件": "沟通", "回复": "沟通", "联系": "沟通",
}

# ── Date/time regex patterns ───────────────────────────────────────
# Relative day patterns
_RELATIVE_DAYS: dict[str, int] = {
    "今天": 0, "今日": 0,
    "明天": 1, "明日": 1,
    "后天": 2,
    "大后天": 3,
}

_WEEKDAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"]

# Combined regex for date extraction
_DATE_PATTERN = re.compile(
    r"(?P<relative>今天|今日|明天|明日|后天|大后天)"
    r"|(?P<week>下|这)周(?P<weekday>[一二三四五六日])"
    r"|(?P<month>\d{1,2})[月/](?P<day>\d{1,2})[日号]?"
)

_TIME_PATTERN = re.compile(
    r"(?P<ampm>上午|下午|晚上|晚上|凌晨|早上|傍晚)?"
    r"(?P<hour>\d{1,2})[点时:：]"
    r"(?P<half>半)?"
    r"(?P<minute>\d{1,2})?分?"
)


def _extract_datetime(text: str) -> tuple[Optional[str], str]:
    """Extract due_date ISO string and return cleaned text."""
    now = datetime.now()
    target_date: Optional[datetime] = None
    matched_text = ""

    # Try relative day
    for word, delta in _RELATIVE_DAYS.items():
        if word in text:
            target_date = now + timedelta(days=delta)
            matched_text = word
            break

    # Try week-based
    if target_date is None:
        week_match = re.search(r"(?P<prefix>下|这)周(?P<wd>[一二三四五六日])", text)
        if week_match:
            prefix = week_match.group("prefix")
            wd_char = week_match.group("wd")
            wd_idx = _WEEKDAY_NAMES.index(wd_char)  # Monday=0
            target_weekday = wd_idx  # Monday=0 for our mapping
            current_weekday = now.weekday()
            if prefix == "下":
                days_ahead = (target_weekday - current_weekday) % 7
                if days_ahead == 0:
                    days_ahead = 7
            else:
                days_ahead = (target_weekday - current_weekday) % 7
                if days_ahead < 0:
                    days_ahead += 7
            target_date = now + timedelta(days=days_ahead)
            matched_text = week_match.group(0)

    # Try absolute date
    if target_date is None:
        abs_match = re.search(r"(?P<m>\d{1,2})[月/](?P<d>\d{1,2})[日号]?", text)
        if abs_match:
            month = int(abs_match.group("m"))
            day = int(abs_match.group("d"))
            try:
                target_date = datetime(now.year, month, day)
                if target_date < now:
                    target_date = datetime(now.year + 1, month, day)
            except ValueError:
                target_date = None
            else:
                matched_text = abs_match.group(0)

    if target_date is None:
        return None, text

    # Try to extract time
    time_match = _TIME_PATTERN.search(text)
    if time_match:
        hour = int(time_match.group("hour"))
        ampm = time_match.group("ampm")
        half = time_match.group("half")
        minute_str = time_match.group("minute")

        # Adjust hour for PM
        if ampm in ("下午", "晚上", "傍晚") and hour < 12:
            hour += 12
        elif ampm == "凌晨" and hour == 12:
            hour = 0

        minute = 0
        if half:
            minute = 30
        elif minute_str:
            minute = int(minute_str)

        target_date = target_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        matched_text += time_match.group(0)

    # Remove matched date/time text to get clean title
    clean_text = text
    for segment in [matched_text]:
        clean_text = clean_text.replace(segment, "", 1)

    return target_date.isoformat(), clean_text.strip()


def _extract_priority(text: str) -> tuple[Optional[str], str]:
    """Extract priority from keywords. Return (priority, cleaned_text)."""
    for level, keywords in _PRIORITY_KEYWORDS.items():
        for kw in keywords:
            if kw in text.lower():
                return level, text
    return None, text


def _extract_tags(text: str) -> tuple[list[str], str]:
    """Extract tags based on keyword matching. Return (tags, cleaned_text)."""
    tags = []
    for keyword, tag in _TAG_KEYWORDS.items():
        if keyword in text and tag not in tags:
            tags.append(tag)
    return tags, text


def _clean_title(text: str) -> str:
    """Remove date fragments, priority keywords, and common particles to isolate the title."""
    # Remove common particles and fragments
    cleanup = [
        r"提醒我", r"帮我", r"请", r"记得", r"别忘了", r"注意",
        r"的", r"了", r"一下", r"要", r"去", r"准备",
    ]
    result = text
    for pattern in cleanup:
        result = re.sub(pattern, "", result)
    # Remove leftover spaces and punctuation
    result = re.sub(r"^\s+|\s+$", "", result)
    result = re.sub(r"\s{2,}", " ", result)
    return result


def parse_with_local(text: str) -> LocalParseResult:
    """Parse Chinese natural language into structured task fields using rules.

    Returns a LocalParseResult with confidence score. The caller should check
    confidence >= threshold (default 0.6) before using the result.
    """
    if not text or not text.strip():
        return LocalParseResult(title="", confidence=0.0)

    text = text.strip()
    confidence = 0.0

    # Step 1: Extract date/time
    due_date, remaining = _extract_datetime(text)
    if due_date:
        confidence += 0.25

    # Step 2: Extract priority
    priority, remaining = _extract_priority(remaining)
    if priority:
        confidence += 0.15

    # Step 3: Extract tags
    tags, remaining = _extract_tags(remaining)
    if tags:
        confidence += 0.1

    # Step 4: Extract title from remaining text
    title = _clean_title(remaining)
    if title:
        # Use jieba to further clean — remove single-character particles
        words = list(jieba.cut(title))
        # Filter out common function words
        stop_words = {"的", "了", "在", "是", "我", "你", "他", "她", "它", "们", "这", "那", "就", "也", "都", "要", "会", "能", "和", "与", "把", "被", "从", "到", "给", "让", "向", "对"}
        filtered = [w for w in words if w.strip() and w not in stop_words]
        if filtered:
            title = "".join(filtered)
        confidence += 0.2
    else:
        # Fallback: use original text segments
        words = list(jieba.cut(text))
        filtered = [w for w in words if w.strip() and w not in stop_words]
        title = "".join(filtered) if filtered else text

    # Base confidence for having meaningful input
    confidence += 0.3

    # Clamp
    confidence = min(1.0, max(0.0, confidence))

    return LocalParseResult(
        title=title or text,
        description=None,
        priority=priority,
        tags=tags if tags else None,
        due_date=due_date,
        confidence=round(confidence, 2),
    )
