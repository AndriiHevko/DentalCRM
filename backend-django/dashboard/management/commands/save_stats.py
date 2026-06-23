from django.core.management.base import BaseCommand
from dashboard.services import generate_all_snapshots

class Command(BaseCommand):
    help = 'Генерує та зберігає зрізи статистики (Тиждень, Місяць, Весь час)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Починаю генерацію всіх періодів статистики...')
        try:
            generate_all_snapshots()
            self.stdout.write(self.style.SUCCESS('Успіх! Усі зрізи успішно оновлено.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Помилка: {e}'))