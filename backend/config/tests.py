import pytest


@pytest.mark.django_db
def test_api_root_lists_available_endpoints(client):
    response = client.get("/api/")

    assert response.status_code == 200
    assert response.json()["status"] == "Running"
    assert response.json()["jobs"] == "/api/jobs/"
    assert response.json()["documentation"] == "/api/docs/"
