#ifndef ADDAPPOINTMENTDIALOG_H
#define ADDAPPOINTMENTDIALOG_H

#include <QDialog>
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QGridLayout>
#include <QComboBox>
#include <QDateEdit>
#include <QTextEdit>
#include <QListWidget>
#include <QTimer>
#include <QFrame>
#include <QButtonGroup>
#include "../models/models.h"

#include <QCompleter>
#include <QStringListModel>

class AddAppointmentController;

class AddAppointmentDialog : public QDialog {
    Q_OBJECT
public:
    explicit AddAppointmentDialog(int doctorId, QWidget *parent = nullptr);

signals:
    void appointmentCreated();

private slots:
    void performPatientSearch();
    void onPatientSelected(int index);
    void onCreatePatientClicked();
    void onSaveClicked();
    void onCancelClicked();

    void onPatientsLoaded(const QVector<Patient>& patients);
    void onAppointmentCreated();
    void onCompleterActivated(const QString& text);

    // Слоти з годинами
    void loadAvailableSlots();
    void onTimeSlotSelected(int buttonId);

private:
    void setupUi();
    void updatePatientFields(bool isNewPatient);
    void clearPatientFields();
    void setLoading(bool loading);
    void createAppointmentForPatient(int patientId);
    void clearTimeSlots();

    AddAppointmentController *m_controller;

    QComboBox *m_patientSearchCombo;
    QCompleter *m_completer;
    QStringListModel *m_completerModel;

    QFrame *m_patientCard;
    QLabel *m_patientCardTitle;

    QLineEdit *m_firstNameEdit;
    QLineEdit *m_lastNameEdit;
    QLineEdit *m_phoneEdit;
    QPushButton *m_createPatientButton;

    QDateEdit *m_dateEdit;
    QComboBox *m_serviceCombo;
    QTextEdit *m_notesEdit;
    QPushButton *m_saveButton;
    QPushButton *m_cancelButton;
    QLabel *m_statusLabel;

    // Контейнери для динамічних кнопок часу
    QWidget *m_timeSlotsContainer;
    QGridLayout *m_timeSlotsLayout;
    QButtonGroup *m_timeButtonGroup;
    QLabel *m_timeSlotsStatusLabel;

    // Змінні для зберігання обраного стану
    QString m_selectedTimeStr;
    int m_currentDoctorId;

    // Стан
    QVector<Patient> m_foundPatients;
    Patient m_selectedPatient;
    bool m_isNewPatient = true;
    bool m_isLoading = false;

    QTimer* m_searchTimer;
};

#endif // ADDAPPOINTMENTDIALOG_H
