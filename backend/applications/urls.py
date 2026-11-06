from django.urls import path
from .views import ResumeCreateView, ApplicationListCreateView, EmployerApplicationsView, ApplicationStatusView
urlpatterns = [
    path("resumes/", ResumeCreateView.as_view()),
    path("applications/", ApplicationListCreateView.as_view()),
    path("applications/employer/", EmployerApplicationsView.as_view()),
    path("applications/<int:pk>/status/", ApplicationStatusView.as_view()),
]
