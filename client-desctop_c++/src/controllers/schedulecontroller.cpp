#include "schedulecontroller.h"
#include "../services/apiclient.h"
#include <QJsonValue>
#include <QList>
#include <algorithm>

ScheduleController::ScheduleController(QObject *parent)
    : QObject(parent), m_apiClient(&ApiClient::instance()) {
}

void ScheduleController::loadAppointments(const QDate &date, const QString &query,
                                          SuccessCallback success,
                                          ErrorCallback error) {
    QString endpoint = QString("/api/appointments/me/?date=%1").arg(date.toString("yyyy-MM-dd"));

    m_apiClient->get(endpoint,
        [query, success](const QJsonDocument &doc) {
            QJsonArray arr;
            if (doc.isObject() && doc.object().contains("results"))
                arr = doc.object()["results"].toArray();
            else if (doc.isArray())
                arr = doc.array();

            QList<QJsonValue> valList;
            for (const QJsonValue &val : arr) {
                Appointment a = Appointment::fromJson(val.toObject());
                if (query.isEmpty() || a.patientName.contains(query, Qt::CaseInsensitive)) {
                    valList.append(val);
                }
            }

            std::sort(valList.begin(), valList.end(), [](const QJsonValue &a1, const QJsonValue &a2) {
                Appointment b1 = Appointment::fromJson(a1.toObject());
                Appointment b2 = Appointment::fromJson(a2.toObject());
                return b1.dateTime < b2.dateTime;
            });

            QJsonArray filteredArr;
            for (const QJsonValue &v : valList)
                filteredArr.append(v);

            success(filteredArr);
        },
        error);
}
