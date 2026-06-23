#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QStackedWidget>
#include <QListWidget>
#include <QLabel>
#include <QJsonDocument>
#include "views/workinghoursview.h"

class PatientsView;
class PatientDetailView;
class SettingsWidget;

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget *parent = nullptr);

private slots:
    void onNavigationChanged(int index);
    void onLogoutClicked();
    void onThemeChanged(const QString& theme);

private:
    void applyTheme(const QString& theme);
    void onAddAppointmentRequested();
    void onPatientSelected(int patientId);

    WorkingHoursView *m_workingHoursView;

private:
    void setupUi();
    void setupSidebar();
    void setupScreens();
    void fetchUserProfile();
    int m_currentDoctorId = 0;

    QStackedWidget *m_stackedWidget;
    QListWidget    *m_sidebar;
    QLabel         *m_userLabel;
    PatientsView   *m_patientsView;
    PatientDetailView *m_patientDetailView;

protected:
    void closeEvent(QCloseEvent *event) override;
};

#endif // MAINWINDOW_H
