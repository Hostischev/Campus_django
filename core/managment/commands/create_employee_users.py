# core/management/commands/create_employee_users.py

from django.core.management.base import BaseCommand
from core.models import User, Employee
from django.db import transaction

class Command(BaseCommand):
    help = 'Создает пользователей из таблицы Employee'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            employees = Employee.objects.filter(user__isnull=True)
            for emp in employees:
                username = f"emp{emp.employee_id}"
                email = emp.email or f"{username}@example.com"
                password = "default123"

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=emp.first_name,
                    last_name=emp.last_name,
                    role='employee'
                )
                emp.user = user
                emp.save()
                self.stdout.write(self.style.SUCCESS(f"Created user for employee {emp.first_name} {emp.last_name}"))
