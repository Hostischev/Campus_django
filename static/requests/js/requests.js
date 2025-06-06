currentSort = 'request_date';
currentOrder = 'desc';
currentStatus = 'All';

let originalData = {}; // Для хранения изначальных значений формы

document.addEventListener('DOMContentLoaded', function () {
  loadRequests();
  attachRowClickHandlers();

  document.querySelectorAll('.sort-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const sortField = this.dataset.sort;
      if (currentSort === sortField) {
        currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort = sortField;
        currentOrder = 'asc';
      }
      loadRequests();
    });
  });

  document.getElementById('status').addEventListener('change', function () {
    currentStatus = this.value;
    loadRequests();
  });

  // Привязка формы редактирования с проверкой изменений
  document.getElementById('editForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const requestId = document.getElementById('requestId').value;
    const problem = document.getElementById('problemText').value;
    const note = document.getElementById('noteText').value;
    const status = document.getElementById('statusSelect').value;
    const cost = document.getElementById('costInput').value;

    if (!requestId) {
      alert("request_id не заполнен!");
      return;
    }

    // Проверяем, изменились ли данные
    if (
      problem === originalData.problem &&
      note === originalData.note &&
      status === originalData.status &&
      cost === originalData.cost
    ) {
      alert("Изменений нет, отправка не требуется.");
      return;
    }

    fetch('/api/requests/edit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // помогает Django отличить Ajax-запрос
      },
      body: JSON.stringify({
        request_id: requestId,
        problem: problem,
        note: note,
        status: status,
        cost: cost
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert("Заявка успешно обновлена");
      
          // Обновляем поля формы из данных сервера
          const updated = data.updated_request;
          if (updated) {
            document.getElementById('problemText').value = updated.problem || '';
            document.getElementById('noteText').value = updated.note || '';
            document.getElementById('statusSelect').value = updated.status || 'New';
            document.getElementById('costInput').value = updated.cost || '0';
      
            // Обновим originalData, чтобы при следующем сохранении можно было сравнить
            originalData = {
              problem: updated.problem || '',
              note: updated.note || '',
              status: updated.status || 'New',
              cost: updated.cost || '0'
            };
          }
      
          loadRequests();  // Обновляем таблицу, но модалка остаётся открытой
        } else {
          alert("Ошибка: " + data.error);
        }
      })
      .catch(error => {
        console.error("Ошибка при отправке запроса:", error);
        alert("Произошла ошибка. Смотрите консоль.");
      });
  });

  // Обработчик клика по ссылке "История" в форме редактирования
  const historyLink = document.querySelector('#editForm a[href=""]');
  const historyModal = document.getElementById('historyModal');
  const historyCloseBtn = document.getElementById('historyClose');
  const historyContent = document.getElementById('historyContent');

  historyLink.addEventListener('click', function (e) {
    e.preventDefault();

    const requestId = document.getElementById('requestId').value;
    if (!requestId) {
      alert("Выберите заявку для просмотра истории");
      return;
    }

    historyContent.innerHTML = "<p>Загрузка...</p>";
    historyModal.classList.add('show');

    fetch(`/repair/history/${requestId}/`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(resp => resp.json())
      .then(data => {
        if (data.success) {
          if (data.history.length === 0) {
            historyContent.innerHTML = "<p>История изменений отсутствует.</p>";
            return;
          }

          let html = '<ul style="list-style:none; padding-left:0;">';
          data.history.forEach(h => {
            html += `
              <li style="border-bottom:1px solid #ccc; margin-bottom:10px; padding-bottom:10px;">
                <strong>${h.date}</strong> — ${h.employee}<br>
                <em>Описание:</em> ${h.description}<br>
                <em>Статус:</em> ${h.status}<br>
                <em>Стоимость:</em> ${h.cost}
              </li>`;
          });
          html += '</ul>';
          historyContent.innerHTML = html;
        } else {
          historyContent.innerHTML = `<p style="color:red;">Ошибка: ${data.error}</p>`;
        }
      })
      .catch(err => {
        historyContent.innerHTML = `<p style="color:red;">Ошибка загрузки истории. Проверьте консоль.</p>`;
        console.error(err);
      });
  });

  historyCloseBtn.addEventListener('click', () => {
    historyModal.classList.remove('show');
  });

  window.addEventListener('click', e => {
    if (e.target === historyModal) {
      historyModal.classList.remove('show');
    }
  });
});

function loadRequests() {
  console.log("currentStatus =", currentStatus);
  fetch(`/requests/?sort_by=${currentSort}&order=${currentOrder}&status=${currentStatus}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          console.error("Ошибка сервера:", response.status);
          console.error("Ответ сервера:", text);
          throw new Error(`Ошибка загрузки заявок: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      document.getElementById('requests-body').innerHTML = data.html;
      attachRowClickHandlers(); // Перепривязка после обновления DOM
    })
    .catch(error => {
      console.error("Ошибка при получении заявок:", error.message);
      alert("Произошла ошибка при загрузке заявок. Проверьте консоль для деталей.");
    });
}

function attachRowClickHandlers() {
  const rows = document.querySelectorAll('.request-row');
  const modal = document.getElementById('editModal');
  const requestIdInput = document.getElementById('requestId');
  const problemText = document.getElementById('problemText');
  const noteText = document.getElementById('noteText');
  const statusSelect = document.getElementById('statusSelect');
  const costInput = document.getElementById('costInput');
  const employeeNameInput = document.getElementById('employeeName'); // поле ФИО исполнителя

  rows.forEach(row => {
    row.addEventListener('click', () => {
      console.log('Клик по строке с data-id:', row.dataset.id);

      // Заполнение стандартных полей
      requestIdInput.value = row.dataset.id;
      problemText.value = row.dataset.description || '';
      noteText.value = row.dataset.note || '';
      statusSelect.value = row.dataset.status || 'New';
      costInput.value = row.dataset.cost || '0';

      // Сохраняем исходные значения для проверки изменений
      originalData = {
        problem: problemText.value,
        note: noteText.value,
        status: statusSelect.value,
        cost: costInput.value
      };

      // Получение и установка ФИО исполнителя
      const employeeId = row.dataset.employeeId;
      if (employeeId) {
        fetch(`/api/employees/${employeeId}/`)
          .then(response => {
            if (!response.ok) throw new Error("Сотрудник не найден");
            return response.json();
          })
          .then(data => {
            employeeNameInput.value = data.name;
          })
          .catch(error => {
            console.error("Ошибка получения исполнителя:", error);
            employeeNameInput.value = "—";
          });
      } else {
        employeeNameInput.value = "—";
      }

      modal.classList.add('show');
      openEditModal();
    });
  });

  // Закрытие модалки
  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));

  window.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}
