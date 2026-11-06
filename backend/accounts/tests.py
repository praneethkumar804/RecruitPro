import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from companies.models import Company, EmployerProfile
User = get_user_model()

@pytest.mark.django_db
def test_candidate_can_register():
    client = APIClient()
    response = client.post("/api/auth/register/", {
        "email": "test@example.com", "username": "testuser",
        "password": "VeryStrongPass!123", "role": "CANDIDATE"
    }, format="json")
    assert response.status_code == 201
    assert User.objects.filter(email="test@example.com").exists()

@pytest.mark.django_db
def test_admin_cannot_self_register():
    response = APIClient().post("/api/auth/register/", {
        "email": "admin@example.com", "username": "badadmin",
        "password": "VeryStrongPass!123", "role": "ADMIN"
    }, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_me_returns_employer_company_id():
    employer = User.objects.create_user(
        email="employer@example.com",
        username="employer",
        password="StrongPass!234",
        role="EMPLOYER",
    )
    company = Company.objects.create(name="Employer Test Co", location="Hyderabad")
    EmployerProfile.objects.create(user=employer, company=company)
    client = APIClient()
    client.force_authenticate(user=employer)

    response = client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.data["company_id"] == company.id


@pytest.mark.django_db
def test_me_returns_null_company_for_employer_without_profile():
    employer = User.objects.create_user(
        email="new-employer@example.com",
        username="new-employer",
        password="StrongPass!234",
        role="EMPLOYER",
    )
    client = APIClient()
    client.force_authenticate(user=employer)

    response = client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.data["company_id"] is None
