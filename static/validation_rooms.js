// Валидация формы
function validateForm() {
  console.log('validateForm вызвана');
  const requiredFields = ['first_name', 'last_name', 'group_name', 'birth_date', 'contact_number', 'email', 'benefit'];
  let allFilled = true;

  for (const id of requiredFields) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim() || (id === 'benefit' && el.value === '')) {
      console.log(`Поле ${id} не заполнено`);
      allFilled = false;
      break;
    }
  }

  // Активируем gender, если все обязательные поля заполнены и gender заблокирован
  const genderField = document.getElementById('gender');
  if (genderField && allFilled && genderField.disabled) {
    genderField.removeAttribute('disabled');
    console.log('Поле gender активировано');
  }

  // Проверка телефона (10-15 цифр)
  const phone = document.getElementById('contact_number').value.trim();
  if (!/^\d{10,15}$/.test(phone)) {
    alert('Введите корректный номер телефона (10–15 цифр)');
    console.log('Ошибка в номере телефона:', phone);
    return false;
  }

  // Проверка email
  const email = document.getElementById('email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Введите корректный email');
    console.log('Ошибка в email:', email);
    return false;
  }

  // Проверка даты рождения — должна быть в прошлом
  const birthDateVal = document.getElementById('birth_date').value.trim();
  if (birthDateVal) {
    const birthDate = new Date(birthDateVal);
    const now = new Date();
    if (birthDate >= now) {
      alert('Дата рождения должна быть в прошлом');
      console.log('Ошибка в дате рождения:', birthDateVal);
      return false;
    }
  }

  console.log('validateForm успешно пройдена');
  return true;
}

// Функция активации/блокировки gender в зависимости от заполнения остальных полей
function enableGenderOnInput() {
  console.log('enableGenderOnInput вызвана');
  const requiredFields = ['first_name', 'last_name', 'group_name', 'birth_date', 'contact_number', 'email', 'benefit'];
  const genderField = document.getElementById('gender');

  const allFilled = requiredFields.every(id => {
    const el = document.getElementById(id);
    const filled = el && el.value.trim() && (id !== 'benefit' || el.value !== '');
    console.log(`Проверка поля ${id}: заполнено=${filled}`);
    return filled;
  });

  if (genderField) {
    genderField.disabled = !allFilled;
    console.log('Поле gender', genderField.disabled ? 'заблокировано' : 'активировано');
  }
}

// Навешивание слушателей на поля для отслеживания ввода и активации gender
function attachInputListeners() {
  const watchFields = ['first_name', 'last_name', 'group_name', 'birth_date', 'contact_number', 'email', 'benefit'];
  watchFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', enableGenderOnInput);
      el.addEventListener('change', enableGenderOnInput);
      console.log(`Навешан слушатель на поле ${id}`);
    }
  });
}

// Навешивание слушателя на кнопку "Присвоить комнату"
function attachShowRoomsListener() {
  const showRoomsBtn = document.getElementById('showRoomsBtn');
  if (showRoomsBtn) {
    showRoomsBtn.addEventListener('click', () => {
      try {
        console.log('Нажата кнопка showRoomsBtn');
        if (!validateForm()) {
          console.log('validateForm вернула false, выходим');
          return;
        }

        const gender = document.getElementById('gender').value;
        if (!gender) {
          alert('Пожалуйста, выберите гендер');
          console.log('Гендер не выбран');
          return;
        }
        console.log('Выбран гендер:', gender);

        fetch(`/get_free_rooms/?gender=${gender}`)
          .then(response => {
            console.log('Ответ получен от /get_free_rooms/');
            return response.json();
          })
          .then(data => {
            console.log('Данные комнат:', data.rooms);
            let html = '<h3>Свободные комнаты</h3>';
            if (data.rooms.length === 0) {
              html += '<p>Нет доступных комнат.</p>';
            } else {
              html += '<table border="1"><tr><th>Номер комнаты</th><th>Свободные места</th></tr>';
              data.rooms.forEach(room => {
                html += `<tr><td><button class="roomSelectBtn" data-room="${room.room_number}">${room.room_number}</button></td><td>${room.available_places}</td></tr>`;
              });
              html += '</table>';
            }
            document.getElementById('roomsContainer').innerHTML = html;

            // Навешиваем обработчики на кнопки выбора комнаты
            document.querySelectorAll('.roomSelectBtn').forEach(btn => {
              btn.addEventListener('click', () => {
                const selectedRoom = btn.getAttribute('data-room');
                console.log('Выбрана комната:', selectedRoom);
                assignRoom(selectedRoom);
              });
            });
          })
          .catch(err => {
            alert('Ошибка при загрузке свободных комнат');
            console.log('Ошибка fetch /get_free_rooms/:', err);
          });
      } catch (e) {
        console.error('Ошибка в обработчике showRoomsBtn:', e);
      }
    });
    console.log('Навешан слушатель на showRoomsBtn');
  } else {
    console.log('Кнопка showRoomsBtn не найдена');
  }
}

// Отправка данных формы с выбранной комнатой на сервер
function assignRoom(roomNumber) {
  console.log('assignRoom вызвана с комнатой:', roomNumber);
  const form = document.getElementById('studentForm');
  if (!form) {
    console.log('Форма studentForm не найдена');
    return;
  }
  const formData = new FormData(form);
  formData.append('room_number', roomNumber);

  fetch('/assign_room/', {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': getCSRFToken(),
    },
  })
    .then(response => {
      console.log('Ответ получен от /assign_room/');
      if (!response.ok) throw new Error('Ошибка сервера');
      return response.json();
    })
    .then(data => {
      if (data.success) {
        alert('Жилец успешно добавлен!');
        console.log('Жилец добавлен успешно');
        form.reset();
        document.getElementById('roomsContainer').innerHTML = '';
        const genderField = document.getElementById('gender');
        if (genderField) genderField.setAttribute('disabled', 'disabled');
      } else {
        alert('Ошибка: ' + data.error);
        console.log('Ошибка на сервере:', data.error);
      }
    })
    .catch(err => {
      alert(err.message);
      console.log('Ошибка fetch /assign_room/:', err);
    });
}

// Получение CSRF токена из cookies
function getCSRFToken() {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  console.log('CSRF токен не найден');
  return '';
}

// Инициализация: навесить слушатели после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded сработало');
  attachInputListeners();
  attachShowRoomsListener();
});
