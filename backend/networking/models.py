import uuid
from pathlib import Path

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models
from django.db.models import F, Q


class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="network_follows",
    )
    followed = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="network_followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "followed"],
                name="unique_network_follow",
            ),
            models.CheckConstraint(
                condition=~Q(follower_id=F("followed_id")),
                name="network_no_self_follow",
            ),
        ]


class Connection(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="network_connections",
    )
    connected_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="network_connected_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "connected_user"],
                name="unique_network_connection",
            ),
            models.CheckConstraint(
                condition=Q(user_id__lt=F("connected_user_id")),
                name="canonical_network_connection",
            ),
        ]


def post_image_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"network_posts/{instance.author_id}/{uuid.uuid4().hex}{extension}"


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="network_posts",
    )
    content = models.TextField(
        blank=True,
        validators=[MaxLengthValidator(2000)],
    )
    image = models.ImageField(
        upload_to=post_image_path,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)
        return super().delete(*args, **kwargs)
