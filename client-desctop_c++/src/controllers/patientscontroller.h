#ifndef PATIENTSCONTROLLER_H
#define PATIENTSCONTROLLER_H

#include <QObject>
#include <QVector>
#include <QTimer>
#include "../models/models.h"

class PatientsView;

class PatientsController : public QObject {
    Q_OBJECT

public:
    explicit PatientsController(QObject *parent = nullptr);
    void setView(PatientsView *view);
    void searchPatients(const QString &query);

    void performSearch(const QString &query);
private slots:
    void onSearchDebounceTimeout();

private:
    PatientsView *m_view = nullptr;
    QTimer m_searchDebounceTimer;
    QString m_pendingQuery;

};

#endif // PATIENTSCONTROLLER_H
