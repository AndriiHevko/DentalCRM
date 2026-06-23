#ifndef SCHEDULECONTROLLER_H
#define SCHEDULECONTROLLER_H

#include <QObject>
#include <QDate>
#include <QJsonArray>
#include <QString>
#include <functional>
#include "../models/models.h"

class ApiClient;

class ScheduleController : public QObject {
    Q_OBJECT

public:
    using SuccessCallback = std::function<void(const QJsonArray&)>;
    using ErrorCallback = std::function<void(const QString&)>;

    explicit ScheduleController(QObject *parent = nullptr);
    void loadAppointments(const QDate &date, const QString &query, SuccessCallback success, ErrorCallback error);

private:
    ApiClient *m_apiClient;
};

#endif // SCHEDULECONTROLLER_H