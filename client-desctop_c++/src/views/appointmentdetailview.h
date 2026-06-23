#ifndef APPOINTMENTDETAILVIEW_H
#define APPOINTMENTDETAILVIEW_H

#include <QWidget>
#include <QLabel>
#include <QPushButton>
#include <QTextEdit>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QMap>
#include <QComboBox>
#include <QListWidget>
#include <QStackedWidget>
#include <QJsonDocument>
#include <QTemporaryDir>
#include "../models/models.h"
#include "../controllers/appointmentdetailcontroller.h"
#include <QSet>

class AppointmentDetailView;

namespace AppointmentDetailViewUi {
    void buildUi(AppointmentDetailView *view);
}

class AppointmentDetailView : public QWidget {
    Q_OBJECT
public:
    explicit AppointmentDetailView(QWidget *parent = nullptr);
    void loadAppointment(int id);
    void loadAppointment(const Appointment &appt);

signals:
    void backRequested();
    void appointmentStatusChanged();

private:
    void setupUi();

    friend void AppointmentDetailViewUi::buildUi(AppointmentDetailView *view);

private slots:
    void onAppointmentLoaded(const Appointment &appt);
    void onStatusChanged(bool success);
    void onAppointmentCompleted(bool success, const QString& receiptUrl, bool requiresPrinting);
    void onToothClicked(int toothNumber);
    void onConfirmClicked();
    void onRejectClicked();
    void onStartClicked();
    void onCancelClicked();
    void onCompleteClicked();

private:
    void updateUiForStatus(const QString &status);
    void loadPatientMedicalRecord(int patientId);
    void loadServices();
    void changeStatus(const QString &newStatus);

    QPushButton *createToothButton(int number);
    void updateToothStyle(QPushButton *btn, const QString &status);
    void applyTeeth(const QVector<Tooth> &teeth);

    AppointmentDetailController *m_controller;
    Appointment m_currentAppt;
    double m_totalCost = 0.0;
    QMap<int, double> m_servicePrices;

    QGridLayout *m_gridLayout = nullptr;
    QMap<int, QPushButton*> m_teethButtons;
    QMap<int, QString> m_teethConditions;

    QLabel *m_dateTimeLabel = nullptr;
    QLabel *m_statusBadge = nullptr;

    QLabel *m_patientNameLabel = nullptr;
    QLabel *m_serviceLabel = nullptr;
    QLabel *m_doctorSpecialtyLabel = nullptr;
    QLabel *m_notesInfoLabel = nullptr;

    QLabel *m_fdiHintLabel = nullptr;

    QComboBox   *m_servicesCombo = nullptr;
    QListWidget *m_treatmentsList = nullptr;
    QLabel      *m_totalLabel = nullptr;
    QTextEdit   *m_notesEdit = nullptr;
    QTextEdit   *m_diagnosisEdit = nullptr;

    QStackedWidget *m_leftPanelStack = nullptr;
    QStackedWidget *m_statusControlsStack = nullptr;
    QTextEdit      *m_doctorNotesEdit = nullptr;

    QPushButton *m_confirmBtn = nullptr;
    QPushButton *m_rejectBtn = nullptr;
    QPushButton *m_startBtn = nullptr;
    QPushButton *m_cancelBtn = nullptr;
    QPushButton *m_completeBtn = nullptr;

    QSet<int> m_treatedTeeth;

    void downloadAndOpenReceipt(const QString& urlStr);
    QTemporaryDir m_tempDir;
};

#endif // APPOINTMENTDETAILVIEW_H
