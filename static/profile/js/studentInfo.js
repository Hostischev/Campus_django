document.addEventListener('DOMContentLoaded', () => {
    const btnInfo = document.getElementById('btnInfStudent');
    const infoContainer = document.getElementById('studentInfoFormContainer');
    const repairContainer = document.getElementById('repairFormContainer');

    function hideRepair() {
        repairContainer.style.display = 'none';
    }

    if (btnInfo) {
        btnInfo.addEventListener('click', () => {
            // Переключатель: если уже отображается — скрыть
            if (infoContainer.style.display === 'block') {
                infoContainer.style.display = 'none';
                return;
            }

            hideRepair(); // Скрыть форму заявки

            infoContainer.style.display = 'block';

            // Если уже загружено — не перезапрашиваем
            if (infoContainer.getAttribute('data-loaded') === 'true') return;

            fetch('/student/info/')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        const student = data.data;
                        const repairs = data.repairs;
                        const resettlements = data.resettlements;
                        const payments = data.payments;

                        let repairHTML = '<h4>Заявки на ремонт:</h4>';
                        if (repairs.length === 0) {
                            repairHTML += '<p>Заявок нет.</p>';
                        } else {
                            repairHTML += `<table border="1"><thead><tr><th>Описание</th><th>Дата</th><th>Статус</th></tr></thead><tbody>`;
                            repairs.forEach(r => {
                                repairHTML += `<tr><td>${r.issue_description}</td><td>${r.request_date}</td><td>${r.request_status}</td></tr>`;
                            });
                            repairHTML += '</tbody></table>';
                        }

                        let resettlementHTML = '<h4>Заявки на переселение:</h4>';
                        if (resettlements.length === 0) {
                            resettlementHTML += '<p>Заявок нет.</p>';
                        } else {
                            resettlementHTML += `<table border="1"><thead><tr><th>Желаемая комната</th><th>Дата</th><th>Статус</th></tr></thead><tbody>`;
                            resettlements.forEach(r => {
                                resettlementHTML += `<tr><td>${r.room_number}</td><td>${r.settlement_date}</td><td>${r.status}</td></tr>`;
                            });
                            resettlementHTML += '</tbody></table>';
                        }

                        let paymentHTML = '<h4>История оплат:</h4>';
                        if (payments.length === 0) {
                            paymentHTML += '<p>Платежей нет.</p>';
                        } else {
                            paymentHTML += `<table border="1"><thead><tr><th>Сумма</th><th>Дата</th></tr></thead><tbody>`;
                            payments.forEach(p => {
                                paymentHTML += `<tr><td>${p.amount}</td><td>${p.date}</td></tr>`;
                            });
                            paymentHTML += '</tbody></table>';
                        }

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
                            ${repairHTML}<br>
                            ${resettlementHTML}<br>
                            ${paymentHTML}
                        `;

                        infoContainer.setAttribute('data-loaded', 'true');
                    } else {
                        alert(data.message || 'Ошибка при получении данных');
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('Ошибка при загрузке информации');
                });
        });
    }
});
document.getElementById('btnPayment').addEventListener('click', function() {
    document.getElementById('paymentModal').style.display = 'block';
});