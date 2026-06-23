#ifndef PATIENTDETAILVIEW_H
#define PATIENTDETAILVIEW_H

#include <QWidget>
#include <QTabWidget>
#include <QLabel>
#include <QGridLayout>
#include <QVBoxLayout>
#include <QPushButton>
#include "../models/models.h"

class PatientDetailController;
class TreatmentHistoryWidget;

class PatientDetailView : public QWidget {
    Q_OBJECT

public:
    explicit PatientDetailView(QWidget *parent = nullptr);
    void setPatientId(int patientId);
    void displayPatientInfo(const Patient &patient);
    void displayDentalChart(const MedicalRecord &record);
    void displayTreatmentHistory(const MedicalRecord &record);
    void displayNoDentalChart();
    void displayDentalChartError(const QString &error);
    void displayError(const QString &error);


signals:
    void backClicked();

private:
    void setupUi();
    void applyStyles();
    void createPersonalInfoTab();
    void createDentalChartTab();
    void createTreatmentHistoryTab();
    void fillPersonalInfo(const Patient &patient);
    void fillDentalChart(const MedicalRecord &record);

    int m_patientId = 0;
    PatientDetailController *m_controller;

    QTabWidget *m_tabWidget;
    QPushButton *m_backButton;
    QLabel *m_patientNameLabel;
    QLabel *m_errorLabel;

    QPushButton* createToothButton(int number);
    void updateToothStyle(QPushButton *btn, const QString &status);
    QMap<int, QPushButton*> m_toothButtons;

    // Особиста інофрмація
    QLabel *m_fullNameValue;
    QLabel *m_phoneValue;
    QLabel *m_emailValue;
    QLabel *m_ageValue;
    QLabel *m_genderValue;
    QLabel *m_addressValue;
    QLabel *m_notesValue;

    // FDI
    QGridLayout *m_dentalGridLayout;
    QWidget *m_dentalChartContainer;
    QLabel *m_noDentalChartLabel;

    // Історія лікувань
    QWidget *m_treatmentContainer;
    TreatmentHistoryWidget *m_treatmentHistoryWidget;
};

#endif // PATIENTDETAILVIEW_H
