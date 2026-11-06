from rest_framework import serializers
from django.urls import reverse
from pathlib import Path

from .models import Post


class NetworkUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)
    is_following = serializers.BooleanField(read_only=True, required=False)
    is_connected = serializers.BooleanField(read_only=True, required=False)


class PostSerializer(serializers.ModelSerializer):
    author = NetworkUserSerializer(read_only=True)
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "content",
            "image",
            "image_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def get_image_url(self, post):
        if not post.image:
            return None
        url = reverse("network-post-image", kwargs={"post_id": post.pk})
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def validate_image(self, value):
        if value and Path(value.name).suffix.lower() not in {
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
        }:
            raise serializers.ValidationError(
                "Choose a JPG, PNG, GIF, or WebP image."
            )
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Images must be 5 MB or smaller.")
        return value

    def validate(self, attrs):
        content = attrs.get("content", getattr(self.instance, "content", ""))
        image = attrs.get("image", getattr(self.instance, "image", None))
        if not content.strip() and not image:
            raise serializers.ValidationError(
                "Add some text or choose a photo before posting."
            )
        return attrs

    def update(self, instance, validated_data):
        previous_image = instance.image
        updated = super().update(instance, validated_data)
        if previous_image and previous_image.name != updated.image.name:
            previous_image.delete(save=False)
        return updated
