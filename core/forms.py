# from django import forms
# from .models import Student, Benefit

# GENDER_CHOICES = [
#     ('male', 'Мужской'),
#     ('female', 'Женский'),
# ]

# class StudentForm(forms.ModelForm):
#     gender = forms.ChoiceField(
#     choices=GENDER_CHOICES,
#     required=True,
#     widget=forms.Select(attrs={'id': 'gender'})  # убрала disabled
# )

#     benefit = forms.ModelChoiceField(
#         queryset=Benefit.objects.all(),
#         empty_label="Выберите льготу",
#         required=False,
#         widget=forms.Select(attrs={'id': 'benefit'})
#     )

#     class Meta:
#         model = Student
#         fields = [
#             'first_name', 'last_name', 'group_name', 'birth_date',
#             'contact_number', 'email', 'benefit', 'gender'
#         ]
#         widgets = {
#             'birth_date': forms.DateInput(attrs={'type': 'date', 'id': 'birth_date'}),
#             'first_name': forms.TextInput(attrs={'id': 'first_name'}),
#             'last_name': forms.TextInput(attrs={'id': 'last_name'}),
#             'group_name': forms.TextInput(attrs={'id': 'group_name'}),
#             'contact_number': forms.TextInput(attrs={'id': 'contact_number'}),
#             'email': forms.EmailInput(attrs={'id': 'email'}),
#         }
