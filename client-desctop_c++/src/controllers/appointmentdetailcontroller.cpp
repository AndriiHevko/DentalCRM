#include "appointmentdetailcontroller.h"
#include <QJsonObject>

AppointmentDetailController::AppointmentDetailController(QObject *parent)
    : QObject(parent), m_apiClient(&ApiClient::instance()) {
}

void AppointmentDetailController::loadAppointment(int id) {
    m_apiClient->get(QString("/api/appointments/%1/").arg(id),
        [this](const QJsonDocument &doc) {
            if (doc.isObject()) {
                Appointment appt = Appointment::fromJson(doc.object());
                emit appointmentLoaded(appt);
            }
        },
        [](const QString &) {}
    );
}

void AppointmentDetailController::loadAppointment(const Appointment &appt) {
    emit appointmentLoaded(appt);
}

void AppointmentDetailController::loadServices(ServicesCallback success, ErrorCallback error) {
    m_apiClient->get("/api/services/", [success](const QJsonDocument &doc) {
        QJsonArray arr = doc.isArray() ? doc.array() : doc.object()["results"].toArray();
        success(arr);
    }, error);
}

void AppointmentDetailController::loadPatientMedicalRecord(int patientId, MedicalRecordCallback success, ErrorCallback error) {
    m_apiClient->get("/api/medical-records/", [this, patientId, success](const QJsonDocument &doc) {
        QJsonArray arr = doc.isArray() ? doc.array() : doc.object()["results"].toArray();
        for (const QJsonValue &v : arr) {
            MedicalRecord mr = MedicalRecord::fromJson(v.toObject());
            if (mr.patientId == patientId) {
                success(mr);
                return;
            }
        }
    }, error);
}

void AppointmentDetailController::changeStatus(int id, const QString &status) {
    QJsonObject data;
    data["status"] = status;
    m_apiClient->patch(QString("/api/appointments/%1/").arg(id), data,
       [this](const QJsonDocument &) { emit statusChanged(true); },
       [this](const QString &err) {
           qDebug() << "Помилка зміни статусу (400). Відповідь сервера:" << err;
           emit statusChanged(false);
       }
       );
}

void AppointmentDetailController::completeAppointment(int id, const QJsonObject &payload) {
    m_apiClient->post(QString("/api/appointments/%1/complete/").arg(id), payload,
        [this](const QJsonDocument &doc) {
          QJsonObject responseObj = doc.object();
          int treatmentId = responseObj["treatment_id"].toInt();

          if (treatmentId == 0) {
              treatmentId = responseObj["id"].toInt();
            }

          if (treatmentId == 0) {
              qDebug() << "Помилка: Бекенд не повернув ID створеного TreatmentRecord";
              emit appointmentCompleted(true, "", false);
              return;
            }

          m_apiClient->post(QString("/api/invoices/generate-for-treatment/%1/").arg(treatmentId), QJsonObject(),
            [this](const QJsonDocument &invoiceDoc) {
                QJsonObject obj = invoiceDoc.object();
                QString receiptUrl = obj["receipt_url"].toString();
                bool requiresPrinting = obj["requires_printing"].toBool(false);
                emit appointmentCompleted(true, receiptUrl, requiresPrinting);
            },
            [this](const QString &err) {
                qDebug() << "Помилка генерації чека:" << err;
                emit appointmentCompleted(true, "", false);
            }
            );
        },
      [this](const QString &err) {
          qDebug() << "Помилка завершення медичної частини:" << err;
          emit appointmentCompleted(false);
        }
    );
}
