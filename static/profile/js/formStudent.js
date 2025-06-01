// validation.js
const Validation = (() => {
  const nameRegex = /^[A-Za-z]+$/;
  const groupRegex = /^[A-Za-z]$/;
  const phoneRegex = /^\d{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearErrors(form) {
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  }

  function getOrCreateErrorElem(field) {
    let el = field.parentElement.querySelector('.error-message');
    if (!el) {
      el = document.createElement('div');
      el.className = 'error-message';
      el.style.color = 'red';
      el.style.fontSize = '0.9em';
      field.parentElement.appendChild(el);
    }
    return el;
  }

  function setError(field, message) {
    const el = getOrCreateErrorElem(field);
    el.textContent = message;
  }

  function validateForm(form) {
    clearErrors(form);

    const firstName = form.querySelector('#first_name');
    const lastName = form.querySelector('#last_name');
    const groupName = form.querySelector('#group_name');
    const birthDate = form.querySelector('#birth_date');
    const contact = form.querySelector('#contact_number');
    const email = form.querySelector('#email');
    const benefit = form.querySelector('#benefit');
    const gender = form.querySelector('#gender');

    let valid = true;

    if (!firstName.value.trim() || !nameRegex.test(firstName.value)) {
      setError(firstName, 'Имя должно содержать только английские буквы');
      valid = false;
    }
    if (!lastName.value.trim() || !nameRegex.test(lastName.value)) {
      setError(lastName, 'Фамилия должна содержать только английские буквы');
      valid = false;
    }
    if (!groupName.value.trim() || !groupRegex.test(groupName.value)) {
      setError(groupName, 'Введите одну английскую букву');
      valid = false;
    }

    if (!birthDate.value) {
      setError(birthDate, 'Дата рождения обязательна');
      valid = false;
    } else {
      const date = new Date(birthDate.value);
      const min = new Date();
      min.setFullYear(min.getFullYear() - 16);
      if (date > min) {
        setError(birthDate, 'Возраст должен быть не менее 16 лет');
        valid = false;
      }
    }

    if (!phoneRegex.test(contact.value.trim())) {
      setError(contact, 'Телефон должен содержать ровно 10 цифр');
      valid = false;
    }

    if (!emailRegex.test(email.value.trim())) {
      setError(email, 'Неверный формат email');
      valid = false;
    }

    if (!benefit.value) {
      setError(benefit, 'Выберите льготу');
      valid = false;
    }

    if (!gender.value) {
      setError(gender, 'Выберите пол');
      valid = false;
    }

    return valid;
  }

  return {
    validateForm,
  };
})();

// main.js

let selectedRoomId = null;

function attachStudentFormHandlers() {
  const form = document.getElementById('studentForm');
  const roomsCont = document.getElementById('roomsContainer');

  const showBtn = document.getElementById('showRoomsBtn');
  showBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!Validation.validateForm(form)) return;

    const gender = form.querySelector('#gender')?.value;
    const res = await fetch(`/get_free_rooms?gender=${gender}`);
    const data = await res.json();

    if (!data.rooms || data.rooms.length === 0) {
      roomsCont.innerHTML = '<p>Свободных комнат нет</p>';
      return;
    }

    roomsCont.innerHTML = data.rooms.map(r => `
      <div class="room-square" data-room-id="${r.room_id}" style="width: 50px; height: 50px; border-radius: 6px; background: #3498db; color: white; display: inline-flex; justify-content: center; align-items: center; margin: 5px; cursor: pointer;">
        ${r.room_number}
      </div>
    `).join('');

    roomsCont.innerHTML += `
      <div class="button-bar-options" style="margin-top:10px">
        <button type="button" id="createStudentBtn">Создать студента</button>
      </div>
    `;

    document.querySelectorAll('.room-square').forEach(div => {
      div.addEventListener('click', () => {
        document.querySelectorAll('.room-square').forEach(d => d.style.border = 'none');
        div.style.border = '2px solid black';
        selectedRoomId = div.dataset.roomId;
      });
    });

    document.getElementById('createStudentBtn').addEventListener('click', async () => {
      if (!selectedRoomId) return alert('Пожалуйста, выберите комнату');
      if (!Validation.validateForm(form)) return;

      // Добавляем скрытое поле для selected_room_id, если его нет
      let input = form.querySelector('input[name="selected_room_id"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'selected_room_id';
        form.appendChild(input);
      }
      input.value = selectedRoomId;
      console.log('selected_room_id при отправке:', selectedRoomId);

      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert(`Студент создан.\nЛогин: ${result.username}\nПароль: ${result.password}`);
        form.reset();
        roomsCont.innerHTML = '';
        selectedRoomId = null;
      } else {
        alert(result.error || 'Ошибка при создании');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnStudent');
  btn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const container = document.getElementById('form-room-wrapper');
    const formContainer = document.getElementById('studentFormContainer');

    container.style.display = container.style.display === 'flex' ? 'none' : 'flex';

    const url = btn.dataset.url;
    const res = await fetch(url);
    formContainer.innerHTML = await res.text();

    attachStudentFormHandlers();
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnMaster');
  btn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const container = document.getElementById('form-room-wrapper');
    const formContainer = document.getElementById('employeeFormContainer');

    container.style.display = container.style.display === 'flex' ? 'none' : 'flex';

    const url = btn.dataset.url;
    const res = await fetch(url);
    formContainer.innerHTML = await res.text();

    attachStudentFormHandlers();
  });
});
