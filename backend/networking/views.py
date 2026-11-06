import mimetypes

from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse

from .models import Connection, Follow, Post
from .permissions import IsAuthorOrReadOnly
from .serializers import NetworkUserSerializer, PostSerializer

User = get_user_model()
NETWORK_ROLES = ("CANDIDATE", "EMPLOYER")


def people_queryset(user):
    is_following = Follow.objects.filter(
        follower=user,
        followed=OuterRef("pk"),
    )
    is_connected = Connection.objects.filter(
        Q(user=OuterRef("pk"), connected_user=user)
        | Q(user=user, connected_user=OuterRef("pk"))
    )
    return User.objects.filter(role__in=NETWORK_ROLES).annotate(
        is_following=Exists(is_following),
        is_connected=Exists(is_connected),
    ).order_by("first_name", "last_name", "id")


class PeopleListView(generics.ListAPIView):
    serializer_class = NetworkUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["email", "first_name", "last_name", "role"]

    def get_queryset(self):
        return people_queryset(self.request.user).exclude(pk=self.request.user.pk)


class FollowingListView(generics.ListAPIView):
    serializer_class = NetworkUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        following_ids = Follow.objects.filter(
            follower=self.request.user
        ).values("followed_id")
        return people_queryset(self.request.user).filter(pk__in=following_ids)


class ConnectionsListView(generics.ListAPIView):
    serializer_class = NetworkUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        connections_from_user = Connection.objects.filter(
            user=user
        ).values("connected_user_id")
        connections_to_user = Connection.objects.filter(
            connected_user=user
        ).values("user_id")
        return people_queryset(user).filter(
            Q(pk__in=connections_from_user) | Q(pk__in=connections_to_user)
        )


class FollowView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        target = get_object_or_404(
            User,
            pk=user_id,
            role__in=NETWORK_ROLES,
        )
        if target.pk == request.user.pk:
            raise ValidationError("You cannot follow yourself.")
        Follow.objects.get_or_create(follower=request.user, followed=target)
        return Response({"following": True}, status=status.HTTP_200_OK)

    def delete(self, request, user_id):
        Follow.objects.filter(
            follower=request.user,
            followed_id=user_id,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        target = get_object_or_404(
            User,
            pk=user_id,
            role__in=NETWORK_ROLES,
        )
        if target.pk == request.user.pk:
            raise ValidationError("You cannot connect with yourself.")
        first_id, second_id = sorted((request.user.pk, target.pk))
        Connection.objects.get_or_create(user_id=first_id, connected_user_id=second_id)
        return Response({"connected": True}, status=status.HTTP_200_OK)

    def delete(self, request, user_id):
        if user_id == request.user.pk:
            raise ValidationError("You cannot disconnect yourself.")
        first_id, second_id = sorted((request.user.pk, user_id))
        Connection.objects.filter(
            user_id=first_id,
            connected_user_id=second_id,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostImageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        post = get_object_or_404(
            Post.objects.filter(author__role__in=NETWORK_ROLES),
            pk=post_id,
        )
        if not post.image:
            return Response(status=status.HTTP_404_NOT_FOUND)
        content_type = mimetypes.guess_type(post.image.name)[0] or "application/octet-stream"
        return FileResponse(post.image.open("rb"), content_type=content_type)


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthorOrReadOnly]

    def get_queryset(self):
        return Post.objects.select_related("author").filter(
            author__role__in=NETWORK_ROLES
        )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
