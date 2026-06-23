#ifndef PATIENTSVIEW_H
#define PATIENTSVIEW_H

#include <QWidget>
#include <QLineEdit>
#include <QScrollArea>
#include <QVBoxLayout>
#include <QLabel>
#include <QShowEvent>
#include "../models/models.h"

class PatientsController;

class PatientsView : public QWidget {
    Q_OBJECT

public:
    explicit PatientsView(QWidget *parent = nullptr);
    void displayPatients(const QVector<Patient> &patients);
    void displayError(const QString &error);

signals:
    void searchQueryChanged(const QString &query);
    void patientSelected(int patientId);

protected:
    void showEvent(QShowEvent *event) override;

private slots:
    void onSearchTextChanged(const QString &text);
    void setPage(int page);

private:
    void setupUi();
    void applyStyles();
    void renderPage();
    void updatePaginationUi();

    QLineEdit *m_searchInput;
    QWidget *m_patientsContainer;
    QVBoxLayout *m_patientsLayout;
    QLabel *m_messageLabel;
    PatientsController *m_controller;

    QVector<Patient> m_allPatients;
    int m_currentPage = 1;
    const int ITEMS_PER_PAGE = 6;
    QWidget *m_paginationContainer;
    QHBoxLayout *m_paginationLayout;
};

#endif // PATIENTSVIEW_H
