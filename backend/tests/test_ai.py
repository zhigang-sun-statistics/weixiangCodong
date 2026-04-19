"""Tests for AI settings and AI endpoints (with mocked AI provider)."""

from unittest.mock import AsyncMock, patch, MagicMock


class TestAISettings:
    def test_get_default_settings(self, client):
        resp = client.get("/api/ai/settings")
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider"] == "openai"
        assert data["api_key_set"] is False
        assert data["api_key_preview"] is None

    def test_update_settings(self, client):
        resp = client.put("/api/ai/settings", json={
            "provider": "anthropic",
            "api_key": "sk-test-key-12345678",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider"] == "anthropic"
        assert data["api_key_set"] is True
        assert data["api_key_preview"].endswith("5678")

    def test_update_settings_persists(self, client):
        client.put("/api/ai/settings", json={
            "provider": "openai",
            "api_key": "sk-test-key",
        })
        resp = client.get("/api/ai/settings")
        assert resp.json()["api_key_set"] is True


class TestAIEndpointsMocked:
    def _setup_ai(self, client):
        client.put("/api/ai/settings", json={
            "provider": "openai",
            "api_key": "sk-test-key",
        })

    @patch("app.services.ai_service._call_ai", new_callable=AsyncMock)
    def test_parse_natural_language(self, mock_call, client):
        self._setup_ai(client)
        mock_call.return_value = '{"title": "Buy groceries", "priority": "medium", "tags": ["life", "shopping"], "due_date": null}'
        resp = client.post("/api/ai/parse-task", json={"text": "明天下午3点提醒我买菜"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Buy groceries"
        assert data["tags"] == ["life", "shopping"]

    @patch("app.services.ai_service._call_ai", new_callable=AsyncMock)
    def test_suggest_tags(self, mock_call, client):
        self._setup_ai(client)
        mock_call.return_value = '["work", "report", "quarterly"]'
        resp = client.post("/api/ai/suggest-tags", json={"title": "季度报告"})
        assert resp.status_code == 200
        assert resp.json()["tags"] == ["work", "report", "quarterly"]

    @patch("app.services.ai_service._call_ai", new_callable=AsyncMock)
    def test_recommend_priority(self, mock_call, client):
        self._setup_ai(client)
        mock_call.return_value = '{"priority": "high", "reason": "Contains urgent keywords"}'
        resp = client.post("/api/ai/recommend-priority", json={"title": "紧急修复Bug"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["priority"] == "high"
        assert "urgent" in data["reason"].lower()

    @patch("app.services.ai_service._call_ai", new_callable=AsyncMock)
    def test_breakdown_task(self, mock_call, client):
        self._setup_ai(client)
        mock_call.return_value = '[{"title": "Collect data", "description": "Gather Q4 data"}, {"title": "Write analysis", "description": null}]'
        resp = client.post("/api/ai/breakdown-task", json={"title": "Complete report"})
        assert resp.status_code == 200
        assert len(resp.json()["subtasks"]) == 2

    @patch("app.services.ai_service._call_ai", new_callable=AsyncMock)
    def test_summarize_tasks(self, mock_call, client):
        self._setup_ai(client)
        client.post("/api/tasks", json={"title": "Task A"})
        mock_call.return_value = "You have 1 task pending."
        resp = client.post("/api/ai/summarize-tasks", json={})
        assert resp.status_code == 200
        assert "task" in resp.json()["summary"].lower()

    @patch("app.services.ai_service._call_ai", new_callable=AsyncMock)
    def test_detect_similar(self, mock_call, client):
        client.put("/api/ai/settings", json={"provider": "openai", "api_key": "sk-test"})
        t1 = client.post("/api/tasks", json={"title": "Write report"}).json()
        t2 = client.post("/api/tasks", json={"title": "Draft report"}).json()
        mock_call.return_value = f'[{{"task_id": {t2["id"]}, "title": "Draft report", "similarity_reason": "Both about report writing"}}]'
        resp = client.post("/api/ai/detect-similar", json={"task_id": t1["id"]})
        if resp.status_code != 200:
            assert False, f"Expected 200, got {resp.status_code}: {resp.text}"
        assert len(resp.json()["similar_tasks"]) == 1

    def test_ai_without_key_returns_error(self, client):
        resp = client.post("/api/ai/parse-task", json={"text": "test"})
        assert resp.status_code == 503
