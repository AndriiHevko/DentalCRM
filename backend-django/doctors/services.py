import datetime
from django.utils import timezone

def get_available_slots(target_date, schedule, appointments, requested_duration_minutes, step_minutes=30, buffer_minutes=5):
    available_slots = []
    
    current_dt = datetime.datetime.combine(target_date, schedule.start_time)
    end_dt = datetime.datetime.combine(target_date, schedule.end_time)
    
    lunch_start = datetime.datetime.combine(target_date, schedule.lunch_start) if getattr(schedule, 'lunch_start', None) else None
    lunch_end = datetime.datetime.combine(target_date, schedule.lunch_end) if getattr(schedule, 'lunch_end', None) else None

    booked_intervals = []
    for appt in appointments:
        start = timezone.localtime(appt.appointment_datetime).replace(tzinfo=None)
        duration = appt.service.duration_minutes if getattr(appt, 'service', None) else 30
        end = start + datetime.timedelta(minutes=duration)
        booked_intervals.append((start, end))

    requested_duration = datetime.timedelta(minutes=requested_duration_minutes)
    step_duration = datetime.timedelta(minutes=step_minutes)

    now_local = timezone.localtime().replace(tzinfo=None)
   
    time_buffer = datetime.timedelta(minutes=buffer_minutes) 

    while current_dt + requested_duration <= end_dt:
        slot_end_dt = current_dt + requested_duration
        is_free = True

        if current_dt < (now_local + time_buffer):
            is_free = False

        if is_free and lunch_start and lunch_end:
            if current_dt < lunch_end and slot_end_dt > lunch_start:
                is_free = False

        if is_free:
            for b_start, b_end in booked_intervals:
                if current_dt < b_end and slot_end_dt > b_start:
                    is_free = False
                    break

        if is_free:
            available_slots.append(current_dt.time().strftime('%H:%M'))

        current_dt += step_duration

    return available_slots