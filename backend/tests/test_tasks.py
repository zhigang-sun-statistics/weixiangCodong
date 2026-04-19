"""Tests for Task CRUD, filtering, sorting, pagination, and search."""


class TestCreateTask:
    def test_create_task_success(self, client):
        resp = client.post("/api/tasks", json={"title": "Buy groceries"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Buy groceries"
        assert data["status"] == "pending"
        assert data["priority"] == "medium"
        assert data["id"] is not None
        assert data["created_at"] is not None

    def test_create_task_with_all_fields(self, client):
        resp = client.post("/api/tasks", json={
            "title": "Complete report",
            "description": "Q4 report with data analysis",
            "status": "in_progress",
            "priority": "high",
            "tags": ["work", "urgent"],
            "due_date": "2026-04-25T18:00:00",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Complete report"
        assert data["description"] == "Q4 report with data analysis"
        assert data["status"] == "in_progress"
        assert data["priority"] == "high"
        assert data["tags"] == ["work", "urgent"]

    def test_create_task_empty_title(self, client):
        resp = client.post("/api/tasks", json={"title": ""})
        assert resp.status_code == 422

    def test_create_task_title_too_long(self, client):
        resp = client.post("/api/tasks", json={"title": "a" * 300})
        assert resp.status_code == 422

    def test_create_task_invalid_status(self, client):
        resp = client.post("/api/tasks", json={"title": "test", "status": "invalid"})
        assert resp.status_code == 422

    def test_create_task_invalid_priority(self, client):
        resp = client.post("/api/tasks", json={"title": "test", "priority": "critical"})
        assert resp.status_code == 422


class TestGetTask:
    def test_get_task(self, client, sample_task):
        resp = client.get(f"/api/tasks/{sample_task['id']}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Test Task"

    def test_get_task_not_found(self, client):
        resp = client.get("/api/tasks/9999")
        assert resp.status_code == 404


class TestListTasks:
    def test_list_empty(self, client):
        resp = client.get("/api/tasks")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_list_with_pagination(self, client, multiple_tasks):
        resp = client.get("/api/tasks?page=1&page_size=5")
        data = resp.json()
        assert len(data["items"]) == 5
        assert data["total"] == 15
        assert data["total_pages"] == 3
        assert data["page"] == 1

    def test_list_second_page(self, client, multiple_tasks):
        resp = client.get("/api/tasks?page=2&page_size=10")
        data = resp.json()
        assert len(data["items"]) == 5
        assert data["page"] == 2


class TestFilterSort:
    def test_filter_by_status(self, client, multiple_tasks):
        resp = client.get("/api/tasks?status=pending")
        items = resp.json()["items"]
        assert all(t["status"] == "pending" for t in items)

    def test_filter_by_priority(self, client, multiple_tasks):
        resp = client.get("/api/tasks?priority=high")
        items = resp.json()["items"]
        assert all(t["priority"] == "high" for t in items)

    def test_filter_by_tag(self, client, multiple_tasks):
        resp = client.get("/api/tasks?tags=work")
        items = resp.json()["items"]
        assert all("work" in t["tags"] for t in items)

    def test_combined_filters(self, client, multiple_tasks):
        resp = client.get("/api/tasks?status=pending&priority=high")
        items = resp.json()["items"]
        assert all(t["status"] == "pending" and t["priority"] == "high" for t in items)

    def test_sort_by_created_at_desc(self, client, multiple_tasks):
        resp = client.get("/api/tasks?sort_by=created_at&sort_order=desc&page_size=15")
        items = resp.json()["items"]
        # Last created should be first when sorted desc
        assert items[0]["title"].startswith("Task")

    def test_sort_by_created_at_asc(self, client, multiple_tasks):
        resp = client.get("/api/tasks?sort_by=created_at&sort_order=asc&page_size=15")
        items = resp.json()["items"]
        assert items[0]["title"] == "Task 0"

    def test_search(self, client, multiple_tasks):
        client.post("/api/tasks", json={"title": "Quarterly Report"})
        resp = client.get("/api/tasks?search=Report")
        items = resp.json()["items"]
        assert any("Report" in t["title"] for t in items)


class TestUpdateTask:
    def test_update_title_and_priority(self, client, sample_task):
        resp = client.put(f"/api/tasks/{sample_task['id']}", json={
            "title": "Updated Title",
            "priority": "low",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Updated Title"
        assert data["priority"] == "low"

    def test_update_not_found(self, client):
        resp = client.put("/api/tasks/9999", json={"title": "test"})
        assert resp.status_code == 404


class TestDeleteTask:
    def test_delete_task(self, client, sample_task):
        resp = client.delete(f"/api/tasks/{sample_task['id']}")
        assert resp.status_code == 204
        resp = client.get(f"/api/tasks/{sample_task['id']}")
        assert resp.status_code == 404

    def test_delete_not_found(self, client):
        resp = client.delete("/api/tasks/9999")
        assert resp.status_code == 404


class TestStatusUpdate:
    def test_update_status(self, client, sample_task):
        resp = client.patch(f"/api/tasks/{sample_task['id']}/status", json={"status": "in_progress"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "in_progress"
