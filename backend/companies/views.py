
from django.db import transaction
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from .models import Company, EmployerProfile
from .serializers import CompanySerializer
from .permissions import IsEmployerAndCompanyOwner


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by("name")
    serializer_class = CompanySerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]

        return [IsEmployerAndCompanyOwner()]

    def perform_create(self, serializer):
        user = self.request.user

        if EmployerProfile.objects.filter(user=user).exists():
            raise ValidationError(
                "You already have an employer profile and company."
            )

        with transaction.atomic():
            company = serializer.save()
            EmployerProfile.objects.create(
                user=user,
                company=company,
            )
