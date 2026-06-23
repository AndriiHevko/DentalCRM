#include "addappointmentcontroller.h"

AddAppointmentController::AddAppointmentController(QObject *parent)
    : QObject(parent), m_apiClient(&ApiClient::instance()) {
    m_debounceTimer = new QTimer(this);
    m_debounceTimer->setSingleShot(true);
    m_debounceTimer->setInterval(300);
}

void AddAppointmentController::searchPatients(const QString& query, PatientsCallback callback) {
    if (query.length() < 2) {
        callback(true, QVector<Patient>(), QString());
        return;
    }
    m_apiClient->searchPatients(query, callback);
}

void AddAppointmentController::createPatient(const QString& firstName, const QString& lastName, const QString& phone,
                                             PatientCreatedCallback callback) {
    m_apiClient->createPatient(firstName, lastName, phone, callback);
}

// Виклик отриманих послуг
void AddAppointmentController::getServices(ApiClient::ServicesCallback callback) {
    m_apiClient->getServices(callback);
}

// Отримання вільних годин
void AddAppointmentController::getAvailableSlots(int doctorId, const QDate& date, int serviceId,
                                                 ApiClient::AvailableSlotsCallback callback) {
    m_apiClient->getAvailableSlots(doctorId, date, serviceId, callback);
}

// Створення запису
void AddAppointmentController::createAppointment(int patientId, int serviceId,
                                                 const QDateTime& dateTime, const QString& notes,
                                                 AppointmentCreatedCallback callback) {
    m_apiClient->createAppointment(patientId, serviceId, dateTime, notes,
       [this, callback](bool ok, const QString& err) {
           if (ok) {
               emit appointmentCreated();
           }
           callback(ok, err);
       });
}
