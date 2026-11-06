from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ConnectionView,
    ConnectionsListView,
    FollowingListView,
    FollowView,
    PeopleListView,
    PostImageView,
    PostViewSet,
)

router = DefaultRouter()
router.register("posts", PostViewSet, basename="network-post")

urlpatterns = [
    path("people/", PeopleListView.as_view(), name="network-people"),
    path("following/", FollowingListView.as_view(), name="network-following"),
    path("connections/", ConnectionsListView.as_view(), name="network-connections"),
    path("follows/<int:user_id>/", FollowView.as_view(), name="network-follow"),
    path("connections/<int:user_id>/", ConnectionView.as_view(), name="network-connect"),
    path("posts/<int:post_id>/image/", PostImageView.as_view(), name="network-post-image"),
    path("", include(router.urls)),
]
