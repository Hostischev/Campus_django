import os
from django.db import models
from django.core.validators import RegexValidator, MinValueValidator
from django.utils.crypto import get_random_string
from django.conf import settings
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')


class Room(models.Model):
    room_id = models.AutoField(primary_key=True)
    room_number = models.IntegerField()
    number_of_places = models.IntegerField(validators=[MinValueValidator(1)])
    room_type = models.CharField(
        max_length=50,
        choices=[('Double', 'Double'), ('Triple', 'Triple')],
        null=True, blank=True
    )
    room_condition = models.CharField(
        max_length=50,
        choices=[
            ('Available', 'Available'),
            ('Occupied', 'Occupied'),
            ('Needs Repair', 'Needs Repair')
        ],
        null=True, blank=True
    )
    gender = models.CharField(max_length=6, choices=[('male', 'Male'), ('female', 'Female')], null=True, blank=True)
  # Добавлено поле gender
    class Meta:
        db_table = 'room'
    def __str__(self):
        return f"Room {self.room_number}"


class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    room = models.ForeignKey('Room', models.DO_NOTHING, db_column='room_id')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    group_name = models.CharField(max_length=20)
    birth_date = models.DateField(null=True, blank=True)
    contact_number = models.CharField(unique=True, max_length=15, blank=True, null=True)
    email = models.CharField(unique=True, max_length=100, blank=True, null=True)
    payment_status = models.IntegerField(blank=True, null=True, default=0)
    benefit = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    user = models.OneToOneField('core.User', on_delete=models.CASCADE, db_column='user_id', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'student'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.user:
            password = get_random_string(length=10)
            username = f"{self.first_name.lower()}.{self.last_name.lower()}.{get_random_string(4)}"
            user = User.objects.create_user(
                username=username,
                email=self.email,
                password=password,
                role='student',
                first_name=self.first_name,
                last_name=self.last_name
            )
            self.user = user

            # Записываем логин и пароль в файл credentials.txt
            credentials_path = os.path.join(settings.BASE_DIR, 'credentials.txt')
            with open(credentials_path, 'a', encoding='utf-8') as f:
                f.write(f"Student: {self.first_name} {self.last_name}\n")
                f.write(f"Username: {username}\n")
                f.write(f"Password: {password}\n")
                f.write("=" * 40 + "\n")

            self._generated_password = password

        super().save(*args, **kwargs)

    @property
    def generated_password(self):
        return getattr(self, '_generated_password', None)


class Benefit(models.Model):
    benefitname = models.CharField(max_length=50, primary_key=True)
    price = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.benefitname


class Schedule(models.Model):
    schedule_id = models.AutoField(primary_key=True)
    work_days = models.CharField(max_length=255)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        managed = False  # Django не будет изменять таблицу
        db_table = 'schedule'

    def __str__(self):
        return f"Schedule {self.schedule_id}"


class Employee(models.Model):
    employee_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    schedule = models.ForeignKey(
        Schedule, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    contact_number = models.CharField(
        max_length=15, unique=True, blank=True, null=True,
        validators=[RegexValidator(
            r'^\+?\d{7,15}$', 
            'Contact number must be between 7 and 15 digits, optional leading +'
        )]
    )
    specialty = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False  # Django не будет изменять таблицу
        db_table = 'employee'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Payment(models.Model):
    payment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, models.CASCADE, db_column='student_id')
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    payment_date = models.DateField()

    def __str__(self):
        return f"Payment {self.payment_id} for {self.student}"


class RepairRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, models.CASCADE, db_column='student_id')
    room = models.ForeignKey(Room, models.PROTECT, db_column='room_id')
    employee = models.ForeignKey(Employee, models.PROTECT, db_column='employee_id')
    issue_description = models.TextField()
    request_date = models.DateField()
    request_status = models.CharField(max_length=50)

    def __str__(self):
        return f"RepairRequest {self.request_id} - {self.request_status}"


class Report(models.Model):
    report_id = models.AutoField(primary_key=True)
    employee = models.ForeignKey(Employee, models.PROTECT, db_column='employee_id')
    report_type = models.CharField(max_length=50)
    report_date = models.DateField()

    def __str__(self):
        return f"Report {self.report_id} ({self.report_type})"


class SettlementRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    resident = models.ForeignKey(Student, models.CASCADE, db_column='resident_id')
    room = models.ForeignKey(Room, models.PROTECT, db_column='room_id')
    settlement_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[('Accepted', 'Accepted'), ('Rejected', 'Rejected'), ('In Progress', 'In Progress')],
        blank=True, null=True
    )
    eviction_date = models.DateField(blank=True, null=True)
    request_type = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"SettlementRequest {self.request_id} - {self.status}"
