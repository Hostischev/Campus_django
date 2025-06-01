// Загрузка формы при клике на кнопку
document.getElementById('btnMaster').addEventListener('click', function () {
    fetch("/employee-form/")
        .then(response => response.text())
        .then(html => {
            document.getElementById('studentFormContainer').innerHTML = html;

            // После загрузки формы вешаем обработчик сабмита
            const form = document.getElementById('employeeForm'); // Убедись, что в шаблоне форма id="employeeForm"
            form.addEventListener('submit', function(event) {
                event.preventDefault();

                // Удаляем предыдущие ошибки
                form.querySelectorAll('.error-message').forEach(el => el.remove());
                document.getElementById('result').textContent = '';

                let valid = true;
                function showError(field, message) {
                    valid = false;
                    const error = document.createElement('div');
                    error.className = 'error-message';
                    error.style.color = 'red';
                    error.textContent = message;
                    field.insertAdjacentElement('afterend', error);
                }

                let firstName = form.first_name.value.trim();
                let lastName = form.last_name.value.trim();
                let capitalLetterRegex = /^[А-ЯЁA-Z][а-яёa-z]+$/;

                if (!capitalLetterRegex.test(firstName)) {
                    showError(form.first_name, 'Имя должно начинаться с заглавной буквы и содержать только буквы.');
                }
                if (!capitalLetterRegex.test(lastName)) {
                    showError(form.last_name, 'Фамилия должна начинаться с заглавной буквы и содержать только буквы.');
                }

                let email = form.email.value.trim();
                let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showError(form.email, 'Введите корректный email.');
                }

                let phone = form.contact_number.value.trim();
                let phoneRegex = /^\d{10}$/;
                if (!phoneRegex.test(phone)) {
                    showError(form.contact_number, 'Введите корректный номер телефона из 10 цифр без пробелов и знаков.');
                }

                let specialty = form.specialty.value;
                if (!specialty) {
                    showError(form.specialty, 'Пожалуйста, выберите специализацию.');
                }

                if (!valid) return;

                // Отправка через fetch
                const formData = new FormData(form);
                fetch("/create-employee/", {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    const resultDiv = document.getElementById('result');
                    if (data.success) {
                        resultDiv.style.color = 'green';
                        resultDiv.innerHTML = `
                            <p><strong>Сотрудник добавлен!</strong></p>
                            <p>Логин: <code>${data.username}</code></p>
                            <p>Пароль: <code>${data.password}</code></p>
                        `;
                        form.reset();
                    } else {
                        resultDiv.style.color = 'red';
                        resultDiv.textContent = data.error || 'Ошибка при создании сотрудника.';
                    }
                })
                .catch(() => {
                    const resultDiv = document.getElementById('result');
                    resultDiv.style.color = 'red';
                    resultDiv.textContent = 'Ошибка сети или сервера.';
                });
            });
        });
});
