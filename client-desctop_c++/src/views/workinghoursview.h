#ifndef WORKINGHOURSVIEW_H
#define WORKINGHOURSVIEW_H

#include <QWidget>
#include <QVector>
#include "../models/models.h"

class WorkingHoursController;
class QVBoxLayout;
class QLabel;

class WorkingHoursView : public QWidget {
    Q_OBJECT
public:
    explicit WorkingHoursView(QWidget *parent = nullptr);
    void loadData();

private:
    void setupUi();
    void renderSchedule(const QVector<WorkSchedule>& schedules);
    QString formatTime(const QString& timeStr);

    WorkingHoursController *m_controller;
    QVBoxLayout *m_cardsLayout;
    QLabel *m_statusLabel;
};

#endif // WORKINGHOURSVIEW_H
