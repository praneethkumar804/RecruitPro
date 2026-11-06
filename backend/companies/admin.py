
from django.contrib import admin
from .models import Company, EmployerProfile


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location", "website", "created_at")
    search_fields = ("name", "location")
    list_filter = ("location",)
    ordering = ("name",)


@admin.register(EmployerProfile)
class EmployerProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "company", "designation")
    search_fields = ("user__email", "company__name", "designation")
    list_filter = ("company",)
