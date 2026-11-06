from io import BytesIO

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APIClient

from .models import Connection, Follow, Post

User = get_user_model()


def create_user(email, role="CANDIDATE"):
    return User.objects.create_user(
        email=email,
        username=email.split("@")[0],
        password="StrongPass!234",
        role=role,
    )


def make_test_image():
    buffer = BytesIO()
    Image.new("RGB", (4, 4), color="green").save(buffer, format="PNG")
    return SimpleUploadedFile(
        "work-sample.png",
        buffer.getvalue(),
        content_type="image/png",
    )


@pytest.mark.django_db
def test_network_feed_requires_authentication():
    response = APIClient().get("/api/network/posts/")

    assert response.status_code == 401


@pytest.mark.django_db
def test_member_can_follow_and_connect_to_another_member():
    candidate = create_user("candidate@example.com")
    employer = create_user("employer@example.com", role="EMPLOYER")
    client = APIClient()
    client.force_authenticate(user=candidate)

    follow_response = client.post(f"/api/network/follows/{employer.id}/")
    connect_response = client.post(f"/api/network/connections/{employer.id}/")

    assert follow_response.status_code == 200
    assert connect_response.status_code == 200
    assert Follow.objects.filter(follower=candidate, followed=employer).exists()
    assert Connection.objects.filter(
        user_id=min(candidate.id, employer.id),
        connected_user_id=max(candidate.id, employer.id),
    ).exists()

    employer_client = APIClient()
    employer_client.force_authenticate(user=employer)
    connections_response = employer_client.get("/api/network/connections/")

    assert connections_response.status_code == 200
    assert connections_response.data["results"][0]["id"] == candidate.id
    assert connections_response.data["results"][0]["is_connected"] is True


@pytest.mark.django_db
def test_signed_in_members_can_view_and_author_can_delete_photo_post(tmp_path):
    author = create_user("author@example.com")
    viewer = create_user("viewer@example.com", role="EMPLOYER")
    author_client = APIClient()
    author_client.force_authenticate(user=author)

    with override_settings(MEDIA_ROOT=tmp_path):
        create_response = author_client.post(
            "/api/network/posts/",
            {"content": "Sharing a work sample.", "image": make_test_image()},
            format="multipart",
        )
        assert create_response.status_code == 201
        assert create_response.data["author"]["id"] == author.id
        assert create_response.data["image_url"].endswith(
            f"/api/network/posts/{create_response.data['id']}/image/"
        )

        viewer_client = APIClient()
        viewer_client.force_authenticate(user=viewer)
        feed_response = viewer_client.get("/api/network/posts/")
        assert feed_response.status_code == 200
        assert feed_response.data["results"][0]["content"] == "Sharing a work sample."
        image_response = viewer_client.get(
            f"/api/network/posts/{create_response.data['id']}/image/"
        )
        assert image_response.status_code == 200
        assert image_response["Content-Type"] == "image/png"
        image_response.close()

        anonymous_image_response = APIClient().get(
            f"/api/network/posts/{create_response.data['id']}/image/"
        )
        assert anonymous_image_response.status_code == 401

        delete_response = author_client.delete(
            f"/api/network/posts/{create_response.data['id']}/"
        )

    assert delete_response.status_code == 204
    assert not Post.objects.filter(id=create_response.data["id"]).exists()


@pytest.mark.django_db
def test_member_cannot_delete_another_members_post():
    author = create_user("post-author@example.com")
    other_user = create_user("other-user@example.com", role="EMPLOYER")
    post = Post.objects.create(author=author, content="A work update.")
    client = APIClient()
    client.force_authenticate(user=other_user)

    response = client.delete(f"/api/network/posts/{post.id}/")

    assert response.status_code == 403
    assert Post.objects.filter(id=post.id).exists()


@pytest.mark.django_db
def test_empty_post_is_rejected():
    author = create_user("empty-post@example.com")
    client = APIClient()
    client.force_authenticate(user=author)

    response = client.post("/api/network/posts/", {"content": ""}, format="json")

    assert response.status_code == 400
    assert "Add some text" in str(response.data)
