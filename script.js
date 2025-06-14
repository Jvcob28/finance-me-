document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = {
        transactions: document.getElementById('transactions-view'),
        analytics: document.getElementById('analytics-view'),
        categories: document.getElementById('categories-view')
    };
    
    // Форма транзакции
    const transactionForm = document.querySelector('.transaction-form');
    const transactionType = document.getElementById('transaction-type');
    const transactionAmount = document.getElementById('transaction-amount');
    const transactionCategory = document.getElementById('transaction-category');
    const transactionDate = document.getElementById('transaction-date');
    const transactionDescription = document.getElementById('transaction-description');
    const addTransactionBtn = document.getElementById('add-transaction');
    
    // Фильтры
    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');
    const filterMonth = document.getElementById('filter-month');
    
    // Категории
    const categoriesList = document.getElementById('categories-list');
    const newCategoryName = document.getElementById('new-category-name');
    const newCategoryType = document.getElementById('new-category-type');
    const addCategoryBtn = document.getElementById('add-category-btn');
    
    // Баланс
    const totalBalance = document.getElementById('total-balance');
    const totalIncome = document.getElementById('total-income');
    const totalExpense = document.getElementById('total-expense');
    
    // Графики
    const expenseCategoriesChart = new Chart(
        document.getElementById('expense-categories-chart'),
        { type: 'doughnut', data: { labels: [], datasets: [] } }
    );
    const incomeExpenseChart = new Chart(
        document.getElementById('income-expense-chart'),
        { type: 'bar', data: { labels: [], datasets: [] } }
    );
    const monthlyTrendsChart = new Chart(
        document.getElementById('monthly-trends-chart'),
        { type: 'line', data: { labels: [], datasets: [] } }
    );
    
    // Данные
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [
        { id: 1, name: 'Еда', type: 'expense' },
        { id: 2, name: 'Транспорт', type: 'expense' },
        { id: 3, name: 'Жильё', type: 'expense' },
        { id: 4, name: 'Развлечения', type: 'expense' },
        { id: 5, name: 'Зарплата', type: 'income' }
    ];
    
    // Инициализация
    initDate();
    renderCategoriesDropdown();
    renderTransactions();
    updateBalance();
    renderCategoriesList();
    updateCharts();
    checkTheme();
    
    // События
    themeToggle.addEventListener('click', toggleTheme);
    menuToggle.addEventListener('click', toggleMobileMenu);
    navBtns.forEach(btn => btn.addEventListener('click', switchView));
    addTransactionBtn.addEventListener('click', addTransaction);
    filterType.addEventListener('change', renderTransactions);
    filterCategory.addEventListener('change', renderTransactions);
    filterMonth.addEventListener('change', renderTransactions);
    addCategoryBtn.addEventListener('click', addCategory);
    
    // Функции
    function initDate() {
        const today = new Date().toISOString().split('T')[0];
        transactionDate.value = today;
        
        // Заполняем фильтр месяцев
        const months = [];
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                          'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        
        transactions.forEach(t => {
            const date = new Date(t.date);
            const month = date.getMonth();
            const year = date.getFullYear();
            const key = `${year}-${month}`;
            
            if (!months.includes(key)) {
                months.push(key);
                const option = document.createElement('option');
                option.value = key;
                option.textContent = `${monthNames[month]} ${year}`;
                filterMonth.appendChild(option);
            }
        });
    }
    
    function renderCategoriesDropdown() {
        // Очищаем и заполняем dropdown категорий в форме
        transactionCategory.innerHTML = '';
        
        const expenseCategories = categories.filter(c => c.type === 'expense');
        const incomeCategories = categories.filter(c => c.type === 'income');
        
        // Добавляем расходы
        const expenseGroup = document.createElement('optgroup');
        expenseGroup.label = 'Расходы';
        expenseCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            expenseGroup.appendChild(option);
        });
        transactionCategory.appendChild(expenseGroup);
        
        // Добавляем доходы
        const incomeGroup = document.createElement('optgroup');
        incomeGroup.label = 'Доходы';
        incomeCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            incomeGroup.appendChild(option);
        });
        transactionCategory.appendChild(incomeGroup);
        
        // Обновляем фильтр категорий
        filterCategory.innerHTML = '<option value="all">Все категории</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            filterCategory.appendChild(option);
        });
    }
    
    function renderTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '';
        
        const typeFilter = filterType.value;
        const categoryFilter = filterCategory.value;
        const monthFilter = filterMonth.value;
        
        let filteredTransactions = [...transactions];
        
        // Фильтрация по типу
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }
        
        // Фильтрация по категории
        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.categoryId == categoryFilter);
        }
        
        // Фильтрация по месяцу
        if (monthFilter !== 'all') {
            const [year, month] = monthFilter.split('-');
            filteredTransactions = filteredTransactions.filter(t => {
                const date = new Date(t.date);
                return date.getFullYear() == year && date.getMonth() == month;
            });
        }
        
        // Сортировка по дате (новые сверху)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = '<p class="no-transactions">Нет операций по выбранным фильтрам</p>';
            return;
        }
        
        filteredTransactions.forEach(transaction => {
            const category = categories.find(c => c.id == transaction.categoryId);
            
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            transactionEl.dataset.id = transaction.id;
            
            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-category">${category ? category.name : 'Неизвестно'}</span>
                    <span class="transaction-description">${transaction.description || ''}</span>
                    <span class="transaction-date">${formatDate(transaction.date)}</span>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()} ₽
                </div>
                <div class="transaction-actions">
                    <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Обработчики событий
            const editBtn = transactionEl.querySelector('.edit-btn');
            const deleteBtn = transactionEl.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => editTransaction(transaction.id));
            deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
            
            transactionsList.appendChild(transactionEl);
        });
    }
    
    function addTransaction() {
        const amount = parseFloat(transactionAmount.value);
        if (!amount || amount <= 0) {
            alert('Введите корректную сумму');
            return;
        }
        
        const newTransaction = {
            id: Date.now(),
            type: transactionType.value,
            amount: amount,
            categoryId: parseInt(transactionCategory.value),
            date: transactionDate.value,
            description: transactionDescription.value.trim(),
            createdAt: new Date().toISOString()
        };
        
        transactions.push(newTransaction);
        saveData();
        renderTransactions();
        updateBalance();
        updateCharts();
        
        // Сброс формы
        transactionAmount.value = '';
        transactionDescription.value = '';
    }
    
    function editTransaction(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        const newAmount = prompt('Измените сумму:', transaction.amount);
        if (newAmount && !isNaN(newAmount)) {
            transaction.amount = parseFloat(newAmount);
            saveData();
            renderTransactions();
            updateBalance();
            updateCharts();
        }
        
        const newDesc = prompt('Измените описание:', transaction.description);
        if (newDesc !== null) {
            transaction.description = newDesc.trim();
            saveData();
            renderTransactions();
        }
    }
    
    function deleteTransaction(id) {
        if (confirm('Удалить эту операцию?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            renderTransactions();
            updateBalance();
            updateCharts();
        }
    }
    
    function renderCategoriesList() {
        categoriesList.innerHTML = '';
        
        categories.forEach(category => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-item';
            categoryEl.dataset.id = category.id;
            
            categoryEl.innerHTML = `
                <span class="category-name">${category.name}</span>
                <span class="category-type ${category.type}">${category.type === 'income' ? 'Доход' : 'Расход'}</span>
                <button class="delete-category-btn" title="Удалить"><i class="fas fa-trash"></i></button>
            `;
            
            const deleteBtn = categoryEl.querySelector('.delete-category-btn');
            deleteBtn.addEventListener('click', () => deleteCategory(category.id));
            
            categoriesList.appendChild(categoryEl);
        });
    }
    
    function addCategory() {
        const name = newCategoryName.value.trim();
        if (!name) {
            alert('Введите название категории');
            return;
        }
        
        const newCategory = {
            id: Date.now(),
            name: name,
            type: newCategoryType.value
        };
        
        categories.push(newCategory);
        saveData();
        renderCategoriesList();
        renderCategoriesDropdown();
        
        // Сброс формы
        newCategoryName.value = '';
    }
    
    function deleteCategory(id) {
        if (confirm('Удалить эту категорию? Все связанные транзакции будут помечены как "Неизвестно"')) {
            // Удаляем категорию
            categories = categories.filter(c => c.id !== id);
            
            // Обновляем транзакции с этой категорией
            transactions = transactions.map(t => {
                if (t.categoryId == id) {
                    return { ...t, categoryId: null };
                }
                return t;
            });
            
            saveData();
            renderCategoriesList();
            renderCategoriesDropdown();
            renderTransactions();
            updateCharts();
        }
    }
    
    function updateBalance() {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expense;
        
        totalIncome.textContent = income.toLocaleString() + ' Сум';
        totalExpense.textContent = expense.toLocaleString() + ' Сум';
        totalBalance.textContent = balance.toLocaleString() + ' Сум';
    }
    
    function updateCharts() {
        // Расходы по категориям
        const expenseCategories = categories.filter(c => c.type === 'expense');
        const expenseData = expenseCategories.map(cat => {
            const total = transactions
                .filter(t => t.type === 'expense' && t.categoryId === cat.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return total;
        });
        
        expenseCategoriesChart.data = {
            labels: expenseCategories.map(c => c.name),
            datasets: [{
                data: expenseData,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#8AC24A', '#607D8B', '#E91E63', '#00BCD4'
                ]
            }]
        };
        expenseCategoriesChart.update();
        
        // Доходы vs расходы
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        incomeExpenseChart.data = {
            labels: ['Доходы', 'Расходы'],
            datasets: [{
                data: [income, expense],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        };
        incomeExpenseChart.update();
        
        // Динамика за месяц
        const last6Months = [];
        const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            last6Months.push({
                month: date.getMonth(),
                year: date.getFullYear(),
                label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
            });
        }
        
        const monthlyIncome = last6Months.map(m => {
            return transactions
                .filter(t => t.type === 'income' && 
                    new Date(t.date).getMonth() === m.month && 
                    new Date(t.date).getFullYear() === m.year)
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        const monthlyExpense = last6Months.map(m => {
            return transactions
                .filter(t => t.type === 'expense' && 
                    new Date(t.date).getMonth() === m.month && 
                    new Date(t.date).getFullYear() === m.year)
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        monthlyTrendsChart.data = {
            labels: last6Months.map(m => m.label),
            datasets: [
                {
                    label: 'Доходы',
                    data: monthlyIncome,
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Расходы',
                    data: monthlyExpense,
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        };
        monthlyTrendsChart.update();
    }
    
    function switchView(e) {
        const view = e.currentTarget.dataset.view;
        
        // Обновляем активные кнопки
        navBtns.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Показываем нужный вид
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[view].classList.remove('hidden');
        
        // Обновляем графики при переходе в аналитику
        if (view === 'analytics') {
            updateCharts();
        }
        
        // Закрываем мобильное меню
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }
    
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
    
    function toggleMobileMenu() {
        mobileMenu.classList.toggle('hidden');
    }
    
    function checkTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.textContent = '☀️';
        }
    }
    
    function saveData() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('categories', JSON.stringify(categories));
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
});