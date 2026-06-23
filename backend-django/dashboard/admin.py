from django.contrib import admin
from .models import StatisticSnapshot

@admin.register(StatisticSnapshot)
class StatisticSnapshotAdmin(admin.ModelAdmin):
    list_display = ('period_type', 'start_date', 'end_date', 'total_revenue', 'total_appointments', 'created_at')
    list_filter = ('period_type', 'start_date')
    search_fields = ('start_date',)
    readonly_fields = ('created_at',)
    
    def formfield_for_dbfield(self, db_field, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, **kwargs)
        if db_field.name in ['appointments_status_breakdown', 'top_services']:
            formfield.widget.attrs['rows'] = 10
            formfield.widget.attrs['cols'] = 80
        return formfield