#include "patientsview.h"
#include "../controllers/patientscontroller.h"
#include "../utils/uihelpers.h" // Для addShadow()
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QScrollArea>
#include <QGraphicsDropShadowEffect>
#include <cmath>

PatientsView::PatientsView(QWidget *parent)
    : QWidget(parent) {
    m_controller = new PatientsController(this);
    m_controller->setView(this);
    setupUi();
    applyStyles();
}

void PatientsView::setupUi() {
    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(30, 30, 30, 30);
    mainLayout->setSpacing(20);

    QLabel *titleLabel = new QLabel("👥 Пацієнти", this);
    titleLabel->setObjectName("pageTitle"); // Замість setStyleSheet з кольором
    mainLayout->addWidget(titleLabel);

    m_searchInput = new QLineEdit(this);
    m_searchInput->setPlaceholderText("Пошук за ПІБ або телефоном...");
    m_searchInput->setObjectName("searchInput");
    m_searchInput->setMinimumHeight(44);
    connect(m_searchInput, &QLineEdit::textChanged, this, &PatientsView::onSearchTextChanged);
    mainLayout->addWidget(m_searchInput);

    QScrollArea *scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setFrameShape(QFrame::NoFrame);
    scrollArea->setStyleSheet("QScrollArea { background: transparent; }");

    m_patientsContainer = new QWidget();
    m_patientsContainer->setStyleSheet("background: transparent;");
    m_patientsLayout = new QVBoxLayout(m_patientsContainer);
    m_patientsLayout->setSpacing(14);
    m_patientsLayout->setContentsMargins(0, 0, 0, 0);
    m_patientsLayout->setAlignment(Qt::AlignTop);

    scrollArea->setWidget(m_patientsContainer);
    mainLayout->addWidget(scrollArea);

    m_messageLabel = new QLabel(this);
    m_messageLabel->setAlignment(Qt::AlignCenter);
    m_messageLabel->setStyleSheet("color: #64748b; font-size: 16px;");
    m_messageLabel->hide();
    mainLayout->addWidget(m_messageLabel);

    m_paginationContainer = new QWidget(this);
    m_paginationLayout = new QHBoxLayout(m_paginationContainer);
    m_paginationLayout->setAlignment(Qt::AlignCenter);
    m_paginationLayout->setContentsMargins(0, 10, 0, 0);
    mainLayout->addWidget(m_paginationContainer);
}

void PatientsView::applyStyles() {
    // setStyleSheet(R"(
    //     QWidget { background-color: #f8fafc; }
    //     #searchInput { padding: 8px 16px; font-size: 15px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: white; color: #1e293b; }
    //     #searchInput:focus { border: 2px solid #3b82f6; outline: none; }
    // )");
}

void PatientsView::onSearchTextChanged(const QString &text) {
    emit searchQueryChanged(text);
    m_controller->searchPatients(text);
}

void PatientsView::displayPatients(const QVector<Patient> &patients) {
    m_allPatients = patients;
    m_currentPage = 1;

    if (patients.isEmpty()) {
        if (m_searchInput->text().isEmpty()) {
            m_messageLabel->setText("Немає пацієнтів у базі");
        } else {
            m_messageLabel->setText("Пацієнтів не знайдено");
        }
        m_messageLabel->show();
    } else {
        m_messageLabel->hide();
    }

    renderPage();
    updatePaginationUi();
}

void PatientsView::setPage(int page) {
    m_currentPage = page;
    renderPage();
    updatePaginationUi();
}

void PatientsView::renderPage() {
    while (QLayoutItem *item = m_patientsLayout->takeAt(0)) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    int startIdx = (m_currentPage - 1) * ITEMS_PER_PAGE;
    int endIdx = qMin(startIdx + ITEMS_PER_PAGE, (int)m_allPatients.size());

    for (int i = startIdx; i < endIdx; ++i) {
        const Patient &patient = m_allPatients[i];
        QFrame *card = new QFrame();
        card->setObjectName("patientCard");
        card->setFixedHeight(90);
        addShadow(card);

        QHBoxLayout *cardLayout = new QHBoxLayout(card);
        cardLayout->setContentsMargins(20, 0, 20, 0);

        QLabel *avatar = new QLabel("👤");
        avatar->setFixedSize(42, 42);
        avatar->setObjectName("avatarLabel");
        avatar->setAlignment(Qt::AlignCenter);
        cardLayout->addWidget(avatar);
        cardLayout->addSpacing(15);

        QVBoxLayout *infoCol = new QVBoxLayout();
        infoCol->setAlignment(Qt::AlignVCenter);

        QLabel *nameLabel = new QLabel(patient.fullName());
        nameLabel->setObjectName("cardTime");
        infoCol->addWidget(nameLabel);

        QLabel *phoneLabel = new QLabel(QString("📞 %1  |  ID: %2").arg(patient.phoneNumber.isEmpty() ? "—" : patient.phoneNumber).arg(patient.id));
        phoneLabel->setObjectName("cardService");
        infoCol->addWidget(phoneLabel);

        cardLayout->addLayout(infoCol);
        cardLayout->addStretch();

        QLabel *arrow = new QLabel("›");
        arrow->setObjectName("cardTime");

        QPushButton *overlay = new QPushButton(card);
        overlay->setFlat(true);
        overlay->setStyleSheet("background:transparent; border:none;");
        overlay->setGeometry(0, 0, 9999, 9999);
        overlay->setCursor(Qt::PointingHandCursor);

        int pId = patient.id;
        connect(overlay, &QPushButton::clicked, [this, pId]() { emit patientSelected(pId); });

        m_patientsLayout->addWidget(card);
    }
    m_patientsLayout->addStretch();
}

void PatientsView::updatePaginationUi() {
    while (QLayoutItem *child = m_paginationLayout->takeAt(0)) {
        if (child->widget()) child->widget()->deleteLater();
        delete child;
    }

    int totalPages = std::ceil((double)m_allPatients.size() / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
        m_paginationContainer->hide();
        return;
    }
    m_paginationContainer->show();

    QString activeStyle = "QPushButton { background-color: #10B981; color: white; border-radius: 16px; font-weight: bold; }";
    QString inactiveStyle = "QPushButton { border-radius: 16px; font-weight: 500; }";
    QString disabledStyle = "QPushButton { background-color: transparent; color: #888888; border-radius: 16px; border: none; }";

    QPushButton *prevBtn = new QPushButton("‹");
    prevBtn->setFixedSize(32, 32);
    if (m_currentPage == 1) {
        prevBtn->setStyleSheet(disabledStyle); prevBtn->setEnabled(false);
    } else {
        prevBtn->setStyleSheet(inactiveStyle);
        connect(prevBtn, &QPushButton::clicked, [this]() { setPage(m_currentPage - 1); });
    }
    m_paginationLayout->addWidget(prevBtn);

    for (int i = 1; i <= totalPages; ++i) {
        QPushButton *pageBtn = new QPushButton(QString::number(i));
        pageBtn->setFixedSize(32, 32);
        pageBtn->setStyleSheet(i == m_currentPage ? activeStyle : inactiveStyle);
        if (i != m_currentPage) connect(pageBtn, &QPushButton::clicked, [this, i]() { setPage(i); });
        m_paginationLayout->addWidget(pageBtn);
    }

    QPushButton *nextBtn = new QPushButton("›");
    nextBtn->setFixedSize(32, 32);
    if (m_currentPage == totalPages) {
        nextBtn->setStyleSheet(disabledStyle); nextBtn->setEnabled(false);
    } else {
        nextBtn->setStyleSheet(inactiveStyle);
        connect(nextBtn, &QPushButton::clicked, [this]() { setPage(m_currentPage + 1); });
    }
    m_paginationLayout->addWidget(nextBtn);
}

void PatientsView::displayError(const QString &error) {
    m_messageLabel->setText(QString("Помилка: %1").arg(error));
    m_messageLabel->setStyleSheet("color: #dc2626; font-size: 14px;");
    m_messageLabel->show();
}

void PatientsView::showEvent(QShowEvent *event) {
    QWidget::showEvent(event);

    if (m_controller && m_searchInput) {
        m_controller->performSearch(m_searchInput->text());
    }
}
