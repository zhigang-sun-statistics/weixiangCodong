"""Performance benchmark tests — all basic API operations should be < 100ms."""
import time
import pytest


class TestPerformance:
    def _measure(self, func, *args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed_ms = (time.perf_counter() - start) * 1000
        return result, elapsed_ms

    def test_create_task_performance(self, client):
        _, ms = self._measure(
            client.post, "/api/tasks",
            json={"title": "Perf task", "priority": "medium", "tags": ["perf"]},
        )
        assert ms < 100, f"Create took {ms:.1f}ms"
        print(f"\n  CREATE: {ms:.1f}ms")

    def test_get_task_performance(self, client, sample_task):
        _, ms = self._measure(client.get, f"/api/tasks/{sample_task['id']}")
        assert ms < 100, f"Get single took {ms:.1f}ms"
        print(f"\n  GET single: {ms:.1f}ms")

    def test_list_tasks_performance(self, client, multiple_tasks):
        _, ms = self._measure(client.get, "/api/tasks?page_size=50")
        assert ms < 100, f"List took {ms:.1f}ms"
        print(f"\n  LIST (15 tasks): {ms:.1f}ms")

    def test_update_task_performance(self, client, sample_task):
        _, ms = self._measure(
            client.put, f"/api/tasks/{sample_task['id']}",
            json={"title": "Updated perf task", "priority": "low"},
        )
        assert ms < 100, f"Update took {ms:.1f}ms"
        print(f"\n  UPDATE: {ms:.1f}ms")

    def test_delete_task_performance(self, client, sample_task):
        _, ms = self._measure(client.delete, f"/api/tasks/{sample_task['id']}")
        assert ms < 100, f"Delete took {ms:.1f}ms"
        print(f"\n  DELETE: {ms:.1f}ms")

    def test_filter_performance(self, client, multiple_tasks):
        _, ms = self._measure(
            client.get, "/api/tasks?status=pending&priority=high&page_size=50"
        )
        assert ms < 100, f"Filter took {ms:.1f}ms"
        print(f"\n  FILTER: {ms:.1f}ms")

    def test_search_performance(self, client, multiple_tasks):
        _, ms = self._measure(client.get, "/api/tasks?search=Task")
        assert ms < 100, f"Search took {ms:.1f}ms"
        print(f"\n  SEARCH: {ms:.1f}ms")

    def test_100_tasks_bulk_create(self, client):
        """Test creating 100 tasks — each should be < 100ms."""
        times = []
        for i in range(100):
            _, ms = self._measure(
                client.post, "/api/tasks",
                json={"title": f"Bulk task {i}", "priority": "medium"},
            )
            times.append(ms)
        avg = sum(times) / len(times)
        max_t = max(times)
        assert avg < 100, f"Avg create time {avg:.1f}ms exceeds 100ms"
        print(f"\n  100 TASKS: avg={avg:.1f}ms, max={max_t:.1f}ms")
