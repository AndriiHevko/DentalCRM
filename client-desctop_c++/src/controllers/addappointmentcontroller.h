#ifndef ADDAPPOINTMENTCONTROLLER_H
#define ADDAPPOINTMENTCONTROLLER_H

#include <QObject>
#include <QTimer>
#include <QDate>
#include <functional>
#include "../models/models.h"
#include "../services/apiclient.h"

class AddAppointmentController : public QObject {
    Q_OBJECT

public:
    explicit AddAppointmentController(QObject *parent = nullptr);

    using PatientsCallback = std::function<void(bool success, const QVector<Patient>& patients, const QString& error)>;
    using PatientCreatedCallback = std::function<void(bool success, int patientId, const QString& error)>;
    using AppointmentCreatedCallback = std::function<void(bool success, const QString& error)>;

    void searchPatients(const QString& query, PatientsCallback callback);
    void createPatient(const QString& firstName, const QString& lastName, const QString& phone,
                       PatientCreatedCallback callback);

    // Отримання списку послуг
    void getServices(ApiClient::ServicesCallback callback);

    // Отримання вільних годин лікаря
    void getAvailableSlots(int doctorId, const QDate& date, int serviceId, ApiClient::AvailableSlotsCallback callback);

    // Створення запису
    void createAppointment(int patientId, int serviceId, const QDateTime& dateTime, const QString& notes,
                           AppointmentCreatedCallback callback);

signals:
    void appointmentCreated();

private:
    ApiClient *m_apiClient;
    QTimer *m_debounceTimer;
};

#endif // ADDAPPOINTMENTCONTROLLER_H
