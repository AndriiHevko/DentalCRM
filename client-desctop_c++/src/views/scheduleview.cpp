#include "scheduleview.h"
#include "scheduleview_ui.h"
#include "appointmentdetailview.h"
#include "../controllers/schedulecontroller.h"
#include "../screens/addappointmentdialog.h"
#include "../models/models.h"

#include <QLabel>
#include <QPushButton>
#include <QHBoxLayout>
#include <QFrame>
#include <QScrollArea>
#include <QGraphicsDropShadowEffect>
#include <QDate>
#include <QJsonObject>
#include <QJsonDocument>
#include <QWidgetAction>
#include <QLineEdit>
#include <math.h>
#include <algorithm>

ScheduleView::ScheduleView(QWidget *parent) : QWidget(parent) {
    m_selectedDate = QDate::currentDate();
    m_controller = new ScheduleController(this);
    setupUi();
}

void ScheduleView::setupUi() {
    ScheduleViewUi::buildUi(this);
}

void ScheduleView::selectToday() {
    QDate today = QDate::currentDate();
    m_calendar->setSelectedDate(today);
    onDateSelected(today);
}

void ScheduleView::showEvent(QShowEvent *event) {
    QWidget::showEvent(event);
    showList();
}

void ScheduleView::showList() {
    m_stack->setCurrentIndex(0);
    loadData();
}

void ScheduleView::showDetail(const Appointment &appt) {
    m_detailView->loadAppointment(appt);
    m_stack->setCurrentIndex(1);
}

// Валідація в onDateSelected
void ScheduleView::onDateSelected(const QDate &date) {
    if (date.dayOfWeek() == Qt::Sunday) {
    }

    m_selectedDate = date;
    m_dateLabel->setText(m_selectedDate.toString("dddd, d MMMM yyyy"));
    m_calendarMenu->hide();
    loadData();
}

void ScheduleView::loadData() {
    m_controller->loadAppointments(m_selectedDate, m_searchQuery,
        [this](const QJsonArray &filteredArr) {
            m_currentData = filteredArr;
            m_currentPage = 1;
            renderPage();
            updatePaginationUI();
        },
        [this](const QString &err) {
            QLayoutItem *child;
            while ((child = m_cardsLayout->takeAt(0)) != nullptr) {
                if (child->widget()) child->widget()->deleteLater();
                delete child;
            }
            m_paginationContainer->hide();

            QLabel *errLabel = new QLabel("Помилка завантаження: " + err);
            errLabel->setStyleSheet("color:#EF4444; font-size:14px;");
            m_cardsLayout->addWidget(errLabel);
            m_cardsLayout->addStretch();
        });
}

void ScheduleView::renderPage() {
    ScheduleViewUi::renderPage(this);
}

void ScheduleView::updatePaginationUI() {
    ScheduleViewUi::updatePaginationUi(this);
}

void ScheduleView::setPage(int page) {
    m_currentPage = page;
    renderPage();
    updatePaginationUI();
}

void ScheduleView::onAddAppointmentClicked() {
    emit addAppointmentRequested();
}
