
from django.conf import settings
from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=180, unique=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=160)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class EmployerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employer_profile"
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="employers"
    )
    designation = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.company.name}"
