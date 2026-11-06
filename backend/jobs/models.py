
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from companies.models import Company


class Job(models.Model):

    class EmploymentType(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full time"
        PART_TIME = "PART_TIME", "Part time"
        CONTRACT = "CONTRACT", "Contract"
        INTERN = "INTERN", "Internship"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        CLOSED = "CLOSED", "Closed"

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="jobs"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_jobs"
    )

    title = models.CharField(max_length=180, db_index=True)
    description = models.TextField()
    location = models.CharField(max_length=160, db_index=True)

    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME
    )

    experience_min = models.PositiveSmallIntegerField(default=0)
    experience_max = models.PositiveSmallIntegerField(null=True, blank=True)

    salary_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )

    salary_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["status", "location", "created_at"]),
        ]

        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(experience_max__isnull=True) |
                    Q(experience_max__gte=models.F("experience_min"))
                ),
                name="valid_job_experience_range"
            ),
            models.CheckConstraint(
                condition=(
                    Q(salary_min__isnull=True) |
                    Q(salary_max__isnull=True) |
                    Q(salary_max__gte=models.F("salary_min"))
                ),
                name="valid_job_salary_range"
            ),
        ]

    def __str__(self):
        return self.title
