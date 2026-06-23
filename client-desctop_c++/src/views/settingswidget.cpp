#include "settingswidget.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QGroupBox>
#include <QFrame>


SettingsWidget::SettingsWidget(QWidget *parent) : QWidget(parent) {
    m_tabWidget = new QTabWidget(this);

    setupProfileTab();
    setupClientTab();

    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->addWidget(m_tabWidget);

    loadProfileData();
}

void SettingsWidget::setupProfileTab() {
    QWidget *profileTab = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(profileTab);
    layout->setContentsMargins(20, 20, 20, 20);
    layout->setSpacing(20);

    // Профіль
    QGroupBox *profileGroup = new QGroupBox("Профіль лікаря");
    QFormLayout *profileLayout = new QFormLayout(profileGroup);
    profileLayout->setContentsMargins(10, 20, 10, 10);
    profileLayout->setSpacing(15);

    m_nameLabel = new QLabel();
    m_nameLabel->setStyleSheet("font-weight: bold;");
    profileLayout->addRow("ПІБ:", m_nameLabel);

    m_phoneLabel = new QLabel();
    profileLayout->addRow("Телефон:", m_phoneLabel);

    m_emailLabel = new QLabel();
    profileLayout->addRow("Email:", m_emailLabel);

    m_specialtyLabel = new QLabel("Лікар-стоматолог");
    profileLayout->addRow("Спеціалізація:", m_specialtyLabel);

    layout->addWidget(profileGroup);

    // Зміна пароля
    QGroupBox *passwordGroup = new QGroupBox("Зміна пароля");
    QFormLayout *passwordLayout = new QFormLayout(passwordGroup);
    passwordLayout->setContentsMargins(10, 20, 10, 10);
    passwordLayout->setSpacing(15);

    m_oldPasswordEdit = new QLineEdit(); m_oldPasswordEdit->setEchoMode(QLineEdit::Password);
    m_newPasswordEdit = new QLineEdit(); m_newPasswordEdit->setEchoMode(QLineEdit::Password);
    m_confirmPasswordEdit = new QLineEdit(); m_confirmPasswordEdit->setEchoMode(QLineEdit::Password);

    m_showPasswordsCheckBox = new QCheckBox("Показати паролі");
    m_showPasswordsCheckBox->setCursor(Qt::PointingHandCursor);
    connect(m_showPasswordsCheckBox, &QCheckBox::toggled, this, &SettingsWidget::onShowPasswordsToggled);

    passwordLayout->addRow("", m_showPasswordsCheckBox);
    passwordLayout->addRow("Старий пароль:", m_oldPasswordEdit);
    passwordLayout->addRow("Новий пароль:", m_newPasswordEdit);
    passwordLayout->addRow("Підтвердження:", m_confirmPasswordEdit);

    m_savePasswordBtn = new QPushButton("Зберегти новий пароль");
    m_savePasswordBtn->setObjectName("primaryButton");
    m_savePasswordBtn->setCursor(Qt::PointingHandCursor);
    connect(m_savePasswordBtn, &QPushButton::clicked, this, &SettingsWidget::onSavePasswordClicked);

    QHBoxLayout *btnLayout = new QHBoxLayout();
    btnLayout->addStretch();
    btnLayout->addWidget(m_savePasswordBtn);
    passwordLayout->addRow(btnLayout);

    layout->addWidget(passwordGroup);
    layout->addStretch();

    m_tabWidget->addTab(profileTab, "Профіль та Безпека");
}

void SettingsWidget::setupClientTab() {
    QWidget *clientTab = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(clientTab);
    layout->setContentsMargins(20, 20, 20, 20);

    QGroupBox *themeGroup = new QGroupBox("Оформлення");
    QVBoxLayout *themeLayout = new QVBoxLayout(themeGroup);
    themeLayout->setContentsMargins(15, 20, 15, 15);

    QHBoxLayout *cardsLayout = new QHBoxLayout();

    m_lightThemeBtn = new QPushButton("Світла");
    m_lightThemeBtn->setObjectName("themeCard");
    m_lightThemeBtn->setFixedSize(120, 80);

    m_darkThemeBtn = new QPushButton("Темна");
    m_darkThemeBtn->setObjectName("themeCard");
    m_darkThemeBtn->setFixedSize(120, 80);

    cardsLayout->addWidget(m_lightThemeBtn);
    cardsLayout->addWidget(m_darkThemeBtn);
    cardsLayout->addStretch();

    themeLayout->addLayout(cardsLayout);
    layout->addWidget(themeGroup);
    layout->addStretch();

    connect(m_lightThemeBtn, &QPushButton::clicked, [this](){ applyAndSaveTheme("light"); });
    connect(m_darkThemeBtn, &QPushButton::clicked, [this](){ applyAndSaveTheme("dark"); });

    m_tabWidget->addTab(clientTab, "Налаштування клієнта");
}

void SettingsWidget::updateThemeSelection(const QString &theme) {
    m_lightThemeBtn->setProperty("active", theme == "light");
    m_darkThemeBtn->setProperty("active", theme == "dark");
    m_lightThemeBtn->style()->unpolish(m_lightThemeBtn);
    m_lightThemeBtn->style()->polish(m_lightThemeBtn);
    m_darkThemeBtn->style()->unpolish(m_darkThemeBtn);
    m_darkThemeBtn->style()->polish(m_darkThemeBtn);
}

void SettingsWidget::loadProfileData() {
    ApiClient::instance().get("/api/profile/", [this](const QJsonDocument &doc) {
        if (!doc.isObject()) return;
        QJsonObject obj = doc.object();

        QString firstName = obj["first_name"].toString().trimmed();
        QString lastName = obj["last_name"].toString().trimmed();
        QString name = (firstName + " " + lastName).trimmed();
        if (name.isEmpty()) name = obj["username"].toString();
        m_nameLabel->setText(name);

        m_phoneLabel->setText(obj["phone"].toString());
        m_emailLabel->setText(obj["email"].toString());

        m_specialtyLabel->setText("Лікар-стоматолог");

        m_currentUsername = obj["username"].toString();

        QSettings settings;
        QString themeKey = "theme_" + m_currentUsername;
        QString theme = settings.value(themeKey, "light").toString();

        updateThemeSelection(theme);
    }, [](const QString&) {});
}

void SettingsWidget::onSavePasswordClicked() {
    QString oldPwd = m_oldPasswordEdit->text();
    QString newPwd = m_newPasswordEdit->text();
    QString confirmPwd = m_confirmPasswordEdit->text();

    if (oldPwd.isEmpty() || newPwd.isEmpty() || confirmPwd.isEmpty()) {
        QMessageBox::warning(this, "Помилка", "Будь ласка, заповніть всі поля.");
        return;
    }

    if (newPwd.length() < 8) {
        QMessageBox::warning(this, "Помилка", "Новий пароль повинен містити щонайменше 8 символів.");
        return;
    }

    if (newPwd != confirmPwd) {
        QMessageBox::warning(this, "Помилка", "Новий пароль та підтвердження не співпадають.");
        return;
    }

    ApiClient::instance().changePassword(oldPwd, newPwd,
        [this](const QJsonDocument&) {
            QMessageBox::information(this, "Успіх", "Пароль успішно змінено.");
            m_oldPasswordEdit->clear();
            m_newPasswordEdit->clear();
            m_confirmPasswordEdit->clear();
        },
        [this](const QString& error) {
            QMessageBox::warning(this, "Помилка", "Не вдалося змінити пароль: " + error);
        });
}

void SettingsWidget::applyAndSaveTheme(const QString &theme) {
    if (!m_currentUsername.isEmpty()) {
        QSettings settings;
        QString themeKey = "theme_" + m_currentUsername;
        settings.setValue(themeKey, theme);
    }

    updateThemeSelection(theme);
    emit themeChanged(theme);
}

void SettingsWidget::onShowPasswordsToggled(bool checked) {
    QLineEdit::EchoMode mode = checked ? QLineEdit::Normal : QLineEdit::Password;

    m_oldPasswordEdit->setEchoMode(mode);
    m_newPasswordEdit->setEchoMode(mode);
    m_confirmPasswordEdit->setEchoMode(mode);
}
