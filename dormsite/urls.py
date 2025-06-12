"""
URL configuration for dormsite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from core import views 
from django.contrib.auth import views as auth_views
from core.views import profile, home, get_free_rooms, create_student_ajax, employee_form_view, update_repair_request, update_request_status




urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/login/'), name='logout'),
    path('profile/', profile, name='profile'),
    path('register/', views.register_user, name='register_user'),
    path('student/form/', views.load_student_form, name='load_student_form'),
    path('get_free_rooms', get_free_rooms, name='get_free_rooms'),
    path('create_student_ajax/', create_student_ajax, name='create_student_ajax'),
    path('create-employee/', views.create_employee_ajax, name='create_employee_ajax'),
    path('employee-form/', views.employee_form_view, name='employee_form'),
    path('requests/', views.request_list, name='request_list'),
    path('api/requests/edit/', update_repair_request, name='update_repair_request'),
    path('api/employees/<int:employee_id>/', views.get_employee_info, name='get_employee_info'),
    path('repair/history/<int:request_id>/', views.get_repair_history, name='repair_history'),
    path('api/repair/create/', views.create_repair_request, name='create_repair_request'),
    path('student/info/', views.get_logged_student_info, name='get_logged_student_info'),
    path('payment/', views.payment_info, name='payment_info'),
    path('get_user_gender/', views.get_user_gender),
    path('submit_resettlement_request/', views.submit_resettlement_request),
    path('api/resettlement-requests/', views.resettlement_requests_list, name='resettlement_requests_list'),
    path('api/update-request-status/<int:request_id>/', update_request_status),
    path('settlement-list/', views.settlement_list_page, name='settlement_list_page'),

    
]

