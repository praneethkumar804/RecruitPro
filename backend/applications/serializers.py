from rest_framework import serializers
from .models import Application, Resume
class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["id", "file", "original_name", "uploaded_at"]
        read_only_fields = ["id", "original_name", "uploaded_at"]
    def validate_file(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Resume must be 5 MB or smaller.")
        return value
    def create(self, validated_data):
        validated_data["original_name"] = validated_data["file"].name
        return super().create(validated_data)

class ApplicationSerializer(serializers.ModelSerializer):
    candidate_email = serializers.EmailField(source="candidate.email", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    resume_file = serializers.FileField(source="resume.file", read_only=True)
    class Meta:
        model = Application
        fields = ["id", "job", "job_title", "candidate", "candidate_email", "resume", "resume_file", "cover_letter", "status", "applied_at"]
        read_only_fields = ["id", "candidate", "status", "applied_at"]
    def validate(self, attrs):
        request = self.context["request"]
        if attrs["resume"].candidate_id != request.user.id:
            raise serializers.ValidationError({"resume": "You may only use your own resume."})
        if attrs["job"].status != "PUBLISHED":
            raise serializers.ValidationError({"job": "This job is not accepting applications."})
        return attrs
