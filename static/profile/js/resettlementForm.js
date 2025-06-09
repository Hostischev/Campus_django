// Получаем контейнер с формой
const formRoomWrapper = document.getElementById('form-room-wrapper');

// Функция показа формы с загрузкой данных (твоя оригинальная логика)
async function showSettlementForm() {
  formRoomWrapper.style.display = 'block';

  const roomsContainer = document.getElementById('roomsContainer');
  const studentFormContainer = document.getElementById('studentFormContainer');
  roomsContainer.innerHTML = '';
  studentFormContainer.innerHTML = '';

  try {
    const res = await fetch('/student/info/');
    const data = await res.json();

    if (data.status !== 'success') {
      alert('Не удалось получить данные студента');
      formRoomWrapper.style.display = 'none';
      return;
    }

    const genderRaw = data.data.gender;
    if (!genderRaw || genderRaw === '—') {
      alert('Невозможно определить пол пользователя');
      formRoomWrapper.style.display = 'none';
      return;
    }
    const gender = genderRaw.toLowerCase();

    const roomsRes = await fetch(`/get_free_rooms?gender=${gender}`);
    const roomsData = await roomsRes.json();

    if (!roomsData.rooms || roomsData.rooms.length === 0) {
      roomsContainer.innerHTML = '<p>Свободных комнат нет</p>';
      return;
    }

    roomsContainer.innerHTML = roomsData.rooms.map(r => `
      <div class="room-square" data-room-id="${r.room_id}" style="
        width: 50px; height: 50px; border-radius: 6px;
        background: #3498db; color: white; display: inline-flex;
        justify-content: center; align-items: center; margin: 5px; cursor: pointer;
      ">${r.room_number}</div>
    `).join('');

    roomsContainer.innerHTML += `
      <div style="margin-top: 10px;">
        <button id="submitSettlementBtn">Подать заявку</button>
      </div>
    `;

    let selectedRoomId = null;
    document.querySelectorAll('.room-square').forEach(div => {
      div.addEventListener('click', () => {
        document.querySelectorAll('.room-square').forEach(d => d.style.border = 'none');
        div.style.border = '2px solid black';
        selectedRoomId = div.dataset.roomId;
      });
    });

    document.getElementById('submitSettlementBtn').addEventListener('click', async () => {
      if (!selectedRoomId) {
        alert('Пожалуйста, выберите комнату');
        return;
      }

      const response = await fetch('/submit_resettlement_request/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
          room_id: selectedRoomId,
          request_type: 'resettlement'
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        alert('Заявка успешно отправлена');
        formRoomWrapper.style.display = 'none';
      } else {
        alert(result.message || 'Ошибка при отправке заявки');
      }
    });

  } catch (error) {
    console.error(error);
    alert('Ошибка при загрузке данных');
    formRoomWrapper.style.display = 'none';
  }
}

// Функция получения csrftoken из cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Обработчик кликов по всем 4 кнопкам
const btnRepair = document.getElementById('btnRepair');
const btnInfStudent = document.getElementById('btnInfStudent');
const btnPayment = document.getElementById('btnPayment');
const btnSettlement = document.getElementById('btnSettlement');

const buttons = [btnRepair, btnInfStudent, btnPayment, btnSettlement];

// Общий обработчик
buttons.forEach(btn => {
  if (!btn) return; // если кнопки нет в DOM (например, btnPayment в ссылке), пропускаем

  btn.addEventListener('click', async (e) => {
    e.preventDefault(); // если кнопка в ссылке, отменяем переход

    if (btn.id === 'btnSettlement') {
      // Если форма уже открыта - закрываем, иначе открываем и грузим данные
      if (formRoomWrapper.style.display === 'block') {
        formRoomWrapper.style.display = 'none';
      } else {
        await showSettlementForm();
      }
    } else {
      // Для других кнопок — просто скрываем форму, если она была открыта
      if (formRoomWrapper.style.display === 'block') {
        formRoomWrapper.style.display = 'none';
      }
      // Можно тут добавить логику для других кнопок, если нужно
    }
  });
});
