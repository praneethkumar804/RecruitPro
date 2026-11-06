import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from companies.models import Company, EmployerProfile
from jobs.models import Job
User = get_user_model()

@pytest.mark.django_db
def test_public_user_sees_published_jobs_only():
    employer = User.objects.create_user(email="employer@test.com", username="employer", password="Pass12345!", role="EMPLOYER")
    company = Company.objects.create(name="Example Ltd", location="Madurai")
    EmployerProfile.objects.create(user=employer, company=company)
    Job.objects.create(company=company, created_by=employer, title="Python Dev", description="Django APIs",
                       location="Madurai", status="PUBLISHED")
    Job.objects.create(company=company, created_by=employer, title="Secret Draft", description="Draft",
                       location="Madurai", status="DRAFT")
    response = APIClient().get("/api/jobs/")
    assert response.status_code == 200
    assert response.data["count"] == 1


@pytest.mark.django_db
def test_employer_can_edit_and_delete_own_job():
    employer = User.objects.create_user(
        email="owner@test.com",
        username="owner",
        password="StrongPass!234",
        role="EMPLOYER",
    )
    company = Company.objects.create(name="Owner Co", location="Hyderabad")
    EmployerProfile.objects.create(user=employer, company=company)
    job = Job.objects.create(
        company=company,
        created_by=employer,
        title="Original title",
        description="Original description",
        location="Hyderabad",
        status="PUBLISHED",
    )
    client = APIClient()
    client.force_authenticate(user=employer)

    update_response = client.patch(
        f"/api/jobs/{job.id}/",
        {"title": "Updated title"},
        format="json",
    )

    assert update_response.status_code == 200
    assert update_response.data["title"] == "Updated title"

    delete_response = client.delete(f"/api/jobs/{job.id}/")

    assert delete_response.status_code == 204
    assert not Job.objects.filter(id=job.id).exists()
