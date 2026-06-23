#include "mainwindow.h"
#include "logindialog.h"
#include "services/apiclient.h"
#include "views/scheduleview.h"
#include "views/patientsview.h"
#include "views/patientdetailview.h"
#include "views/settingswidget.h"
#include "screens/addappointmentdialog.h"

#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QPushButton>
#include <QApplication>

#include <QScreen>
#include <QGuiApplication>
#include <QRect>
#include <QCloseEvent>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent) {
    setWindowTitle("Dental Clinic — Лікарський кабінет");
    // setWindowFlags(Qt::Window | Qt::WindowTitleHint | Qt::WindowMinimizeButtonHint | Qt::WindowMaximizeButtonHint);
    setMinimumSize(1300, 750);
    setupUi();

    QScreen *screen = QGuiApplication::primaryScreen();
    if (screen) {
        QRect screenGeometry = screen->availableGeometry();

        int x = screenGeometry.x() + (screenGeometry.width() - this->width()) / 2;
        int y = screenGeometry.y() + (screenGeometry.height() - this->height()) / 2;

        this->move(x, y);
    }
}

void MainWindow::setupUi() {
    QWidget *centralWidget = new QWidget(this);
    setCentralWidget(centralWidget);

    QHBoxLayout *mainLayout = new QHBoxLayout(centralWidget);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    QWidget *sidebarContainer = new QWidget(this);
    sidebarContainer->setObjectName("sidebarContainer");
    sidebarContainer->setFixedWidth(240);
    QVBoxLayout *sidebarLayout = new QVBoxLayout(sidebarContainer);
    sidebarLayout->setContentsMargins(0, 24, 0, 24);
    sidebarLayout->setSpacing(0);

    QLabel *logoLabel = new QLabel("DENTAL", this);
    logoLabel->setObjectName("logoLabel");
    logoLabel->setAlignment(Qt::AlignCenter);
    sidebarLayout->addWidget(logoLabel);
    sidebarLayout->addSpacing(10);

    QWidget *doctorWidget = new QWidget(this);
    QVBoxLayout *doctorLayout = new QVBoxLayout(doctorWidget);
    doctorLayout->setContentsMargins(0, 0, 0, 0);
    doctorLayout->setSpacing(8);

    QLabel *avatarLabel = new QLabel("D", this);
    avatarLabel->setObjectName("avatarLabel");
    avatarLabel->setAlignment(Qt::AlignCenter);
    avatarLabel->setFixedSize(50, 50);

    m_userLabel = new QLabel("", this);
    m_userLabel->setObjectName("userLabel");
    m_userLabel->setAlignment(Qt::AlignCenter);
    m_userLabel->setWordWrap(true);

    doctorLayout->addWidget(avatarLabel, 0, Qt::AlignHCenter);
    doctorLayout->addWidget(m_userLabel, 0, Qt::AlignHCenter);

    sidebarLayout->addWidget(doctorWidget);
    sidebarLayout->addSpacing(16);

    m_sidebar = new QListWidget(this);
    m_sidebar->setObjectName("sidebarMenu");
    m_sidebar->addItem("📅  Розклад");
    m_sidebar->addItem("👥  Пацієнти");
    m_sidebar->addItem("⏱  Графік");
    m_sidebar->addItem("⚙️  Налаштування");
    for (int i = 0; i < m_sidebar->count(); ++i) {
        m_sidebar->item(i)->setSizeHint(QSize(0, 52));
        m_sidebar->item(i)->setTextAlignment(Qt::AlignLeft | Qt::AlignVCenter);
    }
    m_sidebar->setCurrentRow(0);
    sidebarLayout->addWidget(m_sidebar);
    sidebarLayout->addStretch();

    QPushButton *logoutBtn = new QPushButton("Вийти", this);
    logoutBtn->setObjectName("logoutButton");
    logoutBtn->setCursor(Qt::PointingHandCursor);
    sidebarLayout->addWidget(logoutBtn);

    m_stackedWidget = new QStackedWidget(this);
    m_stackedWidget->setObjectName("mainStack");
    setupScreens();

    mainLayout->addWidget(sidebarContainer);
    mainLayout->addWidget(m_stackedWidget);

    connect(m_sidebar, &QListWidget::currentRowChanged, this, &MainWindow::onNavigationChanged);
    connect(logoutBtn, &QPushButton::clicked, this, &MainWindow::onLogoutClicked);

    fetchUserProfile();
}

void MainWindow::fetchUserProfile() {
    ApiClient::instance().get("/api/profile/", [this](const QJsonDocument &doc) {
        if (!doc.isObject()) return;
        QJsonObject obj = doc.object();

        if (obj.contains("doctor_profile") && !obj["doctor_profile"].isNull()) {
            QJsonObject doctorProfile = obj["doctor_profile"].toObject();
            m_currentDoctorId = doctorProfile["id"].toInt();
        } else {
            m_currentDoctorId = 0;
        }

        QString firstName = obj["first_name"].toString().trimmed();
        QString lastName = obj["last_name"].toString().trimmed();
        QString name = (firstName + " " + lastName).trimmed();
        if (name.isEmpty()) name = obj["username"].toString();
        
        m_userLabel->setText(QString("<b>%1</b><br><span style='color:#64748B;font-size:12px;'>Лікар-стоматолог</span>").arg(name));

        QString initials = "?";
        if (!firstName.isEmpty() && !lastName.isEmpty()) {
            initials = firstName.left(1).toUpper() + lastName.left(1).toUpper();
        } else if (!name.isEmpty()) {
            initials = name.left(1).toUpper();
        }

        QLabel *avatarLabel = this->findChild<QLabel*>("avatarLabel");
        if (avatarLabel) {
            avatarLabel->setText(initials);
        }

        QString username = obj["username"].toString();

        QSettings settings;
        QString themeKey = "theme_" + username;
        QString theme = settings.value(themeKey, "light").toString();

        applyTheme(theme);
    }, [](const QString&) {});
}


void MainWindow::setupScreens() {
    // Schedule
    ScheduleView *schedule = new ScheduleView(this);
    connect(schedule, &ScheduleView::addAppointmentRequested, this, &MainWindow::onAddAppointmentRequested);
    m_stackedWidget->addWidget(schedule);

    // Patients
    m_patientsView = new PatientsView(this);
    connect(m_patientsView, &PatientsView::patientSelected, this, &MainWindow::onPatientSelected);
    m_stackedWidget->addWidget(m_patientsView);

    // Patient detail
    m_patientDetailView = new PatientDetailView(this);
    connect(m_patientDetailView, &PatientDetailView::backClicked, [this]() {
        m_stackedWidget->setCurrentWidget(m_patientsView);
    });
    m_stackedWidget->addWidget(m_patientDetailView);

    // Schedule
    m_workingHoursView = new WorkingHoursView(this);
    m_stackedWidget->addWidget(m_workingHoursView);

    // Settings
    SettingsWidget *settings = new SettingsWidget(this);
    connect(settings, &SettingsWidget::themeChanged, this, &MainWindow::onThemeChanged);
    m_stackedWidget->addWidget(settings);
}

void MainWindow::onAddAppointmentRequested() {
    AddAppointmentDialog *dialog = new AddAppointmentDialog(m_currentDoctorId, this);
    connect(dialog, &AddAppointmentDialog::appointmentCreated, [this]() {
        ScheduleView *schedule = qobject_cast<ScheduleView*>(m_stackedWidget->currentWidget());
        if (schedule) {
            schedule->loadData();
        }
    });
    dialog->exec();
    dialog->deleteLater();
}

void MainWindow::onNavigationChanged(int index) {
    if (index == 1 && m_patientsView) {
        m_patientsView->displayPatients(QVector<Patient>());
    } else if (index == 2 && m_workingHoursView) {
        m_workingHoursView->loadData();
    }

    // Меню: 0=Розклад, 1=Пацієнти, 2=Графік, 3=Налаштування
    // Стек: 0=Schedule, 1=Patients, 2=PatientDetail, 3=WorkingHours, 4=Settings
    if (index == 0) m_stackedWidget->setCurrentIndex(0);
    else if (index == 1) m_stackedWidget->setCurrentIndex(1);
    else if (index == 2) m_stackedWidget->setCurrentIndex(3);
    else if (index == 3) m_stackedWidget->setCurrentIndex(4);
}

void MainWindow::onPatientSelected(int patientId) {
    if (m_patientDetailView) {
        m_patientDetailView->setPatientId(patientId);
        m_stackedWidget->setCurrentWidget(m_patientDetailView);
    }
}

void MainWindow::onLogoutClicked() {
    QJsonObject data;
    data["refresh"] = ApiClient::instance().getRefreshToken();

    ApiClient::instance().post("/api/logout/", data,
        [](const QJsonDocument&) { ApiClient::instance().logout(); },
        [](const QString&)       { ApiClient::instance().logout(); }
    );
}

void MainWindow::applyTheme(const QString& theme) {
    QString bgWindow, bgSidebar, textPrimary, textSecondary, border, highlightBg, highlightText, btnPrimary, btnHover;

    if (theme == "dark") {
        bgWindow = "#1E1E1E";
        bgSidebar = "#252526";
        textPrimary = "#E0E0E0";
        textSecondary = "#9BA1A6";
        border = "#3E3E42";
        highlightBg = "#37373D";
        highlightText = "#FFFFFF";
        btnPrimary = "#007ACC";
        btnHover = "#0098FF";
    } else {
        bgWindow = "#F8FAFC";
        bgSidebar = "#FFFFFF";
        textPrimary = "#0F172A";
        textSecondary = "#64748B";
        border = "#E2E8F0";
        highlightBg = "#EFF6FF";
        highlightText = "#2563EB";
        btnPrimary = "#2563EB";
        btnHover = "#1D4ED8";
    }

    QString qss = QString(R"(
        /* ── Global ── */
        QMainWindow { background-color: %1; color: %3; font-family: 'Segoe UI', Helvetica, sans-serif; font-size: 14px; }
        QLabel { color: %3; background-color: transparent; }

        /* ── Sidebar ── */
        #sidebarContainer { background-color: %2; border-right: 1px solid %5; }
        #logoLabel { font-size: 22px; font-weight: 800; color: %3; letter-spacing: 2px; padding: 10px; }
        #userLabel { font-size: 14px; color: %3; padding: 0 16px; }
        #avatarLabel { background-color: %6; color: %7; border-radius: 25px; font-size: 18px; font-weight: bold; }

        #sidebarMenu { border: none; background-color: transparent; outline: none; }
        #sidebarMenu::item { padding-left: 24px; color: %4; font-size: 14px; font-weight: 500; margin: 3px 12px; border-radius: 8px; }
        #sidebarMenu::item:selected { background-color: %6; color: %7; font-weight: 700; }
        #sidebarMenu::item:hover:!selected { background-color: %1; color: %3; }

        /* ── Top bar (detail view) ── */
        #detailTopBar { background-color: %2; border-bottom: 1px solid %5; }
        #detailHeaderTitle { font-size: 18px; font-weight: 700; color: %3; }

        /* ── Scroll ── */
        #mainStack { background-color: transparent; }
        QScrollArea { border: none; background-color: transparent; }
        QScrollArea > QWidget > QWidget { background-color: transparent; }

        /* ── Buttons ── */
        #backButton { background-color: transparent; color: %7; border: none; font-size: 14px; font-weight: 600; padding: 6px 12px; }
        #backButton:hover { background-color: %6; border-radius: 6px; }

        QPushButton#primaryButton { background-color: %8; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px; border: none; }
        QPushButton#primaryButton:hover  { background-color: %9; }

        QPushButton#secondaryButton { background-color: %2; color: %3; padding: 8px 16px; border-radius: 8px; font-weight: 600; border: 1px solid %5; }
        QPushButton#secondaryButton:hover { background-color: %1; }

        /* ── Time Slot Buttons (Add Appointment) ── */
        QPushButton#timeSlotBtn {
            background-color: %2;         /* Колір карток */
            border: 1px solid %5;         /* Стандартна рамка */
            border-radius: 6px;
            color: %3;                    /* Основний текст */
            font-size: 14px;
        }
        QPushButton#timeSlotBtn:hover {
            background-color: %6;         /* Виділення */
            border-color: %8;
        }
        QPushButton#timeSlotBtn:checked {
            background-color: %8;         /* Синій для обраного */
            border: 1px solid %8;
            color: white;                 /* Текст на синьому фоні завжди білий */
            font-weight: bold;
        }
        QPushButton#timeSlotBtn:pressed {
            background-color: %9;         /* Темно-синій при кліку */
        }

        #logoutButton { margin: 0 12px; padding: 10px; background-color: transparent; border: 1.5px solid #EF4444; color: #EF4444; border-radius: 8px; font-weight: bold; }
        #logoutButton:hover  { background-color: #FEF2F2; color: #DC2626; }

        /* ── Cards ── */
        #patientCard, #medicalCard, #actionsCard, #dentalCard, #appointmentCard {
            background-color: %2;
            border-radius: 12px;
            border: 1px solid %5;
        }

        /* ── Page title & Text ── */
        #pageTitle { font-size: 24px; font-weight: bold; color: %3; }
        #cardTime    { font-size: 20px; font-weight: bold; color: %3; }
        #cardPatient { font-size: 15px; font-weight: 600; color: %3; }
        #cardService { font-size: 13px; color: %4; }
        #totalSumLabel { font-size: 18px; font-weight: bold; color: %3; }

        /* ── Inputs & GroupBox (Settings) ── */
        QTextEdit, QListWidget, QLineEdit { background-color: %2; border: 1px solid %5; border-radius: 8px; padding: 8px; color: %3; selection-background-color: %8; selection-color: white; outline: none; }
        QTextEdit:focus, QLineEdit:focus { border: 1px solid %8; }

        QComboBox { background-color: %2; border: 1px solid %5; border-radius: 8px; padding: 6px 12px; color: %3; }
        QComboBox:focus, QComboBox:hover { border: 1px solid %8; }
        QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position: top right; width: 24px; border-left: 1px solid %5; border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
        QComboBox QAbstractItemView { background-color: %2; border: 1px solid %5; border-radius: 6px; color: %3; selection-background-color: %8; selection-color: white; outline: none; }

        QGroupBox { font-weight: bold; border: 2px solid %5; border-radius: 5px; margin-top: 1ex; color: %3; background-color: transparent;}
        QGroupBox::title { subcontrol-origin: margin; left: 10px; padding: 0 10px 0 10px; color: %3; }

        QCheckBox { color: %3; outline: none; }

        /* ── Tooth buttons ── */
        QPushButton[toothClass="true"] {
            background-color: transparent;
            color: %3;
            border-radius: 8px;
            font-weight: bold;
            font-size: 11px;

            border: 2px solid transparent;
        }

        /* Кольорові стани */
        QPushButton[toothClass="true"][toothState="healthy"], QPushButton[toothClass="true"][toothState="healthy"]:disabled { background: transparent; color:#059669; border:2px solid #10B981; }
        QPushButton[toothClass="true"][toothState="caries"], QPushButton[toothClass="true"][toothState="caries"]:disabled  { background: transparent; color:#DC2626; border:2px solid #EF4444; }
        QPushButton[toothClass="true"][toothState="filling"], QPushButton[toothClass="true"][toothState="filling"]:disabled { background: transparent; color:#2563EB; border:2px solid #3B82F6; }
        QPushButton[toothClass="true"][toothState="missing"], QPushButton[toothClass="true"][toothState="missing"]:disabled { background: transparent; color:#94A3B8; border:2px solid #CBD5E1; text-decoration:line-through; }
        QPushButton[toothClass="true"][toothState="crown"], QPushButton[toothClass="true"][toothState="crown"]:disabled   { background: transparent; color:#CA8A04; border:2px solid #EAB308; }

        /* Ховер якщо кнопка активна */
        QPushButton[toothClass="true"]:enabled:hover {
            background-color: rgba(128, 128, 128, 0.15);
        }

        /* Стиль для неактивного стану */
        QPushButton[toothClass="true"]:disabled {
            border: 2px solid transparent;
            opacity: 1.0;
        }

        /* ── Tabs ── */
        QTabWidget::pane { border: none; background-color: transparent; }
        QTabBar::tab { background-color: %2; color: %4; padding: 8px 16px; border: 1px solid %5; border-bottom: none; border-top-left-radius: 6px; border-top-right-radius: 6px; margin-right: 4px; }
        QTabBar::tab:selected { background-color: %1; color: %3; font-weight: bold; border-top: 2px solid %8; border-bottom: 1px solid %1; }
        QTabBar::tab:hover:!selected { background-color: %6; color: %3; }

        QTabWidget > QWidget { background-color: transparent; }

        QGroupBox QLabel, QTabWidget QLabel { color: %3; }

        /* ── Calendar Button ── */
        #calendarButton {
            background-color: %2;
            border: 1px solid %5;
            border-radius: 8px;
            font-size: 16px;
        }
        #calendarButton:hover {
            background-color: %6;
            border: 1px solid %8;
        }

        /* ── QGroupBox in settings ── */
        QGroupBox {
            border: 1px solid %5;
            border-radius: 8px;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            color: %3;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 10px;
            padding: 0 5px;
        }

        /* ── Theme Cards ── */
        QPushButton#themeCard {
            background-color: %2;
            border: 2px solid %5;
            border-radius: 12px;
            font-weight: 600;
            color: %3;
            font-size: 14px;
        }
        QPushButton#themeCard:hover {
            border-color: %8;
        }
        QPushButton#themeCard[active="true"] {
            border: 2px solid %8;
            background-color: %6;
        }

    )").arg(bgWindow, bgSidebar, textPrimary, textSecondary, border, highlightBg, highlightText, btnPrimary, btnHover);

    qApp->setStyleSheet(qss);
}

void MainWindow::onThemeChanged(const QString& theme) {
    applyTheme(theme);
}

// Знищення токена
void MainWindow::closeEvent(QCloseEvent *event) {
    onLogoutClicked();

    ApiClient::instance().logout();

    event->accept();
}
