
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


# RecruitPro API homepage
def home(request):
    return JsonResponse({
        "message": "Welcome to RecruitPro API",
        "status": "Running",
        "documentation": "/api/docs/",
        "admin": "/admin/",
    })


def api_home(request):
    return JsonResponse({
        "message": "RecruitPro API",
        "status": "Running",
        "jobs": "/api/jobs/",
        "companies": "/api/companies/",
        "register": "/api/auth/register/",
        "token": "/api/auth/token/",
        "documentation": "/api/docs/",
    })


urlpatterns = [
    # Homepage
    path("", home, name="home"),

    # Django Admin
    path("admin/", admin.site.urls),

    # API index
    path("api/", api_home, name="api-root"),

    # Authentication APIs
    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/auth/", include("accounts.urls")),

    # Company APIs
    path("api/companies/", include("companies.urls")),

    # Job APIs
    path("api/jobs/", include("jobs.urls")),

    # Application APIs
    path("api/", include("applications.urls")),

    # Professional network APIs
    path("api/network/", include("networking.urls")),

    # API documentation
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
