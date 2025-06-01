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
from core.views import profile, home, get_free_rooms, create_student_ajax, employee_form_view




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

]

