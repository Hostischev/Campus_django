# core/management/commands/create_student_users.py

from django.core.management.base import BaseCommand
from core.models import User, Student
from django.db import transaction

class Command(BaseCommand):
    help = 'Создает пользователей из таблицы Student'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            students = Student.objects.filter(user__isnull=True)
            for student in students:
                username = f"stu{student.student_id}"
                email = student.email or f"{username}@example.com"
                password = "default123"  # временный пароль

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=student.first_name,
                    last_name=student.last_name,
                    role='student'
                )
                student.user = user
                student.save()
                self.stdout.write(self.style.SUCCESS(f"Created user for student {student.first_name} {student.last_name}"))
