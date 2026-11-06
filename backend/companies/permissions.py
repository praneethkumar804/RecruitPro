
from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import EmployerProfile


class IsEmployerAndCompanyOwner(BasePermission):

    def has_permission(self, request, view):
        # Allow public read-only access
        if request.method in SAFE_METHODS:
            return True

        # Only authenticated employers can modify companies
        return (
            request.user.is_authenticated
            and request.user.role == "EMPLOYER"
        )

    def has_object_permission(self, request, view, obj):
        # Allow public read-only access
        if request.method in SAFE_METHODS:
            return True

        # Check whether the employer owns this company
        return EmployerProfile.objects.filter(
            user=request.user,
            company=obj
        ).exists()
