document.addEventListener('DOMContentLoaded', () => {
  const btnRepair = document.getElementById('btnRepair');
  const repairContainer = document.getElementById('repairFormContainer');
  const infoContainer = document.getElementById('studentInfoFormContainer');

  function hideInfo() {
      infoContainer.style.display = 'none';
  }

  if (btnRepair) {
      btnRepair.addEventListener('click', () => {
          // Переключение: если уже отображается — скрыть
          if (repairContainer.style.display === 'block') {
              repairContainer.style.display = 'none';
              return;
          }

          hideInfo(); // Скрыть инфо, если открыта

          repairContainer.style.display = 'block';

          if (!repairContainer.innerHTML.trim()) {
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
      });
  }
});
