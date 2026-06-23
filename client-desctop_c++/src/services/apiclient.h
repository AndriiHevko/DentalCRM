#ifndef APICLIENT_H
#define APICLIENT_H

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QString>
#include <QVector>
#include <QDateTime>
#include <QDate>
#include <QStringList>
#include <functional>
#include "../models/models.h"

class ApiClient : public QObject {
    Q_OBJECT
public:
    static ApiClient& instance();

    void setBaseUrl(const QString &url);
    void setTokens(const QString &access, const QString &refresh);
    bool isAuthenticated() const;
    void logout();

signals:
    void unauthorized();
    void appointmentStatusUpdated(bool success);
    void appointmentCompleted(bool success);

public:
    using SuccessCallback = std::function<void(const QJsonDocument&)>;
    using ErrorCallback = std::function<void(const QString&)>;
    using RetryCallback = std::function<void()>; // ДОДАНО ДЛЯ ПОВТОРУ ЗАПИТУ

    void get(const QString &endpoint, SuccessCallback success, ErrorCallback error);
    void post(const QString &endpoint, const QJsonObject &data, SuccessCallback success, ErrorCallback error);
    void put(const QString &endpoint, const QJsonObject &data, SuccessCallback success, ErrorCallback error);
    void patch(const QString &endpoint, const QJsonObject &data, SuccessCallback success, ErrorCallback error);
    void del(const QString &endpoint, SuccessCallback success, ErrorCallback error);

    void patchAppointmentStatus(int id, const QString& status);
    void completeAppointment(int id, const QJsonObject& payload);

    QString getAccessToken() const { return m_accessToken; }
    QString getRefreshToken() const { return m_refreshToken; }

    using PatientsCallback = std::function<void(bool success, const QVector<Patient>& patients, const QString& error)>;
    using PatientCreatedCallback = std::function<void(bool success, int patientId, const QString& error)>;
    using AppointmentCreatedCallback = std::function<void(bool success, const QString& error)>;
    using PatientDetailCallback = std::function<void(bool success, const Patient& patient, const QString& error)>;
    using MedicalRecordCallback = std::function<void(bool success, const MedicalRecord& record, const QString& error)>;
    using ServicesCallback = std::function<void(bool success, const QVector<Service>& services, const QString& error)>;
    using AvailableSlotsCallback = std::function<void(bool success, const QStringList& timeSlots, const QString& error)>;

    void getAvailableSlots(int doctorId, const QDate& date, int serviceId, AvailableSlotsCallback callback);
    void searchPatients(const QString& query, PatientsCallback callback);
    void createPatient(const QString& firstName, const QString& lastName, const QString& phone, PatientCreatedCallback callback);
    void getPatientDetail(int patientId, PatientDetailCallback callback);
    void getMedicalRecord(int patientId, MedicalRecordCallback callback);
    void getServices(ServicesCallback callback);
    void createAppointment(int patientId, int serviceId, const QDateTime& dateTime, const QString& notes, AppointmentCreatedCallback callback);
    void changePassword(const QString& oldPassword, const QString& newPassword, SuccessCallback success, ErrorCallback error);

private:
    explicit ApiClient(QObject *parent = nullptr);
    ApiClient(const ApiClient&) = delete;
    ApiClient& operator=(const ApiClient&) = delete;

    QNetworkRequest createRequest(const QString &endpoint);

    void handleReply(QNetworkReply *reply, SuccessCallback success, ErrorCallback error, RetryCallback retry = nullptr);

    QNetworkAccessManager *m_manager;
    QString m_baseUrl;
    QString m_accessToken;
    QString m_refreshToken;
};

#endif // APICLIENT_H
