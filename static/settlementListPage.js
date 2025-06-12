

function updateRequestStatus(requestId, newStatus) {
    fetch(`/api/update-request-status/${requestId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (response.ok) {
            alert(`Заявка ${newStatus === 'Accepted' ? 'одобрена и переселена' : 'отклонена'}`);
            loadSettlementList();
        } else {
            alert('Ошибка при обновлении статуса');
        }
    });
}

function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return '';
}

function loadSettlementList() {
    const container = document.getElementById('settlementListContainer');
    fetch('/api/resettlement-requests/')
        .then(response => response.json())
        .then(data => {
            if (!data.data.length) {
                container.innerHTML = '<p>Заявок нет.</p>';
                return;
            }
            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Имя</th>
                            <th>Фамилия</th>
                            <th>Текущая комната</th>
                            <th>Желаемая комната</th>
                            <th>Дата заселения</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.data.forEach(item => {
                tableHTML += `
                    <tr>
                        <td>${item.first_name}</td>
                        <td>${item.last_name}</td>
                        <td>${item.current_room}</td>
                        <td>${item.desired_room}</td>
                        <td>${item.settlement_date}</td>
                        <td>
                            <button class="approve-btn" data-id="${item.request_id}">Одобрить</button>
                            <button class="reject-btn" data-id="${item.request_id}">Отказать</button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;

            document.querySelectorAll('.approve-btn').forEach(button => {
                button.addEventListener('click', function () {
                    updateRequestStatus(this.dataset.id, 'Accepted');
                });
            });

            document.querySelectorAll('.reject-btn').forEach(button => {
                button.addEventListener('click', function () {
                    updateRequestStatus(this.dataset.id, 'Rejected');
                });
            });
        });
}

// Загрузка списка при загрузке страницы
document.addEventListener('DOMContentLoaded', loadSettlementList);
