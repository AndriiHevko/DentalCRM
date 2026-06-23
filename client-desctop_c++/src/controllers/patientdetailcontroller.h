#ifndef PATIENTDETAILCONTROLLER_H
#define PATIENTDETAILCONTROLLER_H

#include <QObject>
#include "../models/models.h"

class PatientDetailView;

class PatientDetailController : public QObject {
    Q_OBJECT

public:
    explicit PatientDetailController(QObject *parent = nullptr);
    void setView(PatientDetailView *view);
    void loadPatientDetail(int patientId);

private:
    PatientDetailView *m_view = nullptr;
};

#endif // PATIENTDETAILCONTROLLER_H
