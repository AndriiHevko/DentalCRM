#include "appointmentdetailview.h"
#include "../controllers/appointmentdetailcontroller.h"
#include "../utils/uihelpers.h"

#include <QDesktopServices>
#include <QScrollArea>
#include <QHBoxLayout>
#include <QFrame>
#include <QMenu>
#include <QMessageBox>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>
#include <QGraphicsDropShadowEffect>
#include <QDateTime>

AppointmentDetailView::AppointmentDetailView(QWidget *parent)
    : QWidget(parent)
{
    m_controller = new AppointmentDetailController(this);
    connect(m_controller, &AppointmentDetailController::appointmentLoaded, this, &AppointmentDetailView::onAppointmentLoaded);
    connect(m_controller, &AppointmentDetailController::statusChanged, this, &AppointmentDetailView::onStatusChanged);
    connect(m_controller, &AppointmentDetailController::appointmentCompleted, this, &AppointmentDetailView::onAppointmentCompleted);
    setupUi();
}

void AppointmentDetailView::setupUi() {
    AppointmentDetailViewUi::buildUi(this);
}

void AppointmentDetailView::loadAppointment(int id) {
    m_controller->loadAppointment(id);
}

void AppointmentDetailView::loadAppointment(const Appointment &appt) {
    m_controller->loadAppointment(appt);
}

void AppointmentDetailView::onAppointmentLoaded(const Appointment &appt) {
    m_treatedTeeth.clear();
    loadServices();
    m_currentAppt = appt;
    QString normalizedStatus = appt.status.trimmed().toLower();

    m_dateTimeLabel->setText(appt.dateTime.toString("dd MMMM yyyy,  HH:mm"));

    QString badgeStyle;
    if (normalizedStatus == "scheduled") {
        badgeStyle = "background:#D1FAE5; color:#065F46;";
    } else if (normalizedStatus == "in_progress") {
        badgeStyle = "background:#EDE9FE; color:#5B21B6;";
    } else if (normalizedStatus == "pending") {
        badgeStyle = "background:#FEF3C7; color:#92400E;";
    } else if (normalizedStatus == "done") {
        badgeStyle = "background:#DBEAFE; color:#1E40AF;";
    } else {
        badgeStyle = "background:#FEE2E2; color:#991B1B;";
    }
    m_statusBadge->setText("  " + appt.statusDisplay() + "  ");
    m_statusBadge->setStyleSheet(
        badgeStyle + "border-radius:12px; font-weight:600; padding:3px 10px;");

    m_patientNameLabel->setText(appt.patientName.isEmpty() ? "—" : appt.patientName);
    m_serviceLabel->setText(appt.serviceName.isEmpty() ? "—" : appt.serviceName);
    m_doctorSpecialtyLabel->setText(appt.doctorSpecialty.isEmpty() ? "—" : appt.doctorSpecialty);
    m_notesInfoLabel->setText(appt.notes.isEmpty() ? "(немає примітки)" : appt.notes);

    for (auto it = m_teethConditions.begin(); it != m_teethConditions.end(); ++it)
        it.value() = "healthy";
    for (auto it = m_teethButtons.begin(); it != m_teethButtons.end(); ++it)
        updateToothStyle(it.value(), "healthy");

    updateUiForStatus(normalizedStatus);

    if (appt.patientId > 0) {
        loadPatientMedicalRecord(appt.patientId);
    }
}

void AppointmentDetailView::loadPatientMedicalRecord(int patientId) {
    m_controller->loadPatientMedicalRecord(patientId,
        [this](const MedicalRecord &mr) {
            applyTeeth(mr.dentalChart);
        },
        [](const QString&) {}
    );
}

void AppointmentDetailView::onStatusChanged(bool success) {
    if (success) {
        loadAppointment(m_currentAppt.id);
        emit appointmentStatusChanged();
    } else {
        QMessageBox::critical(this, "Помилка", "Не вдалося змінити статус");
    }
}

void AppointmentDetailView::onAppointmentCompleted(bool success, const QString& receiptUrl, bool requiresPrinting) {
    if (success) {
        if (requiresPrinting && !receiptUrl.isEmpty()) {
            QMessageBox msgBox(this);
            msgBox.setWindowTitle("Завершення прийому");
            msgBox.setText("Запис успішно завершено та оплачено.");
            msgBox.setInformativeText("Цей пацієнт не зареєстрований у додатку. Потрібно видати йому чек.");
            msgBox.setIcon(QMessageBox::Information);

            QPushButton *downloadBtn = msgBox.addButton("Завантажити квитанцію", QMessageBox::ActionRole);
            QPushButton *closeBtn = msgBox.addButton("Продовжити без друку", QMessageBox::RejectRole);

            downloadBtn->setStyleSheet("background-color: #3B82F6; color: white; padding: 5px 15px; border-radius: 4px;");

            msgBox.exec();

            if (msgBox.clickedButton() == downloadBtn) {
                downloadAndOpenReceipt(receiptUrl);
            }
        } else {
            QMessageBox::information(this, "Успіх",
                "Запис завершено та оплачено.\nЕлектронний чек автоматично відправлено в особистий кабінет пацієнта.");
        }

        emit backRequested();
    } else {
        QMessageBox::critical(this, "Помилка", "Не вдалося завершити запис та провести оплату.");
    }
}

void AppointmentDetailView::downloadAndOpenReceipt(const QString& urlStr) {
    QUrl url(urlStr);
    QNetworkAccessManager *manager = new QNetworkAccessManager(this);
    QNetworkRequest request(url);

    QNetworkReply *reply = manager->get(request);

    connect(reply, &QNetworkReply::finished, [this, reply, manager]() {
        if (reply->error() == QNetworkReply::NoError) {
            if (!m_tempDir.isValid()) {
                qDebug() << "Не вдалося створити тимчасову папку";
                return;
            }

            QString filePath = m_tempDir.path() + "/receipt.pdf";
            QFile file(filePath);
            if (file.open(QIODevice::WriteOnly)) {
                file.write(reply->readAll());
                file.close();

                QDesktopServices::openUrl(QUrl::fromLocalFile(filePath));
            }
        } else {
            QMessageBox::warning(this, "Помилка завантаження", "Не вдалося завантажити чек: " + reply->errorString());
        }
        reply->deleteLater();
        manager->deleteLater();
    });
}

void AppointmentDetailView::updateUiForStatus(const QString &rawStatus) {
    QString status = rawStatus.trimmed().toLower();

    if (m_fdiHintLabel) {
        m_fdiHintLabel->setVisible(status != "in_progress");
    }

    bool isTreatmentActive = (status == "in_progress");
    for (auto it = m_teethButtons.begin(); it != m_teethButtons.end(); ++it) {
        it.value()->setEnabled(isTreatmentActive);
    }

    if (status == "pending") {
        m_leftPanelStack->setCurrentIndex(0);
        m_statusControlsStack->parentWidget()->setVisible(true);
        m_statusControlsStack->setCurrentIndex(0);
    } else if (status == "scheduled") {
        m_leftPanelStack->setCurrentIndex(0);
        m_statusControlsStack->parentWidget()->setVisible(true);
        m_statusControlsStack->setCurrentIndex(1);
    } else if (status == "in_progress") {
        m_leftPanelStack->setCurrentIndex(1);
        m_statusControlsStack->parentWidget()->setVisible(true);
        m_statusControlsStack->setCurrentIndex(2);
    } else {
        m_leftPanelStack->setCurrentIndex(0);
        m_statusControlsStack->parentWidget()->setVisible(false);
    }
}

void AppointmentDetailView::onConfirmClicked() {
    m_currentAppt.status = "scheduled";
    updateUiForStatus(m_currentAppt.status);
    m_controller->changeStatus(m_currentAppt.id, "scheduled");
}

void AppointmentDetailView::onRejectClicked() {
    m_currentAppt.status = "cancelled";
    updateUiForStatus(m_currentAppt.status);
    m_controller->changeStatus(m_currentAppt.id, "cancelled");
}

void AppointmentDetailView::onStartClicked() {
    // ===== ВАЛІДАЦІЯ ПРИЙОМУ =====
    // QDateTime now = QDateTime::currentDateTime();
    // QDateTime startTime = m_currentAppt.dateTime;

    // // Триивалість запису за замовчуванням 60 хвилин, якщо не вказано
    // QDateTime endTime = m_currentAppt.endTime();

    // // Можливість почати прийом за 15 хвилин до початку
    // QDateTime allowedStart = startTime.addSecs(-15 * 60);

    // // Можливість почати із запізненням, але не пізніше, ніж через 30 хвилин після завершення
    // QDateTime allowedEnd = endTime.addSecs(30 * 60);

    // // Перевірка чи не зарано
    // if (now < allowedStart) {
    //     QMessageBox::warning(this, "Увага",
    //                          QString("Ще занадто рано починати цей прийом. "
    //                                  "Ви зможете почати його з %1.")
    //                              .arg(allowedStart.toString("HH:mm")));
    //     return;
    // }

    // // Перевірка чи не запізно
    // if (now > allowedEnd) {
    //     QMessageBox::warning(this, "Увага",
    //                          QString("Час цього прийому вже вичерпано. "
    //                                  "Офіційний час завершення був о %1.")
    //                              .arg(endTime.toString("HH:mm")));
    //     return;
    // }

    // Якщо час валідний перехід до статусу in_progress
    m_currentAppt.status = "in_progress";
    updateUiForStatus(m_currentAppt.status);
    m_controller->changeStatus(m_currentAppt.id, "in_progress");
}

void AppointmentDetailView::onCancelClicked() {
    m_currentAppt.status = "cancelled";
    updateUiForStatus(m_currentAppt.status);
    m_controller->changeStatus(m_currentAppt.id, "cancelled");
}

void AppointmentDetailView::onCompleteClicked() {
    QJsonObject payload;
    QJsonArray servicesArray;

    QList<QListWidgetItem*> selectedItems = m_treatmentsList->selectedItems();

    for (QListWidgetItem *item : selectedItems) {
        int serviceId = item->data(Qt::UserRole).toInt();
        servicesArray.append(serviceId);
    }

    if (servicesArray.isEmpty()) {
        QMessageBox::warning(this, "Увага", "Будь ласка, виберіть хоча б одну послугу для виставлення рахунку.");
        return;
    }

    payload["performed_services"] = servicesArray;
    payload["services"] = servicesArray;
    payload["doctor"] = m_currentAppt.doctorId;

    if (m_diagnosisEdit) {
        QString diagnosis = m_diagnosisEdit->toPlainText().trimmed();
        if (diagnosis.isEmpty()) {
            QMessageBox::warning(this, "Увага", "Вкажіть діагноз для створення запису лікування.");
            return;
        }
        payload["diagnosis"] = diagnosis;
    }

    if (m_doctorNotesEdit) {
        QString notes = m_doctorNotesEdit->toPlainText().trimmed();
        payload["notes"] = notes;
        payload["medical_record_notes"] = notes;
    }

    QJsonObject dentalChartUpdates;
    for (auto it = m_teethConditions.begin(); it != m_teethConditions.end(); ++it) {
        if (it.value() != "healthy") {
            QJsonObject toothObj;
            toothObj["status"] = it.value();
            dentalChartUpdates[QString::number(it.key())] = toothObj;
        }
    }
    payload["dental_chart_updates"] = dentalChartUpdates;

    QJsonArray treatedTeethArray;
    for (int t : m_treatedTeeth) {
        treatedTeethArray.append(t);
    }
    payload["treated_teeth"] = treatedTeethArray;

    m_controller->completeAppointment(m_currentAppt.id, payload);

    m_currentAppt.status = "done";
    updateUiForStatus(m_currentAppt.status);
    emit appointmentStatusChanged();
}

QPushButton *AppointmentDetailView::createToothButton(int number) {
    QPushButton *btn = new QPushButton(QString::number(number));

    btn->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    btn->setMinimumSize(30, 42);
    btn->setMaximumSize(55, 65);
    btn->setEnabled(false);

    btn->setCursor(Qt::PointingHandCursor);
    connect(btn, &QPushButton::clicked, this, [this, number]() {
        onToothClicked(number);
    });
    m_teethButtons[number]    = btn;
    m_teethConditions[number] = "healthy";
    updateToothStyle(btn, "healthy");
    return btn;
}

void AppointmentDetailView::updateToothStyle(QPushButton *btn, const QString &status) {
    btn->setProperty("toothClass", true);
    btn->setProperty("toothState", status.toLower());
    btn->style()->unpolish(btn);
    btn->style()->polish(btn);
}

void AppointmentDetailView::applyTeeth(const QVector<Tooth> &teeth) {
    for (const Tooth &t : teeth) {
        if (m_teethButtons.contains(t.toothNumber)) {
            m_teethConditions[t.toothNumber] = t.status;
            updateToothStyle(m_teethButtons[t.toothNumber], t.status);
        }
    }
}

void AppointmentDetailView::onToothClicked(int toothNumber) {
    // Взаємодія якщо статус in_progress
    if (m_currentAppt.status.trimmed().toLower() == "in_progress") {
        m_treatedTeeth.insert(toothNumber);
        QString current = m_teethConditions.value(toothNumber, "healthy");
        QString next = "healthy";
        if (current == "healthy") next = "caries";
        else if (current == "caries") next = "filling";
        else if (current == "filling") next = "extracted";

        m_teethConditions[toothNumber] = next;
        updateToothStyle(m_teethButtons[toothNumber], next);
    }
}

void AppointmentDetailView::loadServices() {
    m_controller->loadServices(
        [this](const QJsonArray &arr) {
            m_treatmentsList->clear();
            m_servicePrices.clear();

            for (const QJsonValue &v : arr) {
                QJsonObject obj = v.toObject();
                int id = obj["id"].toInt();
                QString name = obj["name"].toString();

                double price = 0.0;
                if (obj.contains("price")) {
                    QJsonValue val = obj["price"];
                    price = val.isString() ? val.toString().toDouble() : val.toDouble();
                } else if (obj.contains("cost")) {
                    QJsonValue val = obj["cost"];
                    price = val.isString() ? val.toString().toDouble() : val.toDouble();
                }

                m_servicePrices[id] = price;

                QListWidgetItem *item = new QListWidgetItem(QString("%1  —  %2 грн").arg(name).arg(price, 0, 'f', 2));
                item->setData(Qt::UserRole, id);

                m_treatmentsList->addItem(item);
            }
        },
        [this](const QString &err) {
            qDebug() << "Не вдалося завантажити послуги:" << err;
        });
}
