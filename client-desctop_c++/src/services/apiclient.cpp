#include "apiclient.h"
#include <QUrl>
#include <QSettings>
#include <QEventLoop>
#include <QStringList>

ApiClient& ApiClient::instance() {
    static ApiClient inst;
    return inst;
}

ApiClient::ApiClient(QObject *parent) : QObject(parent) {
    m_manager = new QNetworkAccessManager(this);
    m_baseUrl = "http://127.0.0.1:8000";
    QSettings settings;
    m_accessToken = settings.value("auth/access").toString();
    m_refreshToken = settings.value("auth/refresh").toString();
}

void ApiClient::setBaseUrl(const QString &url) {
    m_baseUrl = url;
}

void ApiClient::setTokens(const QString &access, const QString &refresh) {
    m_accessToken = access;
    m_refreshToken = refresh;
    QSettings settings;
    settings.setValue("auth/access", access);
    settings.setValue("auth/refresh", refresh);
}

bool ApiClient::isAuthenticated() const {
    return !m_accessToken.isEmpty();
}

void ApiClient::logout() {
    m_accessToken.clear();
    m_refreshToken.clear();
    QSettings settings;
    settings.remove("auth/access");
    settings.remove("auth/refresh");
    emit unauthorized(); // Повернення вікна логіну
}

QNetworkRequest ApiClient::createRequest(const QString &endpoint) {
    QNetworkRequest request(QUrl(m_baseUrl + endpoint));
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    if (!m_accessToken.isEmpty()) {
        request.setRawHeader("Authorization", "Bearer " + m_accessToken.toUtf8());
    }
    return request;
}

void ApiClient::get(const QString &endpoint, SuccessCallback success, ErrorCallback error) {
    QNetworkReply *reply = m_manager->get(createRequest(endpoint));
    handleReply(reply, success, error, [this, endpoint, success, error]() {
        get(endpoint, success, error); // Лямбда для повтору запиту
    });
}

void ApiClient::post(const QString &endpoint, const QJsonObject &data, SuccessCallback success, ErrorCallback error) {
    QNetworkReply *reply = m_manager->post(createRequest(endpoint), QJsonDocument(data).toJson());
    handleReply(reply, success, error, [this, endpoint, data, success, error]() {
        post(endpoint, data, success, error);
    });
}

void ApiClient::put(const QString &endpoint, const QJsonObject &data, SuccessCallback success, ErrorCallback error) {
    QNetworkReply *reply = m_manager->put(createRequest(endpoint), QJsonDocument(data).toJson());
    handleReply(reply, success, error, [this, endpoint, data, success, error]() {
        put(endpoint, data, success, error);
    });
}

void ApiClient::patch(const QString &endpoint, const QJsonObject &data, SuccessCallback success, ErrorCallback error) {
    QNetworkReply *reply = m_manager->sendCustomRequest(createRequest(endpoint), "PATCH", QJsonDocument(data).toJson());
    handleReply(reply, success, error, [this, endpoint, data, success, error]() {
        patch(endpoint, data, success, error);
    });
}

void ApiClient::del(const QString &endpoint, SuccessCallback success, ErrorCallback error) {
    QNetworkReply *reply = m_manager->deleteResource(createRequest(endpoint));
    handleReply(reply, success, error, [this, endpoint, success, error]() {
        del(endpoint, success, error);
    });
}

void ApiClient::handleReply(QNetworkReply *reply, SuccessCallback success, ErrorCallback error, RetryCallback retry) {
    connect(reply, &QNetworkReply::finished, [this, reply, success, error, retry]() {
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            success(doc);
        } else {
            QString errorMsg = reply->errorString();
            int statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();

            QByteArray errorBody = reply->readAll();
            if (!errorBody.isEmpty()) {
                qDebug() << "ДЕТАЛІ ПОМИЛКИ ВІД DJANGO:" << errorBody;
                errorMsg += "\nДеталі: " + QString::fromUtf8(errorBody);
            }

            if (statusCode != 0) {
                errorMsg += QString(" (HTTP %1)").arg(statusCode);
            }

            if (statusCode == 401) {
                if (reply->url().path().endsWith("/token/refresh/")) {
                    logout();
                    error("Session expired.");
                } else if (!m_refreshToken.isEmpty()) {
                    QJsonObject rdata;
                    rdata["refresh"] = m_refreshToken;
                    QNetworkRequest req(QUrl(m_baseUrl + "/api/token/refresh/"));
                    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
                    QNetworkReply *refreshReply = m_manager->post(req, QJsonDocument(rdata).toJson());

                    connect(refreshReply, &QNetworkReply::finished, [this, refreshReply, error, retry]() {
                        if (refreshReply->error() == QNetworkReply::NoError) {
                            QJsonDocument doc = QJsonDocument::fromJson(refreshReply->readAll());
                            QString newAccess = doc.object()["access"].toString();
                            setTokens(newAccess, m_refreshToken);

                            if (retry) {
                                retry();
                            } else {
                                error("Token refreshed automatically.");
                            }
                        } else {
                            logout();
                            error("Session expired. Please login again.");
                        }
                        refreshReply->deleteLater();
                    });
                    reply->deleteLater();
                    return;
                } else {
                    logout();
                    error("Unauthorized. Please login again.");
                }
            } else {
                error(errorMsg);
            }
        }
        reply->deleteLater();
    });
}

void ApiClient::searchPatients(const QString& query, PatientsCallback callback) {
    QString endpoint = QString("/api/patients/?search=%1").arg(QString(QUrl::toPercentEncoding(query)));
    get(endpoint,
        [callback](const QJsonDocument &doc) {
            QVector<Patient> patients;
            if (doc.isArray()) {
                for (const QJsonValue &val : doc.array()) {
                    patients.append(Patient::fromJson(val.toObject()));
                }
            } else if (doc.isObject() && doc.object().contains("results")) {
                for (const QJsonValue &val : doc.object()["results"].toArray()) {
                    patients.append(Patient::fromJson(val.toObject()));
                }
            }
            callback(true, patients, QString());
        },
        [callback](const QString &err) {
            callback(false, QVector<Patient>(), err);
        }
    );
}

void ApiClient::createPatient(const QString& firstName, const QString& lastName, const QString& phone, PatientCreatedCallback callback) {
    QJsonObject data;
    data["first_name"] = firstName;
    data["last_name"] = lastName;
    data["phone_number"] = phone;
    post("/api/patients/", data,
         [callback](const QJsonDocument &doc) {
             int patientId = doc.object()["id"].toInt();
             callback(true, patientId, QString());
         },
         [callback](const QString &err) {
             callback(false, 0, err);
         });
}

void ApiClient::getServices(ServicesCallback callback) {
    get("/api/services/",
        [callback](const QJsonDocument &doc) {
            QVector<Service> services;
            if (doc.isArray()) {
                for (const QJsonValue &val : doc.array()) {
                    services.append(Service::fromJson(val.toObject()));
                }
            } else if (doc.isObject() && doc.object().contains("results")) {
                for (const QJsonValue &val : doc.object()["results"].toArray()) {
                    services.append(Service::fromJson(val.toObject()));
                }
            }
            callback(true, services, QString());
        },
        [callback](const QString &err) {
            callback(false, QVector<Service>(), err);
        }
    );
}

void ApiClient::createAppointment(int patientId, int serviceId, const QDateTime& dateTime, const QString& notes, AppointmentCreatedCallback callback) {
    QJsonObject data;
    data["patient_id"] = patientId;
    data["service"] = serviceId;
    data["appointment_datetime"] = dateTime.toString(Qt::ISODate);
    data["notes"] = notes;

    post("/api/appointments/", data,
        [callback](const QJsonDocument &) {
            callback(true, QString());
        },
        [callback](const QString &err) {
            callback(false, err);
        }
    );
}

void ApiClient::getAvailableSlots(int doctorId, const QDate& date, int serviceId, AvailableSlotsCallback callback) {
    QString endpoint = QString("/api/doctors/%1/availability/?date=%2&service_id=%3")
                           .arg(doctorId)
                           .arg(date.toString(Qt::ISODate))
                           .arg(serviceId);

    get(endpoint,
        [callback](const QJsonDocument &doc) {
            QStringList timeSlots;

            if (doc.isObject() && doc.object().contains("available_slots")) {
                QJsonArray arr = doc.object()["available_slots"].toArray();
                for (const QJsonValue &val : arr) {
                    timeSlots.append(val.toString());
                }
                callback(true, timeSlots, QString());
            } else {
                callback(false, timeSlots, "Невірний формат відповіді від сервера");
            }
        },
        [callback](const QString &err) {
            callback(false, QStringList(), err);
        }
    );
}

void ApiClient::getPatientDetail(int patientId, PatientDetailCallback callback) {
    QString endpoint = QString("/api/patients/%1/").arg(patientId);
    get(endpoint,
        [callback](const QJsonDocument &doc) {
            if (doc.isObject()) {
                Patient patient = Patient::fromJson(doc.object());
                callback(true, patient, QString());
            } else {
                callback(false, Patient(), "Invalid response format");
            }
        },
        [callback](const QString &err) {
            callback(false, Patient(), err);
        }
    );
}

void ApiClient::getMedicalRecord(int patientId, MedicalRecordCallback callback) {
    QString endpoint = QString("/api/medical-records/by_patient/%1/").arg(patientId);
    get(endpoint,
        [callback](const QJsonDocument &doc) {
            if (doc.isObject()) {
                MedicalRecord record = MedicalRecord::fromJson(doc.object());
                callback(true, record, QString());
            } else {
                callback(false, MedicalRecord(), "Invalid response format");
            }
        },
        [callback](const QString &err) {
            callback(false, MedicalRecord(), err);
        }
    );
}

void ApiClient::changePassword(const QString& oldPassword, const QString& newPassword, SuccessCallback success, ErrorCallback error) {
    QJsonObject data;
    data["old_password"] = oldPassword;
    data["new_password"] = newPassword;
    patch("/api/password-change/", data, success, error);
}
