from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Application, Resume
from .serializers import ApplicationSerializer, ResumeSerializer
from .permissions import IsCandidate
from jobs.models import Job

class ResumeCreateView(generics.ListCreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsCandidate]
    def get_queryset(self): return Resume.objects.filter(candidate=self.request.user)
    def perform_create(self, serializer): serializer.save(candidate=self.request.user)

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsCandidate]
    def get_queryset(self): return Application.objects.filter(candidate=self.request.user).select_related("job", "resume")
    def perform_create(self, serializer): serializer.save(candidate=self.request.user)

class EmployerApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    def get_queryset(self):
        if not self.request.user.is_authenticated or self.request.user.role != "EMPLOYER":
            return Application.objects.none()
        return Application.objects.filter(job__created_by=self.request.user).select_related("job", "candidate", "resume")

class ApplicationStatusView(APIView):
    def patch(self, request, pk):
        application = get_object_or_404(Application.objects.select_related("job"), pk=pk)
        if not request.user.is_authenticated or request.user != application.job.created_by:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get("status")
        allowed = [choice[0] for choice in Application.Status.choices]
        if new_status not in allowed:
            return Response({"status": ["Invalid status."]}, status=status.HTTP_400_BAD_REQUEST)
        application.status = new_status
        application.save(update_fields=["status"])
        return Response(ApplicationSerializer(application, context={"request": request}).data)
