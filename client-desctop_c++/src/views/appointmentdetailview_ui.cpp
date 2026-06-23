#include "appointmentdetailview_ui.h"
#include "appointmentdetailview.h"
#include "../utils/uihelpers.h"

#include <QScrollArea>
#include <QHBoxLayout>
#include <QFrame>
#include <QMenu>
#include <QMessageBox>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>
#include <QGraphicsDropShadowEffect>
#include <QDateTime>
#include <QListWidget>
#include <QTextEdit>
#include <QPushButton>
#include <QLabel>
#include <QComboBox>
#include <QVBoxLayout>
#include <QStackedWidget>
#include <QGridLayout>

namespace AppointmentDetailViewUi {

void buildUi(AppointmentDetailView *view) {
    QVBoxLayout *root = new QVBoxLayout(view);
    root->setContentsMargins(0, 0, 0, 0);
    root->setSpacing(0);

    QWidget *topBar = new QWidget(view);
    topBar->setObjectName("detailTopBar");
    topBar->setFixedHeight(62);

    QHBoxLayout *topLay = new QHBoxLayout(topBar);
    topLay->setContentsMargins(24, 0, 24, 0);
    topLay->setSpacing(16);

    QPushButton *backBtn = new QPushButton("← Назад", topBar);
    backBtn->setObjectName("backButton");
    backBtn->setCursor(Qt::PointingHandCursor);
    QObject::connect(backBtn, &QPushButton::clicked, view, &AppointmentDetailView::backRequested);

    view->m_dateTimeLabel = new QLabel("", topBar);
    view->m_dateTimeLabel->setObjectName("detailHeaderTitle");

    view->m_statusBadge = new QLabel("", topBar);
    view->m_statusBadge->setFixedHeight(26);

    topLay->addWidget(backBtn);
    topLay->addSpacing(12);
    topLay->addWidget(view->m_dateTimeLabel);
    topLay->addStretch();
    topLay->addWidget(view->m_statusBadge);

    root->addWidget(topBar);

    QScrollArea *scroll = new QScrollArea(view);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);

    QWidget *body = new QWidget();
    QHBoxLayout *bodyLay = new QHBoxLayout(body);
    bodyLay->setContentsMargins(24, 24, 24, 24);
    bodyLay->setSpacing(20);
    bodyLay->setAlignment(Qt::AlignTop);

    QWidget *leftCol = new QWidget();
    QVBoxLayout *leftLay = new QVBoxLayout(leftCol);
    leftLay->setContentsMargins(0, 0, 0, 0);
    leftLay->setSpacing(16);
    leftLay->setAlignment(Qt::AlignTop);

    view->m_leftPanelStack = new QStackedWidget(leftCol);

    QWidget *infoWidget = new QWidget();
    QVBoxLayout *infoLay = new QVBoxLayout(infoWidget);
    infoLay->setContentsMargins(0, 0, 0, 0);
    infoLay->setSpacing(16);

    {
        QWidget *card = new QWidget();
        card->setObjectName("patientCard");
        addShadow(card);
        QVBoxLayout *lay = new QVBoxLayout(card);
        lay->setContentsMargins(20, 20, 20, 20);
        lay->setSpacing(10);

        QLabel *hdr = new QLabel("Запис на прийом", card);
        hdr->setStyleSheet("font-size:17px; font-weight:700;");
        lay->addWidget(hdr);
        lay->addWidget(hline());

        auto addRow = [&](const QString &field, QLabel *&ref) {
            QHBoxLayout *r = new QHBoxLayout();
            r->addWidget(fieldLbl(field + ":", card), 3);
            ref = valueLbl("", card);
            r->addWidget(ref, 7);
            lay->addLayout(r);
        };

        addRow("Пацієнт", view->m_patientNameLabel);
        addRow("Послуга", view->m_serviceLabel);
        addRow("Спеціалізація", view->m_doctorSpecialtyLabel);

        lay->addWidget(hline());

        QLabel *notesTitle = new QLabel("Примітки до запису:", card);
        notesTitle->setStyleSheet("font-size:13px;");
        lay->addWidget(notesTitle);
        view->m_notesInfoLabel = new QLabel("", card);
        view->m_notesInfoLabel->setWordWrap(true);
        view->m_notesInfoLabel->setObjectName("patientCard");
        lay->addWidget(view->m_notesInfoLabel);

        infoLay->addWidget(card);
    }
    view->m_leftPanelStack->addWidget(infoWidget);

    QWidget *medicalInputWidget = new QWidget();
    QVBoxLayout *medLay = new QVBoxLayout(medicalInputWidget);
    medLay->setContentsMargins(0, 0, 0, 0);
    medLay->setSpacing(16);
    {
        QWidget *card = new QWidget();
        card->setObjectName("patientCard");
        addShadow(card);
        QVBoxLayout *lay = new QVBoxLayout(card);
        lay->setContentsMargins(24, 24, 24, 24);
        lay->setSpacing(14);

        QLabel *hdr = new QLabel("Нотатки лікаря", card);
        hdr->setStyleSheet("font-size:15px; font-weight:700;");
        lay->addWidget(hdr);

        view->m_diagnosisEdit = new QTextEdit(card);
        view->m_diagnosisEdit->setPlaceholderText("Вкажіть діагноз для Treatment Record...");
        view->m_diagnosisEdit->setMinimumHeight(80);
        lay->addWidget(view->m_diagnosisEdit);

        QLabel *diagnosisHint = new QLabel("Діагноз потрібен для створення запису лікування.", card);
        diagnosisHint->setStyleSheet("font-size: 12px; margin-bottom: 8px;");
        lay->addWidget(diagnosisHint);

        view->m_doctorNotesEdit = new QTextEdit(card);
        view->m_doctorNotesEdit->setPlaceholderText("Опишіть скарги, діагноз або перебіг лікування...");
        view->m_doctorNotesEdit->setMinimumHeight(100);
        lay->addWidget(view->m_doctorNotesEdit);

        lay->addWidget(hline());

        QLabel *servicesHdr = new QLabel("Надані послуги", card);
        servicesHdr->setStyleSheet("font-size:15px; font-weight:700;");
        lay->addWidget(servicesHdr);

        view->m_treatmentsList = new QListWidget(card);
        view->m_treatmentsList->setSelectionMode(QAbstractItemView::MultiSelection);
        view->m_treatmentsList->setMinimumHeight(150);
        lay->addWidget(view->m_treatmentsList);

        view->m_totalLabel = new QLabel("Загальна сума: 0.00 грн", card);
        // view->m_totalLabel->setStyleSheet("font-size: 16px; font-weight: 800; color: #10B981; margin-top: 8px;");
        view->m_totalLabel->setAlignment(Qt::AlignRight);
        lay->addWidget(view->m_totalLabel);

        QObject::connect(view->m_treatmentsList, &QListWidget::itemSelectionChanged, view, [view]() {
            double currentTotal = 0.0;
            for (QListWidgetItem *it : view->m_treatmentsList->selectedItems()) {
                currentTotal += view->m_servicePrices.value(it->data(Qt::UserRole).toInt(), 0.0);
            }
            view->m_totalLabel->setText(QString("Загальна сума: %1 грн").arg(currentTotal, 0, 'f', 2));
        });

        medLay->addWidget(card);
    }
    view->m_leftPanelStack->addWidget(medicalInputWidget);
    leftLay->addWidget(view->m_leftPanelStack);

    {
        QWidget *card = new QWidget();
        card->setObjectName("patientCard");
        card->setProperty("isControlsCard", true);
        addShadow(card);
        QVBoxLayout *lay = new QVBoxLayout(card);
        lay->setContentsMargins(20, 20, 20, 20);
        lay->setSpacing(12);

        QLabel *hdr = new QLabel("Керування статусом", card);
        hdr->setStyleSheet("font-size:17px; font-weight:700;");
        lay->addWidget(hdr);
        lay->addWidget(hline());

        view->m_statusControlsStack = new QStackedWidget(card);

        QWidget *pageMod = new QWidget();
        QVBoxLayout *modLay = new QVBoxLayout(pageMod);
        modLay->setContentsMargins(0, 0, 0, 0);
        view->m_confirmBtn = new QPushButton("✓ Підтвердити запис", pageMod);
        view->m_confirmBtn->setCursor(Qt::PointingHandCursor);
        view->m_confirmBtn->setMinimumHeight(40);
        view->m_confirmBtn->setStyleSheet("background:#10B981; color:white; font-weight:600; border-radius:6px;");

        view->m_rejectBtn = new QPushButton("✕ Відхилити запис", pageMod);
        view->m_rejectBtn->setCursor(Qt::PointingHandCursor);
        view->m_rejectBtn->setMinimumHeight(40);

        modLay->addWidget(view->m_confirmBtn);
        modLay->addWidget(view->m_rejectBtn);
        view->m_statusControlsStack->addWidget(pageMod);

        QWidget *pageSched = new QWidget();
        QVBoxLayout *schedLay = new QVBoxLayout(pageSched);
        schedLay->setContentsMargins(0, 0, 0, 0);
        view->m_startBtn = new QPushButton("▶ Почати прийом", pageSched);
        view->m_startBtn->setCursor(Qt::PointingHandCursor);
        view->m_startBtn->setMinimumHeight(40);
        view->m_startBtn->setStyleSheet("background:#3B82F6; color:white; font-weight:600; border-radius:6px;");

        view->m_cancelBtn = new QPushButton("✕ Скасувати запис", pageSched);
        view->m_cancelBtn->setCursor(Qt::PointingHandCursor);
        view->m_cancelBtn->setMinimumHeight(40);

        schedLay->addWidget(view->m_startBtn);
        schedLay->addWidget(view->m_cancelBtn);
        view->m_statusControlsStack->addWidget(pageSched);

        QWidget *pageAct = new QWidget();
        QVBoxLayout *actLay = new QVBoxLayout(pageAct);
        actLay->setContentsMargins(0, 0, 0, 0);
        view->m_completeBtn = new QPushButton("✔ Завершити та Виставити Рахунок", pageAct);
        view->m_completeBtn->setCursor(Qt::PointingHandCursor);
        view->m_completeBtn->setMinimumHeight(40);
        view->m_completeBtn->setStyleSheet("background:#8B5CF6; color:white; font-weight:600; border-radius:6px;");

        actLay->addWidget(view->m_completeBtn);
        view->m_statusControlsStack->addWidget(pageAct);

        lay->addWidget(view->m_statusControlsStack);
        leftLay->addWidget(card);

        QObject::connect(view->m_confirmBtn, &QPushButton::clicked, view, &AppointmentDetailView::onConfirmClicked);
        QObject::connect(view->m_rejectBtn, &QPushButton::clicked, view, &AppointmentDetailView::onRejectClicked);
        QObject::connect(view->m_startBtn, &QPushButton::clicked, view, &AppointmentDetailView::onStartClicked);
        QObject::connect(view->m_cancelBtn, &QPushButton::clicked, view, &AppointmentDetailView::onCancelClicked);
        QObject::connect(view->m_completeBtn, &QPushButton::clicked, view, &AppointmentDetailView::onCompleteClicked);
    }

    leftLay->addStretch();

    QWidget *rightCol = new QWidget();
    QVBoxLayout *rightLay = new QVBoxLayout(rightCol);
    rightLay->setContentsMargins(0, 0, 0, 0);
    rightLay->setSpacing(16);
    rightLay->setAlignment(Qt::AlignTop);

    {
        QWidget *card = new QWidget();
        card->setObjectName("patientCard");
        addShadow(card);
        QVBoxLayout *lay = new QVBoxLayout(card);
        lay->setContentsMargins(24, 24, 24, 24);
        lay->setSpacing(24);

        QHBoxLayout *hdrLay = new QHBoxLayout();
        QLabel *hdrIcon = new QLabel("🦷", card);
        hdrIcon->setStyleSheet("font-size: 26px; background: transparent;");
        QLabel *hdrText = new QLabel("Зубна Формула (FDI)", card);
        hdrText->setStyleSheet("font-size:18px; font-weight:700;");
        hdrLay->addWidget(hdrIcon);
        hdrLay->addWidget(hdrText);
        hdrLay->addStretch();
        lay->addLayout(hdrLay);

        view->m_fdiHintLabel = new QLabel("❗ Карта пацієнта доступна лише для перегляду.", card);
        view->m_fdiHintLabel->setProperty("type", "subtitle");
        lay->addWidget(view->m_fdiHintLabel);

        QWidget *legendContainer = new QWidget();
        QHBoxLayout *legLay = new QHBoxLayout(legendContainer);
        legLay->setSpacing(16);
        legLay->setContentsMargins(0, 0, 0, 0);
        legLay->setAlignment(Qt::AlignCenter);

        legLay->addWidget(legendItem("#86EFAC", "Здоровий"));
        legLay->addWidget(legendItem("#FCA5A5", "Карієс"));
        legLay->addWidget(legendItem("#93C5FD", "Пломба"));
        legLay->addWidget(legendItem("#E2E8F0", "Видалений"));
        legLay->addWidget(legendItem("#D8B4FE", "Коронка"));
        legLay->addWidget(legendItem("#FDE047", "Імплант"));
        legLay->addWidget(legendItem("#CBD5E1", "Інше"));

        lay->addWidget(legendContainer);
        lay->setAlignment(legendContainer, Qt::AlignCenter);

        QWidget *gridW = new QWidget(card);
        view->m_gridLayout = new QGridLayout(gridW);
        view->m_gridLayout->setSpacing(8);
        view->m_gridLayout->setContentsMargins(0, 0, 0, 0);

        int col = 0;
        for (int i = 18; i >= 11; --i) {
            view->m_gridLayout->addWidget(view->createToothButton(i), 0, col);
            view->m_gridLayout->setColumnStretch(col, 1);
            col++;
        }

        QFrame *vLine1 = new QFrame();
        vLine1->setFrameShape(QFrame::VLine);
        vLine1->setStyleSheet("border-left: 2px dashed #E2E8F0;");
        view->m_gridLayout->addWidget(vLine1, 0, col);
        view->m_gridLayout->setAlignment(vLine1, Qt::AlignCenter);
        int centerCol = col;
        col++;

        for (int i = 21; i <= 28; ++i) {
            view->m_gridLayout->addWidget(view->createToothButton(i), 0, col);
            view->m_gridLayout->setColumnStretch(col, 1);
            col++;
        }

        QFrame *hLine = new QFrame();
        hLine->setFrameShape(QFrame::HLine);
        hLine->setStyleSheet("border-top: 2px dashed #E2E8F0; margin: 16px 0;");
        view->m_gridLayout->addWidget(hLine, 1, 0, 1, col);

        col = 0;
        for (int i = 48; i >= 41; --i) {
            view->m_gridLayout->addWidget(view->createToothButton(i), 2, col++);
        }

        QFrame *vLine2 = new QFrame();
        vLine2->setFrameShape(QFrame::VLine);
        vLine2->setStyleSheet("border-left: 2px dashed #E2E8F0;");
        view->m_gridLayout->addWidget(vLine2, 2, centerCol);
        view->m_gridLayout->setAlignment(vLine2, Qt::AlignCenter);
        col = centerCol + 1;

        for (int i = 31; i <= 38; ++i) {
            view->m_gridLayout->addWidget(view->createToothButton(i), 2, col++);
        }

        lay->addWidget(gridW);
        rightLay->addWidget(card);
    }

    rightLay->addStretch();
    bodyLay->addWidget(leftCol, 4);
    bodyLay->addWidget(rightCol, 6);

    scroll->setWidget(body);
    root->addWidget(scroll);
}

} // namespace AppointmentDetailViewUi
