# 🦷 DentalCRM

Повнофункціональна система управління стоматологічною клінікою з трьома клієнтами: веб-додатком, десктопним додатком та REST API бекендом.

---

## 📐 Архітектура проєкту

```
DentalCRM/
├── backend-django/        # REST API сервер (Python / Django)
├── client-web_ts/         # Веб-клієнт (React / TypeScript)
└── client-desctop_c++/    # Десктопний клієнт (Qt6 / C++)
```

---

## ✨ Функціональність

### Для пацієнтів
- Реєстрація та авторизація (email або номер телефону)
- Запис на прийом онлайн
- Перегляд власних записів та медичної картки
- Інтерактивна зубна карта (dental chart)
- AI-консультант на базі Gemini 2.5 Flash

### Для адміністраторів / лікарів
- Управління записами (статуси: pending → scheduled → in_progress → done / cancelled)
- Управління лікарями, спеціальностями, графіком роботи
- Медичні записи та лікування
- Виставлення рахунків (invoices) з автогенерацією PDF-квитанцій
- Дашборд зі статистикою та PDF-звітами
- Повна адмін-панель Django

---

## 🛠 Технологічний стек

| Рівень | Технології |
|---|---|
| **Бекенд** | Python 3, Django, Django REST Framework, SimpleJWT, drf-yasg (Swagger) |
| **База даних** | PostgreSQL (через `DATABASE_URL`) |
| **Планувальник** | APScheduler (`django_apscheduler`) |
| **PDF** | Кастомна генерація квитанцій та звітів |
| **Веб-клієнт** | React 19, TypeScript, Vite, React Router 7, Recharts |
| **AI** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Десктоп-клієнт** | C++17, Qt6 (Core, Gui, Widgets, Network), CMake |

---

## 🚀 Швидкий старт

### Бекенд (Django)

**Вимоги:** Python 3.10+, PostgreSQL

```bash
cd backend-django

# Встановлення залежностей
pip install -r requirements.txt

# Налаштування змінних середовища
cp .env-example .env
# Відредагуйте .env — вкажіть SECRET_KEY, DATABASE_URL, налаштування email
```

**.env приклад:**
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:password@localhost:5432/dentalcrm
EMAIL_HOST_USER=example@gmail.com
EMAIL_HOST_PASSWORD=your_email_app_password
FRONTEND_URL=http://localhost:5173
```

```bash
# Міграції та запуск
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API доступне за адресою: `http://localhost:8000/api/`  
Swagger документація: `http://localhost:8000/swagger/`

---

### Веб-клієнт (React + TypeScript)

**Вимоги:** Node.js 18+

```bash
cd client-web_ts

npm install
npm run dev
```

Додаток відкриється за адресою: `http://localhost:5173`

> **AI-консультант:** для роботи AI-чату встановіть змінну середовища `API_KEY` з вашим Google Gemini API ключем.

---

### Десктопний клієнт (Qt6 / C++)

**Вимоги:** Qt 6, CMake 3.16+, компілятор з підтримкою C++17

```bash
cd client-desctop_c++

cmake -B build -S .
cmake --build build
./build/bin/DentalClinicApp
```

> Десктопний клієнт підключається до запущеного Django бекенду через REST API.

---

## 📡 API Endpoints

| Ресурс | Шлях |
|---|---|
| Користувачі / Авторизація | `/api/users/` |
| Лікарі | `/api/doctors/` |
| Послуги | `/api/services/` |
| Записи на прийом | `/api/appointments/` |
| Медичні записи | `/api/medical_records/` |
| Рахунки | `/api/invoices/` |
| Дашборд / Статистика | `/api/dashboard/` |

Повна інтерактивна документація: `/swagger/`

---

## 🧪 Тести

```bash
cd backend-django
pytest
```

Тести охоплюють: модулі користувачів, лікарів, медичних записів, послуг та наскрізні (end-to-end) сценарії клініки.

---

## 📁 Структура бекенду

```
backend-django/
├── users/              # Кастомна модель User + Patient, JWT авторизація
├── doctors/            # Лікарі, спеціальності, графік роботи
├── services/           # Стоматологічні послуги
├── appointments/       # Записи на прийом
├── medical_records/    # Медичні картки та лікування
├── invoices/           # Виставлення рахунків + PDF квитанції
├── dashboard/          # Статистика + PDF звіти
└── clinic/             # Налаштування проєкту (settings, urls)
```

## 📁 Структура веб-клієнта

```
client-web_ts/
├── components/         # Загальні компоненти (Header, Hero, DentalChart, AIConsultant…)
├── components/admin/   # Адмін компоненти (InvoiceTable, ScheduleModal…)
├── pages/              # Сторінки для пацієнтів (Home, Appointments, Cabinet…)
├── pages/admin/        # Адмін-сторінки (Dashboard, Doctors, Statistics…)
├── services/           # API клієнти + Gemini AI сервіс
└── types.ts            # TypeScript типи
```

## 📁 Структура десктопного клієнта

```
client-desctop_c++/
├── src/
│   ├── controllers/        # Логіка (Appointments, Patients, Schedule, WorkingHours…)
│   ├── views/              # UI-компоненти (AppointmentDetail, PatientDetail, Schedule…)
│   ├── screens/            # Діалогові вікна (AddAppointmentDialog)
│   ├── services/           # HTTP клієнт для взаємодії з API (ApiClient)
│   ├── models/             # Структури даних / моделі
│   ├── utils/              # Допоміжні UI-утиліти
│   ├── mainwindow.cpp/.h   # Головне вікно застосунку
│   └── logindialog.cpp/.h  # Діалог авторизації
└── CMakeLists.txt          # Конфігурація збірки CMake

```

---

## 👤 Ролі користувачів

- **Пацієнт** — реєстрація, запис на прийом, перегляд власних даних
- **Лікар** — процес лікування, управління пацієнтами та перегляд свого розкладу
- **Адміністратор** — повний доступ до всіх модулів системи
