#include "scheduleview_ui.h"
#include "scheduleview.h"
#include "appointmentdetailview.h"
#include "../controllers/schedulecontroller.h"
#include "../models/models.h"

#include <QLabel>
#include <QPushButton>
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QFrame>
#include <QScrollArea>
#include <QGraphicsDropShadowEffect>
#include <QCalendarWidget>
#include <QMenu>
#include <QWidgetAction>
#include <QLineEdit>
#include <QDate>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>
#include <QJsonValue>
#include <cmath>
#include <algorithm>
#include <QTimer>

namespace ScheduleViewUi {

void buildUi(ScheduleView *view) {
    QVBoxLayout *rootLayout = new QVBoxLayout(view);
    rootLayout->setContentsMargins(0, 0, 0, 0);
    rootLayout->setSpacing(0);

    view->m_stack = new QStackedWidget(view);
    view->m_listPage = new QWidget(view->m_stack);
    QVBoxLayout *listLayout = new QVBoxLayout(view->m_listPage);
    listLayout->setContentsMargins(30, 30, 30, 30);
    listLayout->setSpacing(20);

    view->m_calendarMenu = new QMenu(view);
    view->m_calendarMenu->setAttribute(Qt::WA_TranslucentBackground);
    QGraphicsDropShadowEffect *menuShadow = new QGraphicsDropShadowEffect();
    menuShadow->setBlurRadius(15);
    menuShadow->setXOffset(0);
    menuShadow->setYOffset(5);
    menuShadow->setColor(QColor(0, 0, 0, 60));
    view->m_calendarMenu->setGraphicsEffect(menuShadow);
    view->m_calendarMenu->setStyleSheet("QMenu { background: #334155; border: 1px solid #475569; border-radius: 12px; }");

    QWidget *calendarContainer = new QWidget();
    QVBoxLayout *calLayout = new QVBoxLayout(calendarContainer);
    calLayout->setContentsMargins(10, 10, 10, 10);
    calLayout->setSpacing(10);

    view->m_calendar = new QCalendarWidget();
    view->m_calendar->setGridVisible(false);
    view->m_calendar->setVerticalHeaderFormat(QCalendarWidget::NoVerticalHeader);
    view->m_calendar->setFixedSize(300, 260);
    view->m_calendar->setMinimumDate(QDate::currentDate().addYears(-10));
    view->m_calendar->setMaximumDate(QDate::currentDate().addYears(5));
    view->m_calendar->setStyleSheet(
        "QCalendarWidget { background-color: #334155; border: none; }"
        "#qt_calendar_navigationbar { background-color: #334155; border-bottom: 1px solid #475569; border-top-left-radius: 8px; border-top-right-radius: 8px; }"
        "QCalendarWidget QAbstractItemView:enabled { color: #FFFFFF; background-color: #334155; selection-background-color: #10B981; selection-color: white; }"
        "QCalendarWidget QAbstractItemView:disabled { color: #64748B; }"
        "QCalendarWidget QToolButton { color: #FFFFFF; font-weight: 600; background-color: transparent; border: none; }"
        "QCalendarWidget QToolButton:hover { background-color: #475569; border-radius: 4px; }"
        "QCalendarWidget QMenu { background-color: #334155; color: #FFFFFF; border: 1px solid #475569; }"
        "QCalendarWidget QSpinBox { background: #475569; color: #FFFFFF; selection-background-color: #10B981; }"
        "QCalendarWidget QToolButton::menu-indicator { image: none; }"
    );
    QObject::connect(view->m_calendar, &QCalendarWidget::clicked, view, &ScheduleView::onDateSelected);

    QPushButton *todayBtn = new QPushButton("Сьогодні");
    todayBtn->setFixedHeight(32);
    todayBtn->setCursor(Qt::PointingHandCursor);
    todayBtn->setStyleSheet(
        "QPushButton { background: #475569; color: #FFFFFF; border: none; border-radius: 6px; font-weight: 500; }"
        "QPushButton:hover { background: #10B981; }"
    );
    QObject::connect(todayBtn, &QPushButton::clicked, view, &ScheduleView::selectToday);

    calLayout->addWidget(view->m_calendar);
    calLayout->addWidget(todayBtn);

    QWidgetAction *calendarAction = new QWidgetAction(view->m_calendarMenu);
    calendarAction->setDefaultWidget(calendarContainer);
    view->m_calendarMenu->addAction(calendarAction);

    QHBoxLayout *headerRow = new QHBoxLayout();
    QLabel *title = new QLabel("Мій розклад", view->m_listPage);
    title->setObjectName("pageTitle");

    view->m_searchInput = new QLineEdit(view->m_listPage);
    view->m_searchInput->setPlaceholderText("Пошук пацієнта...");
    view->m_searchInput->setFixedWidth(200);
    // Затримка пошуку
    QTimer *searchTimer = new QTimer(view);
    searchTimer->setSingleShot(true);
    searchTimer->setInterval(1000);

    QObject::connect(view->m_searchInput, &QLineEdit::textChanged, [view, searchTimer](const QString &text) {
        view->m_searchQuery = text;
        searchTimer->start();
    });

    QObject::connect(searchTimer, &QTimer::timeout, view, &ScheduleView::loadData);

    view->m_addAppointmentBtn = new QPushButton(" Додати запис", view->m_listPage);
    view->m_addAppointmentBtn->setObjectName("primaryButton");
    view->m_addAppointmentBtn->setIcon(QIcon(":/icons/add.png"));
    view->m_addAppointmentBtn->setCursor(Qt::PointingHandCursor);
    QObject::connect(view->m_addAppointmentBtn, &QPushButton::clicked, view, &ScheduleView::onAddAppointmentClicked);

    view->m_dateLabel = new QLabel(view->m_selectedDate.toString("dddd, d MMMM yyyy"), view->m_listPage);
    view->m_dateLabel->setStyleSheet("color:#64748B; font-size:16px; text-transform: capitalize;");

    view->m_calendarBtn = new QPushButton("📅", view->m_listPage);
    view->m_calendarBtn->setObjectName("calendarButton");
    view->m_calendarBtn->setCursor(Qt::PointingHandCursor);
    view->m_calendarBtn->setFixedSize(36, 36);
    QObject::connect(view->m_calendarBtn, &QPushButton::clicked, [view]() {
        int menuWidth = view->m_calendarMenu->sizeHint().width();
        QPoint btnRightEdge = view->m_calendarBtn->mapToGlobal(QPoint(view->m_calendarBtn->width(), view->m_calendarBtn->height() + 4));
        QPoint pos(btnRightEdge.x() - menuWidth, btnRightEdge.y());
        view->m_calendarMenu->popup(pos);
    });

    headerRow->addWidget(title);
    headerRow->addSpacing(24);
    headerRow->addWidget(view->m_searchInput);
    headerRow->addSpacing(16);
    headerRow->addWidget(view->m_addAppointmentBtn);
    headerRow->addStretch();
    headerRow->addWidget(view->m_dateLabel);
    headerRow->addWidget(view->m_calendarBtn);
    listLayout->addLayout(headerRow);

    QScrollArea *scroll = new QScrollArea(view->m_listPage);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    scroll->setStyleSheet("QScrollArea { background: transparent; }");

    QWidget *cardsContainer = new QWidget();
    cardsContainer->setStyleSheet("background: transparent;");
    view->m_cardsLayout = new QVBoxLayout(cardsContainer);
    view->m_cardsLayout->setSpacing(14);
    view->m_cardsLayout->setContentsMargins(0, 0, 0, 0);
    view->m_cardsLayout->setAlignment(Qt::AlignTop);

    scroll->setWidget(cardsContainer);
    listLayout->addWidget(scroll);

    view->m_paginationContainer = new QWidget(view->m_listPage);
    view->m_paginationLayout = new QHBoxLayout(view->m_paginationContainer);
    view->m_paginationLayout->setAlignment(Qt::AlignCenter);
    view->m_paginationLayout->setContentsMargins(0, 10, 0, 0);
    listLayout->addWidget(view->m_paginationContainer);

    view->m_detailView = new AppointmentDetailView(view->m_stack);
    QObject::connect(view->m_detailView, &AppointmentDetailView::backRequested,
                     view, &ScheduleView::showList);
    QObject::connect(view->m_detailView, &AppointmentDetailView::appointmentStatusChanged,
                     view, [view]() { view->loadData(); });

    view->m_stack->addWidget(view->m_listPage);
    view->m_stack->addWidget(view->m_detailView);
    view->m_stack->setCurrentIndex(0);

    rootLayout->addWidget(view->m_stack);
}

void renderPage(ScheduleView *view) {
    QLayoutItem *child;
    while ((child = view->m_cardsLayout->takeAt(0)) != nullptr) {
        if (child->widget()) child->widget()->deleteLater();
        delete child;
    }

    if (view->m_currentData.isEmpty()) {
        QLabel *empty = new QLabel("На цей день записів немає");
        empty->setStyleSheet("color:#94A3B8; font-size:16px;");
        empty->setAlignment(Qt::AlignCenter);
        view->m_cardsLayout->addWidget(empty);
        view->m_cardsLayout->addStretch();
        return;
    }

    int startIdx = (view->m_currentPage - 1) * view->ITEMS_PER_PAGE;
    int endIdx = qMin(startIdx + view->ITEMS_PER_PAGE, (int)view->m_currentData.size());

    for (int i = startIdx; i < endIdx; ++i) {
        Appointment a = Appointment::fromJson(view->m_currentData[i].toObject());

        QFrame *card = new QFrame();
        card->setObjectName("patientCard");
        card->setFixedHeight(90);
        bool isDone = (a.status == "done");
        card->setCursor(isDone ? Qt::ArrowCursor : Qt::PointingHandCursor);
        if (isDone) {
            card->setStyleSheet("QFrame:hover { background: transparent; }");
        }

        QGraphicsDropShadowEffect *shadow = new QGraphicsDropShadowEffect();
        shadow->setBlurRadius(12);
        shadow->setXOffset(0);
        shadow->setYOffset(3);
        shadow->setColor(QColor(0, 0, 0, 18));
        card->setGraphicsEffect(shadow);

        QHBoxLayout *cardLayout = new QHBoxLayout(card);
        cardLayout->setContentsMargins(0, 0, 20, 0);
        cardLayout->setSpacing(0);

        QWidget *statusLine = new QWidget(card);
        statusLine->setStyleSheet(
            QString("background:%1; border-top-left-radius:12px;"
                    "border-bottom-left-radius:12px;").arg(a.statusColor()));
        statusLine->setFixedWidth(8);
        cardLayout->addWidget(statusLine);
        cardLayout->addSpacing(18);

        QVBoxLayout *timeCol = new QVBoxLayout();
        QLabel *timeLabel = new QLabel(QString("%1 - %2").arg(a.dateTime.toString("HH:mm"), a.endTime().toString("HH:mm")));
        timeLabel->setObjectName("cardTime");
        QLabel *dateLabel2 = new QLabel(a.dateTime.toString("dd.MM.yyyy"));
        dateLabel2->setStyleSheet("color:#64748B; font-size:12px;");
        timeCol->addWidget(timeLabel);
        timeCol->addWidget(dateLabel2);
        timeCol->setAlignment(Qt::AlignVCenter);
        cardLayout->addLayout(timeCol);
        cardLayout->addSpacing(30);

        QVBoxLayout *infoCol = new QVBoxLayout();
        QHBoxLayout *nameRow = new QHBoxLayout();
        nameRow->setContentsMargins(0, 0, 0, 0);
        QLabel *nameLabel = new QLabel(
            a.patientName.isEmpty() ? "(Пацієнт не вказаний)" : a.patientName);
        nameLabel->setObjectName("cardPatient");

        nameRow->addWidget(nameLabel);

        if (!a.patientPhone.isEmpty()) {
            nameRow->addSpacing(8);
            QLabel *phoneIcon = new QLabel("📞");
            phoneIcon->setStyleSheet("color:#EF4444; font-size:14px;");
            nameRow->addWidget(phoneIcon);
            QLabel *phoneLabel = new QLabel(a.patientPhone);
            phoneLabel->setStyleSheet("color:#64748B; font-size:12px;");
            nameRow->addWidget(phoneLabel);
        }

        nameRow->addStretch();

        QLabel *svcLabel = new QLabel(
            a.serviceName.isEmpty() ? "Послуга не вказана" : a.serviceName);
        svcLabel->setObjectName("cardService");

        infoCol->addLayout(nameRow);
        infoCol->addWidget(svcLabel);
        infoCol->setAlignment(Qt::AlignVCenter);
        cardLayout->addLayout(infoCol);
        cardLayout->addStretch();

        QLabel *badge = new QLabel();
        badge->setFixedHeight(24);
        if (a.status == "approved" || a.status == "scheduled") {
            badge->setText("Заплановано");
            badge->setStyleSheet("background:#D1FAE5; color:#065F46; border-radius:10px; padding:2px 10px; font-size:12px;");
        } else if (a.status == "pending") {
            badge->setText("Очікує");
            badge->setStyleSheet("background:#FEF3C7; color:#92400E; border-radius:10px; padding:2px 10px; font-size:12px;");
        } else if (a.status == "rejected" || a.status == "cancelled") {
            badge->setText("Відхилено");
            badge->setStyleSheet("background:#FEE2E2; color:#991B1B; border-radius:10px; padding:2px 10px; font-size:12px;");
        } else if (a.status == "in_progress") {
            badge->setText("В процесі");
            badge->setStyleSheet("background:#E0E7FF; color:#3730A3; border-radius:10px; padding:2px 10px; font-size:12px;");
        } else if (a.status == "done") {
            badge->setText("Завершено");
            badge->setStyleSheet("background:#F1F5F9; color:#475569; border-radius:10px; padding:2px 10px; font-size:12px;");
        }
        cardLayout->addWidget(badge, 0, Qt::AlignVCenter);
        cardLayout->addSpacing(14);

        QLabel *arrow = new QLabel("›");
        arrow->setStyleSheet("color:#CBD5E1; font-size:24px;");
        cardLayout->addWidget(arrow, 0, Qt::AlignVCenter);

        if (!isDone) {
            QPushButton *overlay = new QPushButton(card);
            overlay->setFlat(true);
            overlay->setStyleSheet("background:transparent; border:none;");
            overlay->setGeometry(0, 0, 9999, 9999);
            overlay->raise();
            overlay->setCursor(Qt::PointingHandCursor);
            Appointment captured = a;
            QObject::connect(overlay, &QPushButton::clicked, [view, captured]() {
                view->showDetail(captured);
            });
        }

        // if (startBtn) startBtn->raise();

        view->m_cardsLayout->addWidget(card);
    }
    view->m_cardsLayout->addStretch();
}

void updatePaginationUi(ScheduleView *view) {
    QLayoutItem *child;
    while ((child = view->m_paginationLayout->takeAt(0)) != nullptr) {
        if (child->widget()) child->widget()->deleteLater();
        delete child;
    }

    int totalPages = std::ceil((double)view->m_currentData.size() / view->ITEMS_PER_PAGE);

    if (totalPages <= 1) {
        view->m_paginationContainer->hide();
        return;
    }

    view->m_paginationContainer->show();

    QString baseStyle = "QPushButton { border-radius: 16px; font-size: 14px; font-weight: 500; }";
    QString activeStyle = baseStyle + "QPushButton { background-color: #10B981; color: white; }";
    QString inactiveStyle = baseStyle + "QPushButton { background-color: #F1F5F9; color: #64748B; }"
                                        "QPushButton:hover { background-color: #E2E8F0; }";
    QString disabledStyle = baseStyle + "QPushButton { background-color: transparent; color: #CBD5E1; }";

    QPushButton *prevBtn = new QPushButton("‹");
    prevBtn->setFixedSize(32, 32);
    if (view->m_currentPage == 1) {
        prevBtn->setStyleSheet(disabledStyle);
        prevBtn->setEnabled(false);
    } else {
        prevBtn->setStyleSheet(inactiveStyle);
        QObject::connect(prevBtn, &QPushButton::clicked, [view]() { view->setPage(view->m_currentPage - 1); });
    }
    view->m_paginationLayout->addWidget(prevBtn);

    for (int i = 1; i <= totalPages; ++i) {
        QPushButton *pageBtn = new QPushButton(QString::number(i));
        pageBtn->setFixedSize(32, 32);

        if (i == view->m_currentPage) {
            pageBtn->setStyleSheet(activeStyle);
        } else {
            pageBtn->setStyleSheet(inactiveStyle);
            QObject::connect(pageBtn, &QPushButton::clicked, [view, i]() { view->setPage(i); });
        }
        view->m_paginationLayout->addWidget(pageBtn);
    }

    QPushButton *nextBtn = new QPushButton("›");
    nextBtn->setFixedSize(32, 32);
    if (view->m_currentPage == totalPages) {
        nextBtn->setStyleSheet(disabledStyle);
        nextBtn->setEnabled(false);
    } else {
        nextBtn->setStyleSheet(inactiveStyle);
        QObject::connect(nextBtn, &QPushButton::clicked, [view]() { view->setPage(view->m_currentPage + 1); });
    }
    view->m_paginationLayout->addWidget(nextBtn);
}

} // namespace ScheduleViewUi
