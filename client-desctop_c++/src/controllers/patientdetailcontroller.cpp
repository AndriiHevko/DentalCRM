#include "patientdetailcontroller.h"
#include "../views/patientdetailview.h"
#include "../services/apiclient.h"

PatientDetailController::PatientDetailController(QObject *parent)
    : QObject(parent) {
}

void PatientDetailController::setView(PatientDetailView *view) {
    m_view = view;
}

void PatientDetailController::loadPatientDetail(int patientId) {
    if (!m_view) return;

    ApiClient::instance().getPatientDetail(patientId,
        [this, patientId](bool success, const Patient& patient, const QString& error) {
           if (!m_view) return;

           if (success) {
               m_view->displayPatientInfo(patient);

               ApiClient::instance().getMedicalRecord(patientId,
                    [this](bool recSuccess, const MedicalRecord& record, const QString& recError) {
                        if (!m_view) return;

                        if (recSuccess) {
                          m_view->displayDentalChart(record);
                          m_view->displayTreatmentHistory(record);
                        } else {
                          m_view->displayNoDentalChart();
                        }
                    });
            } else {
               m_view->displayError(error);
       }
    });
}
