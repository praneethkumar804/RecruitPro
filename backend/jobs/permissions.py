
from rest_framework import permissions


class JobPermission(permissions.BasePermission):

    def has_permission(self, request, view):

        # Anyone can view the job listing and details.
        # The queryset determines which jobs they can see.
        if view.action in ["list", "retrieve"]:
            return True

        # Only authenticated employers can create,
        # update, partially update or delete jobs.
        return (
            request.user.is_authenticated
            and request.user.role == "EMPLOYER"
        )

    def has_object_permission(self, request, view, obj):

        # Public users and candidates can view published jobs.
        if view.action in ["list", "retrieve"]:
            return (
                obj.status == "PUBLISHED"
                or (
                    request.user.is_authenticated
                    and request.user.role == "EMPLOYER"
                    and obj.created_by_id == request.user.id
                )
            )

        # Employers can modify only jobs they created.
        return (
            request.user.is_authenticated
            and request.user.role == "EMPLOYER"
            and obj.created_by_id == request.user.id
        )
