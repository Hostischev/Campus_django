// Получаем контейнер с формой
const formRoomWrapper = document.getElementById('form-room-wrapper');

// Функция показа формы с загрузкой данных
async function showSettlementForm() {
  formRoomWrapper.style.display = 'block';

  const roomsContainer = document.getElementById('roomsContainer');
  const studentFormContainer = document.getElementById('studentFormContainer');
  roomsContainer.innerHTML = '';
  studentFormContainer.innerHTML = '';

  try {
    // Получаем данные студента
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
    const currentRoomNumber = data.data.room_number;

    console.log('Студент:', data.data);

    // Получаем свободные комнаты по полу
    const roomsRes = await fetch(`/get_free_rooms?gender=${gender}`);
    const roomsData = await roomsRes.json();

    console.log('Комнаты:', roomsData.rooms);

    if (!roomsData.rooms || roomsData.rooms.length === 0) {
      roomsContainer.innerHTML = '<p>Свободных комнат нет</p>';
      return;
    }

    // Исключаем комнату, в которой живёт студент (по номеру)
    const filteredRooms = roomsData.rooms.filter(
      r => r.room_number !== currentRoomNumber
    );

    if (filteredRooms.length === 0) {
      roomsContainer.innerHTML = '<p>Свободных комнат нет (кроме вашей)</p>';
      return;
    }

    // Рендерим кнопки комнат
    roomsContainer.innerHTML = filteredRooms.map(r => `
      <div class="room-square" data-room-id="${r.room_id}" style="
        width: 50px; height: 50px; border-radius: 6px;
        background: #3498db; color: white; display: inline-flex;
        justify-content: center; align-items: center; margin: 5px; cursor: pointer;
      ">${r.room_number}</div>
    `).join('');

    // Добавляем кнопку отправки
    roomsContainer.innerHTML += `
      <div style="margin-top: 10px;">
        <button id="submitSettlementBtn">Подать заявку</button>
      </div>
    `;

    // Обработка выбора комнаты
    selectedRoomId = null;
    document.querySelectorAll('.room-square').forEach(div => {
      div.addEventListener('click', () => {
        document.querySelectorAll('.room-square').forEach(d => d.style.border = 'none');
        div.style.border = '2px solid black';
        selectedRoomId = div.dataset.roomId;
      });
    });

    // Обработка отправки заявки
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

// Обработчики кнопок
const btnRepair = document.getElementById('btnRepair');
const btnInfStudent = document.getElementById('btnInfStudent');
const btnPayment = document.getElementById('btnPayment');
const btnSettlement = document.getElementById('btnSettlement');

const buttons = [btnRepair, btnInfStudent, btnPayment, btnSettlement];

buttons.forEach(btn => {
  if (!btn) return;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (btn.id === 'btnSettlement') {
      if (formRoomWrapper.style.display === 'block') {
        formRoomWrapper.style.display = 'none';
      } else {
        await showSettlementForm();
      }
    } else {
      if (formRoomWrapper.style.display === 'block') {
        formRoomWrapper.style.display = 'none';
      }
    }
  });
});
