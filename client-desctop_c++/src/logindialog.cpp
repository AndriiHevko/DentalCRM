#include "logindialog.h"
#include "services/apiclient.h"
#include <QJsonObject>
#include <QGraphicsDropShadowEffect>
#include <QAction>
#include <QIcon>
#include <QCheckBox>
#include <QJsonDocument>

LoginDialog::LoginDialog(QWidget *parent) : QDialog(parent) {
    setWindowTitle("Dental Clinic - Login");
    setFixedSize(420, 550);
    setWindowFlags(Qt::Dialog | Qt::FramelessWindowHint);
    setAttribute(Qt::WA_TranslucentBackground);

    QWidget *container = new QWidget(this);
    container->setObjectName("loginContainer");

    container->setStyleSheet(
        "QWidget#loginContainer { "
        "  background-color: #ffffff; "
        "  border-radius: 20px; "
        "} "
        "QLabel#loginTitle { "
        "  font-size: 26px; "
        "  font-weight: bold; "
        "  color: #1e293b; "
        "} "
        "QLineEdit#loginInput { "
        "  border: 2px solid #e2e8f0; "
        "  border-radius: 10px; "
        "  padding: 10px 15px; "
        "  font-size: 14px; "
        "  background-color: #f8fafc; "
        "  color: #334155; "
        "} "
        "QLineEdit#loginInput:focus { "
        "  border: 2px solid #3b82f6; "
        "  background-color: #ffffff; "
        "} "
        "QPushButton#primaryButton { "
        "  background-color: #2563eb; "
        "  color: white; "
        "  border-radius: 10px; "
        "  padding: 12px; "
        "  font-size: 15px; "
        "  font-weight: bold; "
        "} "
        "QPushButton#primaryButton:hover { "
        "  background-color: #1d4ed8; "
        "} "
        "QPushButton#primaryButton:disabled { "
        "  background-color: #94a3b8; "
        "} "
        "QPushButton#secondaryButton { "
        "  background: transparent; "
        "  color: #64748b; "
        "  font-size: 13px; "
        "  border: none; "
        "} "
        "QPushButton#secondaryButton:hover { "
        "  color: #1e293b; "
        "  text-decoration: underline; "
        "}"
        );

    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->addWidget(container);

    QVBoxLayout *layout = new QVBoxLayout(container);
    layout->setContentsMargins(45, 40, 45, 30);
    layout->setSpacing(15);

    // Логотип
    QLabel *logoLabel = new QLabel("🦷", this);
    logoLabel->setStyleSheet("font-size: 48px;");
    logoLabel->setAlignment(Qt::AlignCenter);

    QLabel *titleLabel = new QLabel("Вітаємо знову", this);
    titleLabel->setObjectName("loginTitle");
    titleLabel->setAlignment(Qt::AlignCenter);

    m_usernameEdit = new QLineEdit(this);
    m_usernameEdit->setPlaceholderText("Email або Телефон");
    m_usernameEdit->setObjectName("loginInput");

    m_passwordEdit = new QLineEdit(this);
    m_passwordEdit->setPlaceholderText("Пароль");
    m_passwordEdit->setEchoMode(QLineEdit::Password);
    m_passwordEdit->setObjectName("loginInput");

    // Чекбокс для відображення пароля
    QCheckBox *showPasswordCheckBox = new QCheckBox("Показати пароль", this);
    showPasswordCheckBox->setStyleSheet("QCheckBox { color: #64748b; font-size: 13px; }");
    showPasswordCheckBox->setCursor(Qt::PointingHandCursor);

    connect(showPasswordCheckBox, &QCheckBox::stateChanged, [this](int state) {
        if (state == Qt::Checked) {
            m_passwordEdit->setEchoMode(QLineEdit::Normal);
        } else {
            m_passwordEdit->setEchoMode(QLineEdit::Password);
        }
    });

    m_loginButton = new QPushButton("Увійти", this);
    m_loginButton->setObjectName("primaryButton");
    m_loginButton->setCursor(Qt::PointingHandCursor);

    m_statusLabel = new QLabel("", this);
    m_statusLabel->setObjectName("statusLabel");
    m_statusLabel->setAlignment(Qt::AlignCenter);
    m_statusLabel->setWordWrap(true);
    m_statusLabel->setStyleSheet("font-size: 13px; font-weight: 500;");

    QPushButton *closeButton = new QPushButton("Закрити", this);
    closeButton->setObjectName("secondaryButton");
    closeButton->setCursor(Qt::PointingHandCursor);

    layout->addWidget(logoLabel);
    layout->addWidget(titleLabel);
    layout->addSpacing(15);
    layout->addWidget(m_usernameEdit);
    layout->addWidget(m_passwordEdit);
    layout->addWidget(showPasswordCheckBox);
    layout->addSpacing(5);
    layout->addWidget(m_loginButton);
    layout->addWidget(m_statusLabel);
    layout->addStretch();
    layout->addWidget(closeButton);

    connect(m_loginButton, &QPushButton::clicked, this, &LoginDialog::onLoginClicked);
    connect(closeButton, &QPushButton::clicked, this, &QDialog::reject);

    QGraphicsDropShadowEffect *shadow = new QGraphicsDropShadowEffect(this);
    shadow->setBlurRadius(30);
    shadow->setXOffset(0);
    shadow->setYOffset(10);
    shadow->setColor(QColor(0, 0, 0, 60));
    container->setGraphicsEffect(shadow);
}

void LoginDialog::onLoginClicked() {
    QString username = m_usernameEdit->text();
    QString password = m_passwordEdit->text();

    if (username.isEmpty() || password.isEmpty()) {
        m_statusLabel->setText("Будь ласка, заповніть усі поля");
        m_statusLabel->setStyleSheet("color: #ef4444;");
        return;
    }

    m_loginButton->setEnabled(false);
    m_statusLabel->setText("Перевірка даних...");
    m_statusLabel->setStyleSheet("color: #3b82f6;");

    QJsonObject data;
    data["username"] = username;
    data["password"] = password;

    ApiClient::instance().post("/api/desktop/login/", data, [this](const QJsonDocument &doc) {
            QJsonObject obj = doc.object();
            QString access = obj["access"].toString();
            QString refresh = obj["refresh"].toString();

            ApiClient::instance().setTokens(access, refresh);
            emit loginSuccessful();

            m_loginButton->setEnabled(true);
            m_usernameEdit->clear();
            m_passwordEdit->clear();
            m_statusLabel->clear();

            accept();
        }, [this](const QString &error) {
               m_loginButton->setEnabled(true);

               QString cleanMessage = error;

               int jsonStart = error.indexOf('{');
               int jsonEnd = error.lastIndexOf('}');

               if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
                   QString jsonString = error.mid(jsonStart, jsonEnd - jsonStart + 1);
                   QJsonDocument errorDoc = QJsonDocument::fromJson(jsonString.toUtf8());

                   if (!errorDoc.isNull() && errorDoc.isObject()) {
                       QJsonObject errorObj = errorDoc.object();
                       if (errorObj.contains("detail")) {
                           cleanMessage = errorObj["detail"].toString();
                       }
                   }
               }

               m_statusLabel->setText(cleanMessage);
               m_statusLabel->setStyleSheet("color: #ef4444;");
            }
    );
}
