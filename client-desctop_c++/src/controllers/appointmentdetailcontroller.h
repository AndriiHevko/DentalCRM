#ifndef APPOINTMENTDETAILCONTROLLER_H
#define APPOINTMENTDETAILCONTROLLER_H

#include <QObject>
#include "../models/models.h"
#include "../services/apiclient.h"

class AppointmentDetailController : public QObject {
    Q_OBJECT

public:
    using SuccessCallback = std::function<void(const QJsonDocument&)>;
    using ErrorCallback = std::function<void(const QString&)>;
    using ServicesCallback = std::function<void(const QJsonArray&)>;
    using MedicalRecordCallback = std::function<void(const MedicalRecord&)>;

    explicit AppointmentDetailController(QObject *parent = nullptr);

    void loadAppointment(int id);
    void loadAppointment(const Appointment &appt);
    void loadServices(ServicesCallback success, ErrorCallback error);
    void loadPatientMedicalRecord(int patientId, MedicalRecordCallback success, ErrorCallback error);
    void changeStatus(int id, const QString &status);
    void completeAppointment(int id, const QJsonObject &payload);

signals:
    void appointmentLoaded(const Appointment &appt);
    void servicesLoaded(const QJsonArray &services);
    void medicalRecordLoaded(const MedicalRecord &record);
    void statusChanged(bool success);
    void appointmentCompleted(bool success, const QString& receiptUrl = QString(), bool requiresPrinting = false);

private:
    ApiClient *m_apiClient;
};

#endif // APPOINTMENTDETAILCONTROLLER_H
