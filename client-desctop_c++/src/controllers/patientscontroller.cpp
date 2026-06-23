#include "patientscontroller.h"
#include "../views/patientsview.h"
#include "../services/apiclient.h"

PatientsController::PatientsController(QObject *parent) 
    : QObject(parent) {
    m_searchDebounceTimer.setInterval(1000);
    m_searchDebounceTimer.setSingleShot(true);
    connect(&m_searchDebounceTimer, &QTimer::timeout, 
            this, &PatientsController::onSearchDebounceTimeout);
}

void PatientsController::setView(PatientsView *view) {
    m_view = view;
    performSearch("");
}

void PatientsController::searchPatients(const QString &query) {
    m_pendingQuery = query;
    m_searchDebounceTimer.stop();
    m_searchDebounceTimer.start();
}

void PatientsController::onSearchDebounceTimeout() {
    performSearch(m_pendingQuery);
}

void PatientsController::performSearch(const QString &query) {
    if (!m_view) return;

    // if (query.isEmpty()) {
    //     m_view->displayPatients(QVector<Patient>());
    //     return;
    // }

    ApiClient::instance().searchPatients(query, 
        [this](bool success, const QVector<Patient>& patients, const QString& error) {
            if (m_view) {
                if (success) {
                    m_view->displayPatients(patients);
                } else {
                    m_view->displayError(error);
                }
            }
        }
    );
}
