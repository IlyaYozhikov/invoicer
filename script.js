document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM для авторизации
    const authContainer = document.getElementById('auth-container');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameSpan = document.getElementById('user-name');
    
    // Элементы DOM для инвойсов
    const itemsBody = document.getElementById('items-body');
    const addItemBtn = document.getElementById('add-item');
    const subtotalEl = document.getElementById('subtotal');
    const taxRateEl = document.getElementById('tax-rate');
    const taxAmountEl = document.getElementById('tax-amount');
    const totalAmountEl = document.getElementById('total-amount');
    const generatePdfBtn = document.getElementById('generate-pdf');
    const saveInvoiceBtn = document.getElementById('save-invoice');
    const clearAllBtn = document.getElementById('clear-all');
    const loadInvoicesBtn = document.getElementById('load-invoices');
    
    // Элементы модального окна
    const invoicesModal = document.getElementById('invoices-modal');
    const invoicesList = document.getElementById('invoices-list');
    const closeModal = document.querySelector('.close');
    
    // Переключение между формами входа и регистрации
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });
    
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    // Проверка авторизации при загрузке
    checkAuth();
    
    // Функция проверки авторизации
    function checkAuth() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            authContainer.style.display = 'none';
            mainApp.style.display = 'block';
            userNameSpan.textContent = currentUser.name;
            initializeInvoiceApp();
        } else {
            authContainer.style.display = 'block';
            mainApp.style.display = 'none';
        }
    }
    
    // Вход пользователя
    loginBtn.addEventListener('click', function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            checkAuth();
        } else {
            alert('Неверный email или пароль');
        }
    });
    
    // Регистрация пользователя
    registerBtn.addEventListener('click', function() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (!name || !email || !password || !confirmPassword) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.some(u => u.email === email)) {
            alert('Пользователь с таким email уже существует');
            return;
        }
        
        const newUser = { name, email, password, invoices: [] };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        alert('Регистрация успешна!');
        checkAuth();
    });
    
    // Выход пользователя
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        checkAuth();
    });
    
    // Инициализация приложения для работы с инвойсами
    function initializeInvoiceApp() {
        // Добавление новой позиции
        addItemBtn.addEventListener('click', addNewItem);
        
        // Изменение налоговой ставки
        taxRateEl.addEventListener('change', calculateTotals);
        
        // Кнопки действий
        clearAllBtn.addEventListener('click', clearAll);
        saveInvoiceBtn.addEventListener('click', saveInvoice);
        generatePdfBtn.addEventListener('click', generatePDF);
        loadInvoicesBtn.addEventListener('click', showInvoicesModal);
        closeModal.addEventListener('click', () => invoicesModal.style.display = 'none');
        
        // Добавить первую позицию по умолчанию
        addNewItem();
        
        // Инициализация даты текущей датой
        document.getElementById('invoice-date').valueAsDate = new Date();
    }
    
    // Функции для работы с инвойсами (остаются без изменений)
    function addNewItem() {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><input type="text" class="item-desc" placeholder="Описание товара/услуги"></td>
            <td><input type="number" class="item-qty" value="1" min="1"></td>
            <td><input type="number" class="item-price" value="0" min="0" step="0.01"></td>
            <td class="item-total">0.00</td>
            <td><button class="delete-btn">Удалить</button></td>
        `;
        
        itemsBody.appendChild(row);
        
        const qtyInput = row.querySelector('.item-qty');
        const priceInput = row.querySelector('.item-price');
        const deleteBtn = row.querySelector('.delete-btn');
        
        qtyInput.addEventListener('change', calculateRowTotal);
        priceInput.addEventListener('change', calculateRowTotal);
        deleteBtn.addEventListener('click', function() {
            row.remove();
            calculateTotals();
        });
        
        calculateRowTotal.call(row);
    }
    
    function calculateRowTotal() {
        const row = this.closest('tr') || this;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;
        
        row.querySelector('.item-total').textContent = total.toFixed(2);
        calculateTotals();
    }
    
    function calculateTotals() {
        const itemTotals = Array.from(document.querySelectorAll('.item-total'))
            .map(el => parseFloat(el.textContent)) || [0];
        
        const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);
        const taxRate = parseFloat(taxRateEl.value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        
        subtotalEl.textContent = subtotal.toFixed(2);
        taxAmountEl.textContent = taxAmount.toFixed(2);
        totalAmountEl.textContent = total.toFixed(2);
    }
    
    function clearAll() {
        if (confirm('Вы уверены, что хотите очистить все данные?')) {
            document.getElementById('supplier-name').value = '';
            document.getElementById('client-name').value = '';
            document.getElementById('invoice-number').value = 'INV-001';
            document.getElementById('invoice-date').valueAsDate = new Date();
            itemsBody.innerHTML = '';
            taxRateEl.value = '20';
            addNewItem();
            calculateTotals();
        }
    }
    
    function saveInvoice() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        const invoiceData = {
            id: Date.now().toString(),
            supplier: document.getElementById('supplier-name').value,
            client: document.getElementById('client-name').value,
            number: document.getElementById('invoice-number').value,
            date: document.getElementById('invoice-date').value,
            items: Array.from(document.querySelectorAll('#items-body tr')).map(row => ({
                description: row.querySelector('.item-desc').value,
                quantity: parseFloat(row.querySelector('.item-qty').value),
                price: parseFloat(row.querySelector('.item-price').value),
                total: parseFloat(row.querySelector('.item-total').textContent)
            })),
            subtotal: parseFloat(subtotalEl.textContent),
            taxRate: parseFloat(taxRateEl.value),
            taxAmount: parseFloat(taxAmountEl.textContent),
            total: parseFloat(totalAmountEl.textContent),
            createdAt: new Date().toISOString()
        };
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        
        if (userIndex !== -1) {
            users[userIndex].invoices = users[userIndex].invoices || [];
            users[userIndex].invoices.push(invoiceData);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Обновляем текущего пользователя
            localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
            
            alert('Инвойс успешно сохранен!');
        }
    }
    
    function generatePDF() {
        alert('В реальном приложении здесь генерировался бы PDF-документ');
    }
    
    function showInvoicesModal() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.invoices || currentUser.invoices.length === 0) {
            invoicesList.innerHTML = '<p>У вас нет сохраненных инвойсов</p>';
            invoicesModal.style.display = 'block';
            return;
        }
        
        invoicesList.innerHTML = '';
        currentUser.invoices.forEach(invoice => {
            const invoiceElement = document.createElement('div');
            invoiceElement.className = 'invoice-item';
            invoiceElement.innerHTML = `
                <div>
                    <strong>${invoice.number}</strong> - ${invoice.client} (${new Date(invoice.createdAt).toLocaleDateString()})
                </div>
                <div>
                    ${invoice.total.toFixed(2)} ₽
                </div>
            `;
            
            invoiceElement.addEventListener('click', () => loadInvoice(invoice));
            invoicesList.appendChild(invoiceElement);
        });
        
        invoicesModal.style.display = 'block';
    }
    
    function loadInvoice(invoice) {
        document.getElementById('supplier-name').value = invoice.supplier;
        document.getElementById('client-name').value = invoice.client;
        document.getElementById('invoice-number').value = invoice.number;
        document.getElementById('invoice-date').value = invoice.date;
        taxRateEl.value = invoice.taxRate;
        
        // Очищаем текущие позиции
        itemsBody.innerHTML = '';
        
        // Добавляем позиции из инвойса
        invoice.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="item-desc" value="${item.description}"></td>
                <td><input type="number" class="item-qty" value="${item.quantity}" min="1"></td>
                <td><input type="number" class="item-price" value="${item.price}" min="0" step="0.01"></td>
                <td class="item-total">${item.total.toFixed(2)}</td>
                <td><button class="delete-btn">Удалить</button></td>
            `;
            
            itemsBody.appendChild(row);
            
            const qtyInput = row.querySelector('.item-qty');
            const priceInput = row.querySelector('.item-price');
            const deleteBtn = row.querySelector('.delete-btn');
            
            qtyInput.addEventListener('change', calculateRowTotal);
            priceInput.addEventListener('change', calculateRowTotal);
            deleteBtn.addEventListener('click', function() {
                row.remove();
                calculateTotals();
            });
        });
        
        // Обновляем итоги
        subtotalEl.textContent = invoice.subtotal.toFixed(2);
        taxAmountEl.textContent = invoice.taxAmount.toFixed(2);
        totalAmountEl.textContent = invoice.total.toFixed(2);
        
        // Закрываем модальное окно
        invoicesModal.style.display = 'none';
    }
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (event) => {
        if (event.target === invoicesModal) {
            invoicesModal.style.display = 'none';
        }
    });
});