"""Tests for task dependencies: add, remove, cycle detection, completion enforcement, tree."""


def _create_tasks(client, n):
    tasks = []
    for i in range(n):
        resp = client.post("/api/tasks", json={"title": f"Task {i}"})
        tasks.append(resp.json())
    return tasks


class TestAddDependency:
    def test_add_dependency(self, client):
        tasks = _create_tasks(client, 2)
        resp = client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                           json={"depends_on_id": tasks[1]['id']})
        assert resp.status_code == 201
        data = resp.json()
        assert data["task_id"] == tasks[0]["id"]
        assert data["depends_on_id"] == tasks[1]["id"]

    def test_self_dependency(self, client):
        task = client.post("/api/tasks", json={"title": "Self"}).json()
        resp = client.post(f"/api/tasks/{task['id']}/dependencies",
                           json={"depends_on_id": task['id']})
        assert resp.status_code == 400

    def test_duplicate_dependency(self, client):
        tasks = _create_tasks(client, 2)
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        resp = client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                           json={"depends_on_id": tasks[1]['id']})
        assert resp.status_code == 400

    def test_dependency_not_found(self, client):
        task = client.post("/api/tasks", json={"title": "A"}).json()
        resp = client.post(f"/api/tasks/{task['id']}/dependencies",
                           json={"depends_on_id": 9999})
        assert resp.status_code == 404


class TestCycleDetection:
    def test_direct_cycle(self, client):
        tasks = _create_tasks(client, 2)
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        resp = client.post(f"/api/tasks/{tasks[1]['id']}/dependencies",
                           json={"depends_on_id": tasks[0]['id']})
        assert resp.status_code == 400

    def test_indirect_cycle(self, client):
        tasks = _create_tasks(client, 3)
        # A -> B
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        # B -> C
        client.post(f"/api/tasks/{tasks[1]['id']}/dependencies",
                    json={"depends_on_id": tasks[2]['id']})
        # C -> A (cycle!)
        resp = client.post(f"/api/tasks/{tasks[2]['id']}/dependencies",
                           json={"depends_on_id": tasks[0]['id']})
        assert resp.status_code == 400


class TestCompletionEnforcement:
    def test_cannot_complete_with_unfinished_deps(self, client):
        tasks = _create_tasks(client, 2)
        # Task 0 depends on Task 1
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        resp = client.patch(f"/api/tasks/{tasks[0]['id']}/status",
                            json={"status": "completed"})
        assert resp.status_code == 400

    def test_can_complete_after_deps_done(self, client):
        tasks = _create_tasks(client, 2)
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        # Complete dependency first
        client.patch(f"/api/tasks/{tasks[1]['id']}/status", json={"status": "completed"})
        # Now can complete
        resp = client.patch(f"/api/tasks/{tasks[0]['id']}/status",
                            json={"status": "completed"})
        assert resp.status_code == 200


class TestDependencyTree:
    def test_dependency_tree(self, client):
        tasks = _create_tasks(client, 3)
        # A -> B, A -> C
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[2]['id']})
        resp = client.get(f"/api/tasks/{tasks[0]['id']}/dependency-tree")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == tasks[0]["id"]
        assert len(data["dependencies"]) == 2


class TestCanComplete:
    def test_can_complete_no_deps(self, client):
        task = client.post("/api/tasks", json={"title": "Free"}).json()
        resp = client.get(f"/api/tasks/{task['id']}/can-complete")
        assert resp.status_code == 200
        assert resp.json()["can_complete"] is True

    def test_cannot_complete_unfinished_deps(self, client):
        tasks = _create_tasks(client, 2)
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        resp = client.get(f"/api/tasks/{tasks[0]['id']}/can-complete")
        assert resp.json()["can_complete"] is False
        assert tasks[1]["id"] in resp.json()["unfinished_dependencies"]


class TestRemoveDependency:
    def test_remove_dependency(self, client):
        tasks = _create_tasks(client, 2)
        client.post(f"/api/tasks/{tasks[0]['id']}/dependencies",
                    json={"depends_on_id": tasks[1]['id']})
        resp = client.delete(f"/api/tasks/{tasks[0]['id']}/dependencies/{tasks[1]['id']}")
        assert resp.status_code == 204

    def test_remove_not_found(self, client):
        task = client.post("/api/tasks", json={"title": "A"}).json()
        resp = client.delete(f"/api/tasks/{task['id']}/dependencies/9999")
        assert resp.status_code == 404
