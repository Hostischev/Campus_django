# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    room = models.ForeignKey('Room', models.DO_NOTHING)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    group_name = models.CharField(max_length=20)
    birth_date = models.DateField(blank=True, null=True)
    contact_number = models.CharField(unique=True, max_length=15, blank=True, null=True)
    email = models.CharField(unique=True, max_length=100, blank=True, null=True)
    payment_status = models.IntegerField(blank=True, null=True)
    benefit = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'student'
