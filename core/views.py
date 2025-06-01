from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import connection
from django.http import JsonResponse, HttpResponseBadRequest
from django.template.loader import render_to_string
from .models import Student, Benefit, Room, Schedule, Employee
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
import os, random, string
from django.contrib.auth import get_user_model

User = get_user_model()



@login_required(login_url='login')
def home(request):
    return render(request, 'home.html')

def profile(request):
    user = request.user
    return render(request, 'profile.html', {'user': user})

def is_staff_user(user):
    return user.is_staff

def register_user(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = UserCreationForm()
    return render(request, 'register_form_partial.html', {'form': form})

def load_student_form(request):
    benefits = Benefit.objects.all()
    return render(request, 'student_form_partial.html', {'benefits': benefits})


@require_GET
def get_free_rooms(request):
    gender = request.GET.get('gender')
    if gender not in ('male', 'female'):
        return JsonResponse({'error': 'Invalid gender parameter'}, status=400)

    table = 'free_male_rooms' if gender == 'male' else 'free_female_rooms'

    with connection.cursor() as cursor:
        cursor.execute(f"""
            SELECT room_id, room_number, available_places
            FROM {table}
            WHERE available_places > 0
            ORDER BY room_number
        """)
        rows = cursor.fetchall()

    rooms = []
    for row in rows:
        rooms.append({
            'room_id': row[0],
            'room_number': row[1],
            'available_places': row[2],
            'gender': gender,
        })

    return JsonResponse({'rooms': rooms})

@require_POST
def create_student_ajax(request):
    first_name = request.POST.get('first_name')
    last_name = request.POST.get('last_name')
    group_name = request.POST.get('group_name', '').strip()
    birth_date = request.POST.get('birth_date')
    contact_number = request.POST.get('contact_number')
    email = request.POST.get('email')
    benefit = request.POST.get('benefit')
    gender = request.POST.get('gender')
    selected_room_id = request.POST.get('selected_room_id')
    print('selected_room_id:', selected_room_id)
    
    
    if group_name and not group_name.lower().startswith('group'):
        group_name = group_name.upper()
        group_name = 'Group ' + group_name

    
    if gender:
        gender = gender.capitalize()

    if not selected_room_id:
        return JsonResponse({'success': False, 'error': 'Не выбрана комната'})

    try:
        room_id = int(selected_room_id)
        room = Room.objects.get(pk=room_id)
    except (ValueError, Room.DoesNotExist):
        return JsonResponse({'success': False, 'error': 'Комната не найдена'})

    student = Student(
        first_name=first_name,
        last_name=last_name,
        group_name=group_name,
        birth_date=birth_date,
        contact_number=contact_number,
        email=email,
        benefit=benefit,
        gender=gender,
        room=room,
        payment_status=0,
    )
    student.save()

    username = student.user.username
    password = student.generated_password

    # Записываем в файл рядом с этим views.py
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(BASE_DIR, 'created_users.txt')

    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(f'{last_name} {first_name}\n')
        f.write(f'Username: {username}\n')
        f.write(f'Password: {password}\n\n')

    return JsonResponse({
        'success': True,
        'username': username,
        'password': password,
    })
def employee_form_view(request):
    schedules = Schedule.objects.all()
    return render(request, 'employee_form_partial.html', {'schedules': schedules})
    

def generate_random_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

import os
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from .models import Employee, Schedule

User = get_user_model()

def generate_random_password(length=8):
    import string, random
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@require_POST
def create_employee_ajax(request):
    first_name = request.POST.get('first_name', '').strip()
    last_name = request.POST.get('last_name', '').strip()
    email = request.POST.get('email', '').strip()
    contact_number = request.POST.get('contact_number', '').strip()
    specialty = request.POST.get('specialty', '').strip()
    schedule_id = request.POST.get('schedule_id')

    if not all([first_name, last_name, email, specialty, schedule_id]):
        return JsonResponse({'success': False, 'error': 'Все поля обязательны'})

    try:
        schedule = Schedule.objects.get(pk=schedule_id)
    except Schedule.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Неверный график'})

    # Генерация уникального логина
    base_username = (first_name[0] + last_name).lower()
    username = base_username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    password = generate_random_password()

    try:
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role='employee'
        )
        user.save()

        employee = Employee.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            contact_number=contact_number,
            specialty=specialty,
            schedule=schedule,
            user=user,
        )
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Ошибка создания пользователя: {str(e)}'})

    # Запись в файл
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(BASE_DIR, 'created_employees.txt')
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(f'{last_name} {first_name}\n')
        f.write(f'Username: {username}\n')
        f.write(f'Password: {password}\n\n')

    return JsonResponse({'success': True, 'username': username, 'password': password})
