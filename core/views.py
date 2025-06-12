from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import connection
from django.http import JsonResponse, HttpResponseBadRequest
from django.template.loader import render_to_string
from .models import Student, Benefit, Room, Schedule, Employee, RepairRequest, RepairRequestHistory, SettlementRequest, Payment
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
import os, random, string, json
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.timezone import now

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

def request_list(request):
    sort_by = request.GET.get('sort_by', 'request_date')
    order = request.GET.get('order', 'desc')
    status_filter = request.GET.get('status')

    sort_field = '-' + sort_by if order == 'desc' else sort_by

    requests = RepairRequest.objects.all()
    if status_filter in ['New', 'Completed']:
        requests = requests.filter(request_status=status_filter)
    requests = requests.order_by(sort_field)

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        html = render_to_string('repair_requests/request_table_body.html', {
            'requests': requests,
        })
        return JsonResponse({'html': html})

    return render(request, 'repair_requests/request_list.html', {
        'requests': requests,
        'current_sort': sort_by,
        'current_order': order,
        'current_status': status_filter,
    })
@csrf_exempt
@login_required
def update_repair_request(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            req = RepairRequest.objects.get(request_id=data['request_id'])

            # Получение текущего сотрудника
            employee = Employee.objects.get(user=request.user)

            # Сохраняем старые значения
            old_description = req.issue_description
            old_notes = req.completion_notes
            old_status = req.request_status
            old_cost = req.work_cost

            # Обновляем заявку
            req.issue_description = data['problem']
            req.completion_notes = data['note']
            req.request_status = data['status']
            req.work_cost = data['cost']
            req.completion_date = timezone.now().date()
            req.employee = employee
            req.save()

            # Сохраняем историю изменений
            RepairRequestHistory.objects.create(
                repair_request=req,
                changed_by=employee,
                old_description=old_description,
                new_description=req.issue_description,
                old_notes=old_notes,
                new_notes=req.completion_notes,
                old_status=old_status,
                new_status=req.request_status,
                old_cost=old_cost,
                new_cost=req.work_cost
            )

            return JsonResponse({'success': True})
        except RepairRequest.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Заявка не найдена'})
        except Employee.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Сотрудник не найден'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})
def get_employee_info(request, employee_id):
    try:
        employee = Employee.objects.get(employee_id=employee_id)
        full_name = f"{employee.first_name} {employee.last_name}"
        return JsonResponse({'name': full_name})
    except Employee.DoesNotExist:
        return JsonResponse({'name': 'Неизвестно'}, status=404)
@login_required
def get_repair_history(request, request_id):
    try:
        history = RepairRequestHistory.objects.filter(repair_request_id=request_id).select_related('changed_by').order_by('-change_date')
        history_list = [
            {
                'date': h.change_date.strftime("%Y-%m-%d %H:%M"),
                'employee': str(h.changed_by),
                'description': f"{h.old_description} → {h.new_description}",
                'status': f"{h.old_status} → {h.new_status}",
                'cost': f"{h.old_cost} → {h.new_cost}"
            } for h in history
        ]
        return JsonResponse({'success': True, 'history': history_list})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
def create_repair_request(request):
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            data = json.loads(request.body)
            full_name = data.get('full_name', '').strip()
            phone = data.get('phone', '').strip()
            issue_description = data.get('issue_description', '').strip()

            # Проверяем отдельно каждое поле
            if not full_name:
                return JsonResponse({"success": False, "error": "Не указано имя"})
            if not (phone.isdigit() and len(phone) == 10):
                return JsonResponse({"success": False, "error": "Неверный номер телефона"})
            if not issue_description:
                return JsonResponse({"success": False, "error": "Описание проблемы пустое"})

            student = request.user.student
            room = student.room
            room_number = getattr(room, 'room_number', None)

            # Формируем полный текст проблемы
            full_issue_description = f"{issue_description}  Номер телефона: {phone}  ФИО: {full_name}"

            repair_request = RepairRequest.objects.create(
                student=student,
                room=room,
                room_number=room_number,
                issue_description=full_issue_description,
                request_date=timezone.now().date(),
                request_status='New',
                work_cost=0,
            )

            return JsonResponse({"success": True, "request_id": repair_request.request_id})

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse({"success": False, "error": "Invalid request or not authenticated"})
@login_required
def get_logged_student_info(request):
    try:
        student = Student.objects.select_related('room').get(user=request.user)

        student_data = {
            'first_name': student.first_name,
            'last_name': student.last_name,
            'room_number': student.room.room_number if student.room else '—',
            'birth_date': student.birth_date.strftime('%Y-%m-%d') if student.birth_date else '—',
            'group_name': student.group_name,
            'contact_number': student.contact_number or '—',
            'email': student.email or '—',
            'payment_status': student.payment_status if student.payment_status is not None else 0,
            'benefit': student.benefit or 'Нет',
            'gender': student.gender or '—',
        }

        # Заявки на ремонт
        repair_requests = RepairRequest.objects.filter(student=student).order_by('-request_date')
        repair_list = []
        for r in repair_requests:
            status_display = 'In Progress' if r.request_status == 'New' else 'Completed'
            repair_list.append({
                'issue_description': r.issue_description,
                'request_date': r.request_date.strftime('%Y-%m-%d'),
                'request_status': status_display,
            })

        # Заявки на переселение
        resettlement_requests = SettlementRequest.objects.filter(
            resident=student,
            request_type='resettlement'
        ).order_by('-settlement_date')

        resettlement_list = []
        for req in resettlement_requests:
            resettlement_list.append({
                'room_number': req.room.room_number,
                'settlement_date': req.settlement_date.strftime('%Y-%m-%d'),
                'status': req.status or '—',
            })
        payments = Payment.objects.filter(student=student).order_by('-payment_date')
        payment_list = [{
            'amount': str(p.payment_amount),
            'date': p.payment_date.strftime('%Y-%m-%d')
        } for p in payments]

        return JsonResponse({
            'status': 'success',
            'data': student_data,
            'repairs': repair_list,
            'resettlements': resettlement_list,
            'payments': payment_list,
        })

    except Student.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Студент не найден'})
def payment_info(request):
    return render(request, 'payment_info.html')
@login_required
def get_user_gender(request):
    try:
        student = Student.objects.select_related('room').get(user=request.user)

        gender = student.gender
        if not gender:
            return JsonResponse({'error': 'Пол не указан'}, status=404)

        return JsonResponse({'gender': gender})
    except Student.DoesNotExist:
        return JsonResponse({'error': 'Студент не найден'}, status=404)



@login_required
@require_POST
def submit_resettlement_request(request):
    try:
        data = json.loads(request.body)
        room_id = data.get('room_id')

        if not room_id:
            return JsonResponse({'message': 'Комната не указана'}, status=400)

        student = Student.objects.filter(user=request.user).first()
        if not student:
            return JsonResponse({'message': 'Студент не найден'}, status=400)

        room = Room.objects.get(pk=room_id)

        SettlementRequest.objects.create(
            resident=student,
            room=room,
            settlement_date=now().date(),
            status='In Progress',
            request_type='resettlement'
        )

        return JsonResponse({'message': 'Заявка успешно отправлена'})
    except Room.DoesNotExist:
        return JsonResponse({'message': 'Комната не найдена'}, status=400)
    except Exception as e:
        return JsonResponse({'message': f'Ошибка: {str(e)}'}, status=500)
def resettlement_requests_list(request):
    requests = SettlementRequest.objects.filter(status='In Progress', request_type='resettlement')\
        .select_related('resident__room', 'room')

    data = []
    for r in requests:
        data.append({
            'request_id': r.request_id,
            'first_name': r.resident.first_name,
            'last_name': r.resident.last_name,
            'current_room': r.resident.room.room_number,
            'desired_room': r.room.room_number,
            'settlement_date': r.settlement_date.strftime('%Y-%m-%d')
        })

    return JsonResponse({'data': data})
@csrf_exempt
def update_request_status(request, request_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    try:
        body = json.loads(request.body)
        status = body.get('status')

        if status not in ['Accepted', 'Rejected']:
            return JsonResponse({'error': 'Invalid status'}, status=400)

        req = SettlementRequest.objects.select_related('resident', 'room').get(pk=request_id)
        student = req.resident

        if status == 'Accepted':
            # Меняем комнату студента на желаемую
            student.room = req.room
            student.save()

        # Обновляем статус заявки
        req.status = status
        req.save()

        return JsonResponse({'message': 'Status updated successfully'})

    except SettlementRequest.DoesNotExist:
        return JsonResponse({'error': 'Request not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
def settlement_list_page(request):
    return render(request, 'settlementList.html') 
def student_list_page(request):
    return render(request, 'students_list.html')

@require_GET
def student_list_api(request):
    q = request.GET.get('q', '').strip()
    qs = Student.objects.order_by('-student_id')[:10] if not q else Student.objects.filter(
        models.Q(last_name__icontains=q) |
        models.Q(room__room_number__icontains=q) |
        models.Q(contact_number__icontains=q)
    )
    data = [{
        'student_id': s.student_id,
        'first_name': s.first_name,
        'last_name': s.last_name,
        'room': s.room.room_number,
        'balance': s.payment_status,
        'contact': s.contact_number
    } for s in qs]
    return JsonResponse({'data': data})

@require_GET
def student_detail_api(request, sid):
    s = get_object_or_404(Student, student_id=sid)
    return JsonResponse({
        'student_id': s.student_id,
        'first_name': s.first_name,
        'last_name': s.last_name,
        'group_name': s.group_name,
        'birth_date': s.birth_date.isoformat(),
        'contact_number': s.contact_number,
        'email': s.email,
        'payment_status': s.payment_status,
        'benefit': s.benefit,
        'gender': s.gender,
        'room': s.room.room_number,
    })
@require_POST
def student_update_api(request, sid):
    s = get_object_or_404(Student, student_id=sid)
    data = json.loads(request.body)
    if 'room_id' in data:
        from .models import Room
        s.room_id = data['room_id']
    if 'payment_status' in data:
        try:
            s.payment_status = int(data['payment_status'])
        except ValueError:
            return HttpResponseBadRequest('payment_status must be integer')
    s.save()
    return JsonResponse({'ok': True})

@require_POST
def student_delete_api(request, sid):
    s = get_object_or_404(Student, student_id=sid)
    s.user.delete()
    s.delete()
    return JsonResponse({'ok': True})