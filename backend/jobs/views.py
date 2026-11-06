
from django.db.models import Q

from rest_framework import viewsets, filters
from rest_framework.exceptions import ValidationError, PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import Job
from .serializers import JobSerializer
from .permissions import JobPermission
from companies.models import EmployerProfile


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [JobPermission]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "location",
        "employment_type",
        "company",
    ]

    search_fields = [
        "title",
        "description",
        "location",
        "company__name",
    ]

    ordering_fields = [
        "created_at",
        "salary_min",
        "title",
    ]

    def get_queryset(self):
        user = self.request.user

        qs = Job.objects.select_related(
            "company",
            "created_by"
        )

        # Public job listing and employer job listing
        if self.action in ["list", "retrieve"]:

            if user.is_authenticated and user.role == "EMPLOYER":
                return qs.filter(
                    Q(created_by=user) |
                    Q(status=Job.Status.PUBLISHED)
                ).distinct()

            return qs.filter(
                status=Job.Status.PUBLISHED
            )

        # Employers can modify only their own jobs
        if user.is_authenticated and user.role == "EMPLOYER":
            return qs.filter(created_by=user)

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user

        try:
            profile = EmployerProfile.objects.get(user=user)
        except EmployerProfile.DoesNotExist:
            raise ValidationError(
                "Create an employer profile before posting a job."
            )

        company = serializer.validated_data.get("company")

        if not company or profile.company_id != company.id:
            raise PermissionDenied(
                "You can only post jobs for your own company."
            )

        serializer.save(created_by=user)
