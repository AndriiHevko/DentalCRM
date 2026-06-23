#include "workinghoursview.h"
#include "../controllers/workinghourscontroller.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QFrame>
#include <QGraphicsDropShadowEffect>

WorkingHoursView::WorkingHoursView(QWidget *parent) : QWidget(parent) {
    m_controller = new WorkingHoursController(this);
    setupUi();
}

void WorkingHoursView::setupUi() {
    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(40, 40, 40, 40);
    mainLayout->setSpacing(20);
    mainLayout->setAlignment(Qt::AlignTop);

    QLabel *titleLabel = new QLabel("Мій графік роботи", this);
    titleLabel->setObjectName("pageTitle");
    mainLayout->addWidget(titleLabel);

    m_statusLabel = new QLabel("", this);
    m_statusLabel->setStyleSheet("color: #64748B; font-size: 14px;");
    m_statusLabel->hide();
    mainLayout->addWidget(m_statusLabel);

    QWidget *cardsContainer = new QWidget(this);
    m_cardsLayout = new QVBoxLayout(cardsContainer);
    m_cardsLayout->setContentsMargins(0, 0, 0, 0);
    m_cardsLayout->setSpacing(12);

    mainLayout->addWidget(cardsContainer);
    mainLayout->addStretch();
}

void WorkingHoursView::loadData() {
    m_statusLabel->setText("Завантаження...");
    m_statusLabel->show();

    m_controller->loadWorkingHours(
        [this](const QVector<WorkSchedule>& schedules) {
            m_statusLabel->hide();
            renderSchedule(schedules);
        },
        [this](const QString& errorMsg) {
            m_statusLabel->setText("Помилка: " + errorMsg);
            m_statusLabel->show();
        }
        );
}

QString WorkingHoursView::formatTime(const QString& timeStr) {
    if (timeStr.length() >= 5) {
        return timeStr.left(5);
    }
    return timeStr;
}

void WorkingHoursView::renderSchedule(const QVector<WorkSchedule>& schedules) {
    QLayoutItem *child;
    while ((child = m_cardsLayout->takeAt(0)) != nullptr) {
        if (child->widget()) child->widget()->deleteLater();
        delete child;
    }

    const QStringList dayNames = {"Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"};

    QVector<WorkSchedule> fullWeek(7);
    for (int i = 0; i < 7; ++i) fullWeek[i].dayOfWeek = i + 1;

    for (const WorkSchedule& ws : schedules) {
        if (ws.dayOfWeek >= 1 && ws.dayOfWeek <= 7) {
            fullWeek[ws.dayOfWeek - 1] = ws;
        }
    }

    for (int i = 0; i < 7; ++i) {
        const WorkSchedule& day = fullWeek[i];

        QFrame *card = new QFrame();
        card->setObjectName("patientCard");
        card->setFixedHeight(70);

        QGraphicsDropShadowEffect *shadow = new QGraphicsDropShadowEffect();
        shadow->setBlurRadius(10);
        shadow->setXOffset(0);
        shadow->setYOffset(2);
        shadow->setColor(QColor(0, 0, 0, 15));
        card->setGraphicsEffect(shadow);

        QHBoxLayout *cardLayout = new QHBoxLayout(card);
        cardLayout->setContentsMargins(24, 0, 24, 0);

        QLabel *dayLabel = new QLabel(dayNames[i], card);
        dayLabel->setStyleSheet("font-size: 16px; font-weight: bold; min-width: 120px;");
        cardLayout->addWidget(dayLabel);

        cardLayout->addStretch();

        if (!day.startTime.isEmpty() && !day.endTime.isEmpty()) {
            QLabel *timeLabel = new QLabel(QString("%1 — %2").arg(formatTime(day.startTime), formatTime(day.endTime)), card);
            timeLabel->setStyleSheet("font-size: 16px; font-weight: bold; color: #10B981;");
            cardLayout->addWidget(timeLabel);

            cardLayout->addSpacing(40);

            if (!day.lunchStart.isEmpty() && !day.lunchEnd.isEmpty()) {
                QLabel *lunchIcon = new QLabel("☕", card);
                QLabel *lunchLabel = new QLabel(QString("%1 — %2").arg(formatTime(day.lunchStart), formatTime(day.lunchEnd)), card);
                lunchLabel->setStyleSheet("font-size: 14px; color: #64748B;");
                cardLayout->addWidget(lunchIcon);
                cardLayout->addWidget(lunchLabel);
            } else {
                QLabel *noLunchLabel = new QLabel("Без обіду", card);
                noLunchLabel->setStyleSheet("font-size: 14px; color: #94A3B8; font-style: italic;");
                cardLayout->addWidget(noLunchLabel);
            }
        } else {
            QLabel *offLabel = new QLabel("Вихідний", card);
            offLabel->setStyleSheet("font-size: 14px; font-weight: bold; color: #EF4444; background: #FEE2E2; padding: 4px 12px; border-radius: 6px;");
            cardLayout->addWidget(offLabel);
        }

        m_cardsLayout->addWidget(card);
    }
}
