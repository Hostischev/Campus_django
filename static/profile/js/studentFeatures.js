// --- Получение DOM-элементов ---
const formRoomWrapper = document.getElementById('form-room-wrapper');
const repairContainer = document.getElementById('repairFormContainer');
const infoContainer = document.getElementById('studentInfoFormContainer');
const roomsContainer = document.getElementById('roomsContainer');
const studentFormContainer = document.getElementById('studentFormContainer');

// --- Получение CSRF-токена ---
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

// --- Скрытие всех форм ---
function hideAllForms() {
  formRoomWrapper.style.display = 'none';
  repairContainer.style.display = 'none';
  infoContainer.style.display = 'none';

  roomsContainer.innerHTML = '';
  studentFormContainer.innerHTML = '';
  repairContainer.innerHTML = '';
  infoContainer.innerHTML = '';

  infoContainer.setAttribute('data-loaded', 'false');
}

// --- Заявка на переселение ---
async function showSettlementForm() {
  formRoomWrapper.style.display = 'block';
  roomsContainer.innerHTML = '';
  studentFormContainer.innerHTML = '';

  try {
    const res = await fetch('/student/info/');
    const data = await res.json();

    if (data.status !== 'success') {
      alert('Не удалось получить данные студента');
      hideAllForms();
      return;
    }

    const genderRaw = data.data.gender;
    if (!genderRaw || genderRaw === '—') {
      alert('Невозможно определить пол пользователя');
      hideAllForms();
      return;
    }

    const gender = genderRaw.toLowerCase();
    const currentRoomNumber = data.data.room_number;

    const roomsRes = await fetch(`/get_free_rooms?gender=${gender}`);
    const roomsData = await roomsRes.json();

    if (!roomsData.rooms || roomsData.rooms.length === 0) {
      roomsContainer.innerHTML = '<p>Свободных комнат нет</p>';
      return;
    }

    const filteredRooms = roomsData.rooms.filter(r => r.room_number !== currentRoomNumber);

    if (filteredRooms.length === 0) {
      roomsContainer.innerHTML = '<p>Свободных комнат нет (кроме вашей)</p>';
      return;
    }
    roomsContainer.innerHTML = `
  <div><h2>Свободные комнаты</h2></div>
  <div id="roomSquaresContainer">
    ${filteredRooms.map(r => `
      <div class="room-square" data-room-id="${r.room_id}" style="
        width: 50px; height: 50px; border-radius: 6px;
        background: #3498db; color: white; display: inline-flex;
        justify-content: center; align-items: center; margin: 5px; cursor: pointer;
      ">${r.room_number}</div>
    `).join('')}
  </div>
  <div class="divSubmitSettlementBtn show" style="margin-top: 10px;">
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
        hideAllForms();
      } else {
        alert(result.message || 'Ошибка при отправке заявки');
      }
    });

  } catch (error) {
    console.error(error);
    alert('Ошибка при загрузке данных');
    hideAllForms();
  }
}

// --- Заявка на ремонт ---
function showRepairForm() {
  repairContainer.style.display = 'block';
  if (repairContainer.innerHTML.trim()) return;

  repairContainer.innerHTML = `
    <form id="repairRequestForm">
      <label>Описание проблемы:<br><textarea id="issueDescription" required></textarea></label><br>
      <label>Номер телефона (10 цифр):<br><input type="text" id="phoneInput" pattern="\\d{10}" maxlength="10" required></label><br>
      <label>Фамилия и имя:<br><input type="text" id="fullName" required></label><br>
      <button type="submit">Оставить заявку</button>
    </form>
  `;

  document.getElementById('repairRequestForm').addEventListener('submit', e => {
    e.preventDefault();

    const issueDescriptionRaw = document.getElementById('issueDescription').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const fullName = document.getElementById('fullName').value.trim();

    const engLettersAndBasicPunctRegex = /^[a-zA-Z0-9 .,!?'"()\-\n\r]+$/;
    const engLettersAndSpaceRegex = /^[a-zA-Z ]+$/;

    if (!issueDescriptionRaw || !phone.match(/^\d{10}$/) || !fullName) {
      alert("Пожалуйста, заполните все поля корректно");
      return;
    }

    if (!engLettersAndBasicPunctRegex.test(issueDescriptionRaw)) {
      alert("Описание должно содержать только английские буквы, цифры и знаки препинания");
      return;
    }

    if (!engLettersAndSpaceRegex.test(fullName)) {
      alert("Фамилия и имя должны содержать только английские буквы и пробелы");
      return;
    }

    fetch('/api/repair/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        full_name: fullName,
        phone: phone,
        issue_description: issueDescriptionRaw
      }),
    })
    .then(resp => resp.json())
    .then(data => {
      if (data.success) {
        alert(`Заявка успешно создана, ID: ${data.request_id}`);
        repairContainer.innerHTML = '';
        repairContainer.style.display = 'none';
      } else {
        alert(`Ошибка: ${data.error}`);
      }
    })
    .catch(() => alert("Ошибка при создании заявки"));
  });
}

// --- Информация о студенте ---
async function showStudentInfo() {
  infoContainer.style.display = 'block';

  if (infoContainer.getAttribute('data-loaded') === 'true') return;

  try {
    const response = await fetch('/student/info/');
    const data = await response.json();

    if (data.status !== 'success') {
      alert(data.message || 'Ошибка при получении данных');
      hideAllForms();
      return;
    }

    const student = data.data;
    const repairs = data.repairs || [];
    const resettlements = data.resettlements || [];
    const payments = data.payments || [];

    let repairHTML = '<h4>Заявки на ремонт:</h4>';
    repairHTML += repairs.length === 0
      ? '<p>Заявок нет.</p>'
      : `<table border="1"><thead><tr><th>Описание</th><th>Дата</th><th>Статус</th></tr></thead><tbody>${
        repairs.map(r => `<tr><td>${r.issue_description}</td><td>${r.request_date}</td><td>${r.request_status}</td></tr>`).join('')
      }</tbody></table>`;

    let resettlementHTML = '<h4>Заявки на переселение:</h4>';
    resettlementHTML += resettlements.length === 0
      ? '<p>Заявок нет.</p>'
      : `<table border="1"><thead><tr><th>Желаемая комната</th><th>Дата</th><th>Статус</th></tr></thead><tbody>${
        resettlements.map(r => `<tr><td>${r.room_number}</td><td>${r.settlement_date}</td><td>${r.status}</td></tr>`).join('')
      }</tbody></table>`;

    let paymentHTML = '<h4>История оплат:</h4>';
    paymentHTML += payments.length === 0
      ? '<p>Платежей нет.</p>'
      : `<table border="1"><thead><tr><th>Сумма</th><th>Дата</th></tr></thead><tbody>${
        payments.map(p => `<tr><td>${p.amount}</td><td>${p.date}</td></tr>`).join('')
      }</tbody></table>`;

    infoContainer.innerHTML = `
      <h3>Информация о студенте</h3>
      <ul>
        <li><strong>Имя:</strong> ${student.first_name}</li>
        <li><strong>Фамилия:</strong> ${student.last_name}</li>
        <li><strong>Комната:</strong> ${student.room_number}</li>
        <li><strong>Дата рождения:</strong> ${student.birth_date}</li>
        <li><strong>Группа:</strong> ${student.group_name}</li>
        <li><strong>Телефон:</strong> ${student.contact_number}</li>
        <li><strong>Email:</strong> ${student.email}</li>
        <li><strong>Оплата:</strong> ${student.payment_status}</li>
        <li><strong>Льгота:</strong> ${student.benefit}</li>
        <li><strong>Пол:</strong> ${student.gender}</li>
      </ul>
      ${repairHTML}
      ${resettlementHTML}
      ${paymentHTML}
    `;

    infoContainer.setAttribute('data-loaded', 'true');

  } catch (error) {
    console.error('Ошибка:', error);
    alert('Ошибка при загрузке информации');
    hideAllForms();
  }
}

// --- Обработчики кнопок ---
const btnRepair = document.getElementById('btnRepair');
const btnInfStudent = document.getElementById('btnInfStudent');
const btnPayment = document.getElementById('btnPayment');
const btnSettlement = document.getElementById('btnSettlement');

const buttons = [btnRepair, btnInfStudent, btnPayment, btnSettlement];

buttons.forEach(btn => {
  if (!btn) return;

  btn.addEventListener('click', async e => {
    e.preventDefault();
    const id = btn.id;

    let isOpen = false;
    switch (id) {
      case 'btnSettlement':
        isOpen = formRoomWrapper.style.display === 'block';
        break;
      case 'btnRepair':
        isOpen = repairContainer.style.display === 'block';
        break;
      case 'btnInfStudent':
        isOpen = infoContainer.style.display === 'block';
        break;
      case 'btnPayment':
        const href = btn.dataset.href;
        if (href) {
          window.location.href = href;
          return;
        }
        break;
    }

    hideAllForms();

    if (!isOpen) {
      switch (id) {
        case 'btnSettlement':
          await showSettlementForm();
          break;
        case 'btnRepair':
          showRepairForm();
          break;
        case 'btnInfStudent':
          await showStudentInfo();
          break;
      }
    }
  });
});
