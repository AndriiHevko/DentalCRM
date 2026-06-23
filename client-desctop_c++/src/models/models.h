#ifndef MODELS_H
#define MODELS_H

#include <QString>
#include <QDateTime>
#include <QVector>
#include <QJsonObject>
#include <QJsonArray>

// ──────────────────────────────────────────────────────────────────────────────
//  Tooth
//  API поля: id, tooth_number, status, notes
// ──────────────────────────────────────────────────────────────────────────────
struct Tooth {
    int     id;
    int     toothNumber;
    QString status;
    QString notes;

    static Tooth fromJson(const QJsonObject &obj) {
        Tooth t;
        t.id          = obj["id"].toInt();
        t.toothNumber = obj["tooth_number"].toInt();
        t.status      = obj["status"].toString("healthy");
        t.notes       = obj["notes"].toString();
        return t;
    }

    QJsonObject toJson() const {
        QJsonObject obj;
        obj["tooth_number"] = toothNumber;
        obj["status"]       = status;
        obj["notes"]        = notes;
        return obj;
    }
};

// ──────────────────────────────────────────────────────────────────────────────
//  TreatmentRecord
//  API поля: id, medical_record, doctor, services[], diagnosis, notes, date
// ──────────────────────────────────────────────────────────────────────────────
struct TreatmentRecord {
    int id;
    QString date;
    QString diagnosis;
    QString notes;
    double cost = 0.0;
    QString services;
    QString teeth;
    QString receiptUrl;

    static TreatmentRecord fromJson(const QJsonObject &json) {
        TreatmentRecord r;
        r.id = json["id"].toInt();
        r.date = json["date"].toString();
        r.diagnosis = json["diagnosis"].toString();
        r.notes = json["notes"].toString();
        r.cost = json["cost"].toDouble();
        r.services = json["services"].toString();
        r.teeth = json["teeth"].toString();
        r.receiptUrl = json["receipt_url"].toString();

        return r;
    }
};

// ──────────────────────────────────────────────────────────────────────────────
//  MedicalRecord
//  API поля: id, user, created_at, updated_at, treatments[], dental_chart[]
//  Доступний через: GET /api/profile/   (вкладений у відповідь)
//                   GET /api/medical-records/{id}/
//                   GET /api/medical-records/{id}/dental-chart/
// ──────────────────────────────────────────────────────────────────────────────
struct MedicalRecord {
    int    id;
    int    patientId;
    QString createdAt;
    QVector<TreatmentRecord> treatments;
    QVector<Tooth>           dentalChart;

    static MedicalRecord fromJson(const QJsonObject &obj) {
        MedicalRecord r;
        r.id        = obj["id"].toInt();
        r.patientId = obj["patient"].toInt();
        r.createdAt = obj["created_at"].toString();

        for (const QJsonValue &v : obj["treatments"].toArray())
            r.treatments.append(TreatmentRecord::fromJson(v.toObject()));
        for (const QJsonValue &v : obj["dental_chart"].toArray())
            r.dentalChart.append(Tooth::fromJson(v.toObject()));

        return r;
    }
};

// ──────────────────────────────────────────────────────────────────────────────
//  UserProfile
//  API поля: id, username, first_name, last_name, phone, email,
//              date_of_birth, gender, address, medical_record
// ──────────────────────────────────────────────────────────────────────────────
struct UserProfile {
    int    id;
    QString username;
    QString firstName;
    QString lastName;
    QString phone;
    QString email;
    QString dateOfBirth;
    QString gender;
    QString address;
    MedicalRecord medicalRecord;
    bool    hasMedicalRecord = false;

    QString fullName() const {
        QString n = firstName.trimmed() + " " + lastName.trimmed();
        return n.trimmed().isEmpty() ? username : n.trimmed();
    }

    static UserProfile fromJson(const QJsonObject &obj) {
        UserProfile p;
        p.id          = obj["id"].toInt();
        p.username    = obj["username"].toString();
        p.firstName   = obj["first_name"].toString();
        p.lastName    = obj["last_name"].toString();
        p.phone       = obj["phone"].toString();
        p.email       = obj["email"].toString();
        p.dateOfBirth = obj["date_of_birth"].toString();
        p.gender      = obj["gender"].toString();
        p.address     = obj["address"].toString();

        if (obj.contains("medical_record") && !obj["medical_record"].isNull()) {
            p.medicalRecord    = MedicalRecord::fromJson(obj["medical_record"].toObject());
            p.hasMedicalRecord = true;
        }
        return p;
    }
};

// ──────────────────────────────────────────────────────────────────────────────
//  WorkSchedule
//  API поля: day_of_week, start_time, end_time, lunch_start, lunch_end
// ──────────────────────────────────────────────────────────────────────────────
struct WorkSchedule {
    int dayOfWeek = 0;
    QString startTime;
    QString endTime;
    QString lunchStart;
    QString lunchEnd;

    static WorkSchedule fromJson(const QJsonObject &obj) {
        WorkSchedule ws;
        ws.dayOfWeek = obj["day_of_week"].toInt();
        ws.startTime = obj["start_time"].toString();
        ws.endTime = obj["end_time"].toString();
        ws.lunchStart = obj["lunch_start"].toString();
        ws.lunchEnd = obj["lunch_end"].toString();
        return ws;
    }
};

// ──────────────────────────────────────────────────────────────────────────────
//  Appointment
//  API fields: id, appointment_datetime, status, notes,
//              doctor, doctor_name, doctor_specialty,
//              service, service_name, patient_name
//
//  patient_name — це get_full_name() або username.
// ──────────────────────────────────────────────────────────────────────────────
struct Appointment {
    int       id;
    QDateTime dateTime;
    int       durationMinutes = 60;
    QString   status;
    QString   notes;

    // doctor info
    int     doctorId;
    QString doctorName;
    QString doctorSpecialty;

    // service info
    int     serviceId;
    QString serviceName;

    // patient info
    int     patientId;
    QString patientName;
    QString patientPhone;

    QDateTime endTime() const {
        return dateTime.addSecs(durationMinutes * 60);
    }

    static Appointment fromJson(const QJsonObject &obj) {
        Appointment a;
        a.id              = obj["id"].toInt();
        a.status          = obj["status"].toString();
        a.notes           = obj["notes"].toString();
        a.durationMinutes = obj.contains("duration_minutes") ? obj["duration_minutes"].toInt(60) : 60;
        a.dateTime        = QDateTime::fromString(
                                obj["appointment_datetime"].toString(), Qt::ISODate);

        a.doctorId        = obj["doctor"].toInt();
        a.doctorName      = obj["doctor_name"].toString();
        a.doctorSpecialty = obj["doctor_specialty"].toString();

        a.serviceId       = obj["service"].toInt();
        a.serviceName     = obj["service_name"].toString();

        a.patientId       = obj["patient_id"].toInt();
        a.patientName     = obj["patient_name"].toString();
        a.patientPhone    = obj["patient_phone"].toString();
        return a;
    }

    //  Статус
    QString statusDisplay() const {
        if (status == "pending")   return "Очікує";
        if (status == "scheduled") return "Заплановано";
        if (status == "in_progress") return "В процесі";
        if (status == "done")      return "Завершено";
        if (status == "cancelled") return "Скасовано";
        return status;
    }

    // Колір для статусного рядка
    QString statusColor() const {
        if (status == "scheduled") return "#D1FAE5";
        if (status == "pending")   return "#FEF3C7";
        if (status == "in_progress") return "#E0E7FF";
        if (status == "done")      return "#F1F5F9";
        if (status == "cancelled") return "#FEE2E2";
        return "#94A3B8";
    }
};

// ──────────────────────────────────────────────────────────────────────────────
//  Service
//  API поля: id, name, description, price, duration_minutes, specialty, image_url
// ──────────────────────────────────────────────────────────────────────────────
struct Service {
    int     id;
    QString name;
    QString description;
    double  price;
    int     durationMinutes;

    static Service fromJson(const QJsonObject &obj) {
        Service s;
        s.id              = obj["id"].toInt();
        s.name            = obj["name"].toString();
        s.description     = obj["description"].toString();
        s.price           = obj["price"].toDouble();
        s.durationMinutes = obj["duration_minutes"].toInt();
        return s;
    }
};


// ──────────────────────────────────────────────────────────────────────────────
//  Patient
//  API поля: id, firstName, lastName, phoneNumber, email, dateOfBirth, gender, address,
//  generalNotes, medicalRecord, hasMedicalRecord
// ──────────────────────────────────────────────────────────────────────────────
struct Patient {
    int id = 0;
    QString firstName;
    QString lastName;
    QString phoneNumber;
    QString email;
    QString dateOfBirth;
    QString gender;
    QString address;
    QString generalNotes;
    MedicalRecord medicalRecord;
    bool hasMedicalRecord = false;

    QString fullName() const { 
        return firstName.trimmed() + " " + lastName.trimmed(); 
    }

    static Patient fromJson(const QJsonObject &obj) {
        Patient p;
        p.id = obj["id"].toInt();
        p.firstName = obj["first_name"].toString();
        p.lastName = obj["last_name"].toString();
        p.phoneNumber = obj["phone_number"].toString();
        p.email = obj["email"].toString();
        p.dateOfBirth = obj["date_of_birth"].toString();
        p.gender = obj["gender"].toString();
        p.address = obj["address"].toString();
        p.generalNotes = obj["general_notes"].toString();
        
        if (obj.contains("medical_record") && !obj["medical_record"].isNull()) {
            p.medicalRecord = MedicalRecord::fromJson(obj["medical_record"].toObject());
            p.hasMedicalRecord = true;
        }
        return p;
    }

    QJsonObject toJson() const {
        QJsonObject obj;
        obj["first_name"] = firstName;
        obj["last_name"] = lastName;
        obj["phone_number"] = phoneNumber;
        obj["email"] = email;
        obj["date_of_birth"] = dateOfBirth;
        obj["gender"] = gender;
        obj["address"] = address;
        obj["general_notes"] = generalNotes;
        return obj;
    }
};

#endif // MODELS_H
