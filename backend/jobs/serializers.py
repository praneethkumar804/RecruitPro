
from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):

    company_name = serializers.CharField(
        source="company.name",
        read_only=True
    )

    class Meta:
        model = Job

        fields = [
            "id",
            "company",
            "company_name",
            "created_by",
            "title",
            "description",
            "location",
            "employment_type",
            "experience_min",
            "experience_max",
            "salary_min",
            "salary_max",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        # Validate salary range
        salary_min = attrs.get(
            "salary_min",
            getattr(self.instance, "salary_min", None)
        )

        salary_max = attrs.get(
            "salary_max",
            getattr(self.instance, "salary_max", None)
        )

        if (
            salary_min is not None
            and salary_max is not None
            and salary_min > salary_max
        ):
            raise serializers.ValidationError({
                "salary_max": "Maximum salary cannot be less than minimum salary."
            })

        # Validate experience range
        experience_min = attrs.get(
            "experience_min",
            getattr(self.instance, "experience_min", 0)
        )

        experience_max = attrs.get(
            "experience_max",
            getattr(self.instance, "experience_max", None)
        )

        if (
            experience_max is not None
            and experience_min > experience_max
        ):
            raise serializers.ValidationError({
                "experience_max": "Maximum experience cannot be less than minimum experience."
            })

        return attrs
