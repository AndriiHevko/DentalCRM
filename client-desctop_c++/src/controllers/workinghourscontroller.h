#ifndef WORKINGHOURSCONTROLLER_H
#define WORKINGHOURSCONTROLLER_H

#include <QObject>
#include <QVector>
#include <QString>
#include <functional>
#include "../models/models.h"

class ApiClient;

class WorkingHoursController : public QObject {
    Q_OBJECT

public:
    using SuccessCallback = std::function<void(const QVector<WorkSchedule>&)>;
    using ErrorCallback = std::function<void(const QString&)>;

    explicit WorkingHoursController(QObject *parent = nullptr);
    void loadWorkingHours(SuccessCallback success, ErrorCallback error);

private:
    ApiClient *m_apiClient;
};

#endif // WORKINGHOURSCONTROLLER_H
