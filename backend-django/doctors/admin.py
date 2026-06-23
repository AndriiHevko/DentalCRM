from django.contrib import admin
from .models import Specialty, Doctor, WorkSchedule

@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name', 'description']

class WorkScheduleInline(admin.TabularInline):
    model = WorkSchedule
    extra = 0

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'user', 'specialty', 'phone', 'email', 'identification_number', 'experience_years']
    list_filter = ['specialty']
    search_fields = ['full_name', 'phone', 'email', 'identification_number']
    inlines = [WorkScheduleInline]

@admin.register(WorkSchedule)
class WorkScheduleAdmin(admin.ModelAdmin):
    list_display = ['id', 'doctor', 'get_day_of_week_display', 'start_time', 'end_time']
    list_filter = ['day_of_week', 'doctor']
    search_fields = ['doctor__full_name']
