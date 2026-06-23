#include "workinghourscontroller.h"
#include "../services/apiclient.h"
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QDebug>

WorkingHoursController::WorkingHoursController(QObject *parent)
    : QObject(parent), m_apiClient(&ApiClient::instance()) {
}

void WorkingHoursController::loadWorkingHours(SuccessCallback success, ErrorCallback error) {
    m_apiClient->get("/api/profile/",
        [success, error](const QJsonDocument &doc) {
           qDebug().noquote() << "PROFILE JSON:" << doc.toJson(QJsonDocument::Indented);
            if (!doc.isObject()) {
                error("Невірний формат відповіді від сервера.");
                return;
            }

            QJsonObject obj = doc.object();
            QJsonArray schedulesArray;

            if (obj.contains("work_schedules")) {
                schedulesArray = obj["work_schedules"].toArray();
            } else if (obj.contains("doctor_profile") && obj["doctor_profile"].toObject().contains("work_schedules")) {
                schedulesArray = obj["doctor_profile"].toObject()["work_schedules"].toArray();
            } else {
                success(QVector<WorkSchedule>());
                return;
            }

            QVector<WorkSchedule> schedules;
            for (const QJsonValue &val : schedulesArray) {
                schedules.append(WorkSchedule::fromJson(val.toObject()));
            }

            success(schedules);
        },
        error
    );
}
