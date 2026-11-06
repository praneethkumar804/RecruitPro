import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APIClient
from companies.models import Company
from jobs.models import Job
from applications.models import Application, Resume

User = get_user_model()


@pytest.mark.django_db
def test_candidate_can_upload_resume(tmp_path):
    candidate = User.objects.create_user(
        email="candidate@example.com",
        username="candidate",
        password="StrongPass!234",
        role="CANDIDATE",
    )
    client = APIClient()
    client.force_authenticate(user=candidate)
    resume = SimpleUploadedFile(
        "candidate-resume.pdf",
        b"%PDF-1.4 test resume",
        content_type="application/pdf",
    )

    with override_settings(MEDIA_ROOT=tmp_path):
        response = client.post("/api/resumes/", {"file": resume}, format="multipart")

    assert response.status_code == 201
    assert response.data["original_name"] == "candidate-resume.pdf"


@pytest.mark.django_db
def test_employer_applications_include_candidate_resume_url(tmp_path):
    employer = User.objects.create_user(
        email="employer@example.com",
        username="employer",
        password="StrongPass!234",
        role="EMPLOYER",
    )
    candidate = User.objects.create_user(
        email="applicant@example.com",
        username="applicant",
        password="StrongPass!234",
        role="CANDIDATE",
    )
    company = Company.objects.create(name="Example Co", location="Hyderabad")
    job = Job.objects.create(
        company=company,
        created_by=employer,
        title="Engineer",
        description="Build products",
        location="Hyderabad",
        status="PUBLISHED",
    )

    with override_settings(MEDIA_ROOT=tmp_path):
        uploaded_file = SimpleUploadedFile(
            "applicant-resume.pdf",
            b"%PDF-1.4 test resume",
            content_type="application/pdf",
        )
        resume = Resume.objects.create(
            candidate=candidate,
            file=uploaded_file,
            original_name="applicant-resume.pdf",
        )
        Application.objects.create(job=job, candidate=candidate, resume=resume)
        client = APIClient()
        client.force_authenticate(user=employer)

        response = client.get("/api/applications/employer/")

    assert response.status_code == 200
    application = response.data["results"][0]
    assert application["candidate_email"] == "applicant@example.com"
    assert application["resume_file"].endswith("applicant-resume.pdf")
