#include "addappointmentdialog.h"
#include "../controllers/addappointmentcontroller.h"
#include "../utils/uihelpers.h"
#include <QGraphicsDropShadowEffect>
#include <QMessageBox>
#include <QApplication>
#include <QLineEdit>
#include <QPointer>
#include <QAbstractItemView>
#include <QScrollArea>

AddAppointmentDialog::AddAppointmentDialog(int doctorId, QWidget *parent)
    : QDialog(parent), m_controller(new AddAppointmentController(this)), m_currentDoctorId(doctorId) {
    m_currentDoctorId = doctorId;

    setWindowTitle("Створити запис на прийом");

    setFixedWidth(600);

    setWindowFlags(Qt::Dialog | Qt::FramelessWindowHint);
    setAttribute(Qt::WA_TranslucentBackground);
    setModal(true);

    m_timeSlotsLayout = nullptr;
    m_timeButtonGroup = nullptr;
    m_timeSlotsContainer = nullptr;

    setupUi();

    m_searchTimer = new QTimer(this);
    m_searchTimer->setSingleShot(true);
    m_searchTimer->setInterval(1000);

    connect(m_patientSearchCombo->lineEdit(), &QLineEdit::textEdited,
            this, [this]() { m_searchTimer->start(); });

    connect(m_searchTimer, &QTimer::timeout,
            this, &AddAppointmentDialog::performPatientSearch);

    connect(m_controller, &AddAppointmentController::appointmentCreated,
            this, &AddAppointmentDialog::onAppointmentCreated);

    connect(m_patientSearchCombo, QOverload<int>::of(&QComboBox::activated),
            this, &AddAppointmentDialog::onPatientSelected);

    connect(m_createPatientButton, &QPushButton::clicked,
            this, &AddAppointmentDialog::onCreatePatientClicked);

    connect(m_saveButton, &QPushButton::clicked,
            this, &AddAppointmentDialog::onSaveClicked);

    connect(m_cancelButton, &QPushButton::clicked,
            this, &AddAppointmentDialog::onCancelClicked);

    connect(m_completer, QOverload<const QString&>::of(&QCompleter::activated),
            this, &AddAppointmentDialog::onCompleterActivated);

    connect(m_dateEdit, &QDateEdit::dateChanged, this, &AddAppointmentDialog::loadAvailableSlots);

    connect(m_serviceCombo, QOverload<int>::of(&QComboBox::currentIndexChanged), this, &AddAppointmentDialog::loadAvailableSlots);

    m_controller->getServices([this](bool success, const QVector<Service>& services, const QString& error) {
        if (success) {
            m_serviceCombo->blockSignals(true);
            for (const auto& s : services) {
                m_serviceCombo->addItem(s.name, s.id);
            }
            m_serviceCombo->blockSignals(false);
            loadAvailableSlots();
        } else {
            m_statusLabel->setText("Помилка завантаження послуг: " + error);
            m_statusLabel->show();
        }
    });
}

void AddAppointmentDialog::setupUi() {
    QWidget *container = new QWidget(this);
    container->setObjectName("patientCard");

    addShadow(container);

    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(15, 15, 15, 15);
    mainLayout->addWidget(container);

    mainLayout->setSizeConstraint(QLayout::SetFixedSize);

    QVBoxLayout *layout = new QVBoxLayout(container);
    layout->setContentsMargins(24, 24, 24, 24);
    layout->setSpacing(12);

    QLabel *titleLabel = new QLabel("Новий запис", this);
    titleLabel->setObjectName("dialogTitle");
    titleLabel->setAlignment(Qt::AlignCenter);
    layout->addWidget(titleLabel);
    layout->addSpacing(6);

    layout->addWidget(fieldLbl("Пошук існуючого пацієнта:", this));
    m_patientSearchCombo = new QComboBox(this);
    m_patientSearchCombo->setEditable(true);
    m_patientSearchCombo->lineEdit()->setPlaceholderText("Введіть ПІБ або телефон...");
    m_patientSearchCombo->setInsertPolicy(QComboBox::NoInsert);
    layout->addWidget(m_patientSearchCombo);

    m_completerModel = new QStringListModel(this);
    m_completer = new QCompleter(m_completerModel, this);
    m_completer->setCompletionMode(QCompleter::UnfilteredPopupCompletion);
    m_completer->setCaseSensitivity(Qt::CaseInsensitive);
    m_patientSearchCombo->setCompleter(m_completer);

    if (QAbstractItemView *popup = m_completer->popup()) {
        popup->setWindowFlags(Qt::Popup | Qt::FramelessWindowHint | Qt::NoDropShadowWindowHint);
    }

    m_patientCard = new QFrame(this);
    m_patientCard->setObjectName("patientCard");
    m_patientCard->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Minimum);

    QVBoxLayout *patientLayout = new QVBoxLayout(m_patientCard);
    patientLayout->setContentsMargins(16, 16, 16, 16);
    patientLayout->setSpacing(8);

    QHBoxLayout *cardHeaderLayout = new QHBoxLayout();
    m_patientCardTitle = new QLabel("Дані пацієнта", m_patientCard);
    m_patientCardTitle->setObjectName("sectionTitle");

    m_createPatientButton = new QPushButton("Очистити / Створити нового", m_patientCard);
    m_createPatientButton->setObjectName("linkButton");
    m_createPatientButton->setCursor(Qt::PointingHandCursor);

    cardHeaderLayout->addWidget(m_patientCardTitle);
    cardHeaderLayout->addStretch();
    cardHeaderLayout->addWidget(m_createPatientButton);
    patientLayout->addLayout(cardHeaderLayout);
    patientLayout->addSpacing(4);

    QHBoxLayout *namesLayout = new QHBoxLayout();
    namesLayout->setSpacing(12);

    QVBoxLayout *fnLayout = new QVBoxLayout();
    QLabel* fnLbl = fieldLbl("Ім'я:", m_patientCard);
    fnLbl->setMinimumHeight(20);
    m_firstNameEdit = new QLineEdit(m_patientCard);
    m_firstNameEdit->setMinimumHeight(36);
    fnLayout->addWidget(fnLbl);
    fnLayout->addWidget(m_firstNameEdit);

    QVBoxLayout *lnLayout = new QVBoxLayout();
    QLabel* lnLbl = fieldLbl("Прізвище:", m_patientCard);
    lnLbl->setMinimumHeight(20);
    m_lastNameEdit = new QLineEdit(m_patientCard);
    m_lastNameEdit->setMinimumHeight(36);
    lnLayout->addWidget(lnLbl);
    lnLayout->addWidget(m_lastNameEdit);

    namesLayout->addLayout(fnLayout);
    namesLayout->addLayout(lnLayout);
    patientLayout->addLayout(namesLayout);

    QLabel* phLbl = fieldLbl("Телефон:", m_patientCard);
    phLbl->setMinimumHeight(20);
    m_phoneEdit = new QLineEdit(m_patientCard);
    m_phoneEdit->setMinimumHeight(36);
    patientLayout->addWidget(phLbl);
    patientLayout->addWidget(m_phoneEdit);

    layout->addWidget(m_patientCard);

    // === БЛОК ДАТИ ТА ПОСЛУГИ ===
    QHBoxLayout *dateServiceLayout = new QHBoxLayout();
    dateServiceLayout->setSpacing(12);

    QVBoxLayout *dateLayout = new QVBoxLayout();
    dateLayout->addWidget(fieldLbl("Дата прийому:", this));
    m_dateEdit = new QDateEdit(QDate::currentDate(), this);
    m_dateEdit->setCalendarPopup(true);
    m_dateEdit->setMinimumDate(QDate::currentDate());
    m_dateEdit->setMinimumHeight(36);
    dateLayout->addWidget(m_dateEdit);

    QVBoxLayout *serviceLayout = new QVBoxLayout();
    serviceLayout->addWidget(fieldLbl("Послуга:", this));
    m_serviceCombo = new QComboBox(this);
    m_serviceCombo->setMinimumHeight(36);
    serviceLayout->addWidget(m_serviceCombo);

    dateServiceLayout->addLayout(dateLayout);
    dateServiceLayout->addLayout(serviceLayout);
    layout->addLayout(dateServiceLayout);

    // === КОНТЕЙНЕР ДЛЯ ДИНАМІЧНИХ КНОПОК ===
    layout->addWidget(fieldLbl("Доступні години:", this));

    QScrollArea *timeScroll = new QScrollArea(this);
    timeScroll->setWidgetResizable(true);
    timeScroll->setFrameShape(QFrame::NoFrame);
    timeScroll->setStyleSheet("QScrollArea { background: transparent; border: none; }");
    timeScroll->setMinimumHeight(110);
    timeScroll->setMaximumHeight(130);

    m_timeSlotsContainer = new QWidget();
    m_timeSlotsContainer->setStyleSheet("background: transparent;");

    m_timeSlotsLayout = new QGridLayout(m_timeSlotsContainer);
    m_timeSlotsLayout->setContentsMargins(0, 0, 0, 0);
    m_timeSlotsLayout->setSpacing(8);
    m_timeSlotsLayout->setAlignment(Qt::AlignTop);

    timeScroll->setWidget(m_timeSlotsContainer);

    m_timeButtonGroup = new QButtonGroup(this);
    m_timeButtonGroup->setExclusive(true);
    connect(m_timeButtonGroup, QOverload<int>::of(&QButtonGroup::idClicked), this, &AddAppointmentDialog::onTimeSlotSelected);

    m_timeSlotsStatusLabel = new QLabel("Оберіть послугу, щоб побачити години", m_timeSlotsContainer);
    m_timeSlotsStatusLabel->setStyleSheet("color: #6b7280; font-style: italic;");
    m_timeSlotsLayout->addWidget(m_timeSlotsStatusLabel, 0, 0);

    layout->addWidget(timeScroll);

    // === НОТАТКИ ТА КНОПКИ ===
    layout->addWidget(fieldLbl("Нотатки (опціонально):", this));
    m_notesEdit = new QTextEdit(this);
    m_notesEdit->setMaximumHeight(60);
    m_notesEdit->setPlaceholderText("Додаткові побажання або інформація...");
    layout->addWidget(m_notesEdit);

    m_statusLabel = new QLabel("", this);
    m_statusLabel->setStyleSheet("color: #ef4444; font-weight: 600; font-size: 13px;");
    m_statusLabel->hide();
    layout->addWidget(m_statusLabel);

    layout->addStretch();

    QHBoxLayout *buttonsLayout = new QHBoxLayout();
    buttonsLayout->setSpacing(12);
    buttonsLayout->addStretch();

    m_cancelButton = new QPushButton("Скасувати", this);
    m_cancelButton->setObjectName("secondaryButton");
    m_cancelButton->setCursor(Qt::PointingHandCursor);
    buttonsLayout->addWidget(m_cancelButton);

    m_saveButton = new QPushButton("Зберегти запис", this);
    m_saveButton->setObjectName("primaryButton");
    m_saveButton->setCursor(Qt::PointingHandCursor);
    buttonsLayout->addWidget(m_saveButton);

    layout->addLayout(buttonsLayout);

    updatePatientFields(true);
}

void AddAppointmentDialog::clearTimeSlots() {
    if (m_timeSlotsLayout) {
        QLayoutItem *item;
        while ((item = m_timeSlotsLayout->takeAt(0)) != nullptr) {
            if (QWidget *widget = item->widget()) {
                widget->hide();
                widget->deleteLater();
            }
            delete item;
        }
    }

    if (m_timeButtonGroup) {
        m_timeButtonGroup->deleteLater();
    }

    m_timeButtonGroup = new QButtonGroup(this);
    m_timeButtonGroup->setExclusive(true);
    connect(m_timeButtonGroup, QOverload<int>::of(&QButtonGroup::idClicked),
            this, &AddAppointmentDialog::onTimeSlotSelected);

    m_selectedTimeStr.clear();
}

void AddAppointmentDialog::loadAvailableSlots() {
    if (m_serviceCombo->count() == 0 || !m_timeSlotsLayout) return;
    clearTimeSlots();
    m_timeSlotsStatusLabel = new QLabel("Шукаємо вільні години...", this);
    m_timeSlotsStatusLabel->setStyleSheet("color: #6b7280; font-style: italic;");
    m_timeSlotsLayout->addWidget(m_timeSlotsStatusLabel, 0, 0);

    int serviceId = m_serviceCombo->currentData().toInt();
    QDate selectedDate = m_dateEdit->date();

    QPointer<AddAppointmentDialog> safeThis(this);

    m_controller->getAvailableSlots(m_currentDoctorId, selectedDate, serviceId,
        [safeThis](bool success, const QStringList& timeSlots, const QString& error) {
            if (!safeThis) return;
            QMetaObject::invokeMethod(safeThis, [safeThis, success, timeSlots, error]() {
                safeThis->clearTimeSlots();

                if (!success) {
                    safeThis->m_timeSlotsStatusLabel = new QLabel("Помилка: " + error, safeThis.data());
                    safeThis->m_timeSlotsStatusLabel->setStyleSheet("color: #ef4444;");
                    safeThis->m_timeSlotsLayout->addWidget(safeThis->m_timeSlotsStatusLabel, 0, 0);
                    return;
                }

                if (timeSlots.isEmpty()) {
                    safeThis->m_timeSlotsStatusLabel = new QLabel("На цей день немає вільних годин.", safeThis.data());
                    safeThis->m_timeSlotsStatusLabel->setStyleSheet("color: #6b7280;");
                    safeThis->m_timeSlotsLayout->addWidget(safeThis->m_timeSlotsStatusLabel, 0, 0);
                    return;
                }

                int col = 0;
                int row = 0;
                for (int i = 0; i < timeSlots.size(); ++i) {
                    QPushButton *timeBtn = new QPushButton(timeSlots[i], safeThis.data());

                    timeBtn->setObjectName("timeSlotBtn");

                    timeBtn->setCheckable(true);
                    timeBtn->setCursor(Qt::PointingHandCursor);
                    timeBtn->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
                    timeBtn->setMinimumHeight(35);

                    safeThis->m_timeButtonGroup->addButton(timeBtn, i);
                    safeThis->m_timeSlotsLayout->addWidget(timeBtn, row, col);

                    col++;
                    if (col >= 5) {
                        col = 0;
                        row++;
                    }
                }
            });
        }
    );
}

void AddAppointmentDialog::onTimeSlotSelected(int buttonId) {
    QPushButton *button = qobject_cast<QPushButton*>(m_timeButtonGroup->button(buttonId));
    if (button) {
        m_selectedTimeStr = button->text();
    }
}

void AddAppointmentDialog::onSaveClicked() {
    if (m_isNewPatient) {
        if (m_firstNameEdit->text().trimmed().isEmpty() ||
            m_lastNameEdit->text().trimmed().isEmpty() ||
            m_phoneEdit->text().trimmed().isEmpty()) {
            m_statusLabel->setText("Будь ласка, заповніть всі поля пацієнта");
            m_statusLabel->show();
            return;
        }
    } else {
        if (m_selectedPatient.id == 0) {
            m_statusLabel->setText("Будь ласка, оберіть пацієнта");
            m_statusLabel->show();
            return;
        }
    }

    if (m_selectedTimeStr.isEmpty()) {
        m_statusLabel->setText("Будь ласка, оберіть час прийому");
        m_statusLabel->show();
        return;
    }

    setLoading(true);
    m_statusLabel->hide();

    QPointer<AddAppointmentDialog> safeThis(this);

    if (m_isNewPatient) {
        m_controller->createPatient(
            m_firstNameEdit->text().trimmed(),
            m_lastNameEdit->text().trimmed(),
            m_phoneEdit->text().trimmed(),
            [safeThis](bool success, int patientId, const QString& error) {
                if (!safeThis) return;
                QMetaObject::invokeMethod(safeThis, [safeThis, success, patientId, error]() {
                    if (success) {
                        safeThis->createAppointmentForPatient(patientId);
                    } else {
                        safeThis->setLoading(false);
                        safeThis->m_statusLabel->setText("Помилка створення пацієнта: " + error);
                        safeThis->m_statusLabel->show();
                    }
                });
            });
    } else {
        createAppointmentForPatient(m_selectedPatient.id);
    }
}

void AddAppointmentDialog::createAppointmentForPatient(int patientId) {
    QPointer<AddAppointmentDialog> safeThis(this);
    int serviceId = m_serviceCombo->currentData().toInt();

    QTime time = QTime::fromString(m_selectedTimeStr, "HH:mm");
    QDateTime finalDateTime(m_dateEdit->date(), time);

    m_controller->createAppointment(
        patientId,
        serviceId,
        finalDateTime,
        m_notesEdit->toPlainText().trimmed(),
        [safeThis](bool success, const QString& error) {
            if (!safeThis) return;
            QMetaObject::invokeMethod(safeThis, [safeThis, success, error]() {
                safeThis->setLoading(false);
                if (success) {
                    emit safeThis->appointmentCreated();
                    safeThis->accept();
                } else {
                    safeThis->m_statusLabel->setText("Помилка створення запису: " + error);
                    safeThis->m_statusLabel->show();
                }
            });
        });
}

void AddAppointmentDialog::performPatientSearch() {
    QString text = m_patientSearchCombo->lineEdit()->text();

    if (text.trimmed().length() < 2) {
        m_completerModel->setStringList(QStringList());
        m_completer->popup()->hide();
        return;
    }

    m_statusLabel->hide();
    QPointer<AddAppointmentDialog> safeThis(this);

    m_controller->searchPatients(text,
        [safeThis, text](bool success, const QVector<Patient>& patients, const QString& error) {
            if (!safeThis) return;
            QMetaObject::invokeMethod(safeThis, [safeThis, text, success, patients, error]() {
                if (safeThis->m_patientSearchCombo->lineEdit()->text() != text) return;

                if (success) {
                    safeThis->onPatientsLoaded(patients);
                } else {
                    safeThis->m_statusLabel->setText("Помилка пошуку: " + error);
                    safeThis->m_statusLabel->show();
                }
            });
        }
    );
}

void AddAppointmentDialog::onPatientsLoaded(const QVector<Patient>& patients) {
    m_foundPatients = patients;
    QStringList suggestions;
    for (const auto& patient : patients) {
        suggestions << QString("%1 %2 (%3)").arg(patient.firstName, patient.lastName, patient.phoneNumber);
    }
    m_completerModel->setStringList(suggestions);
    if (!suggestions.isEmpty()) m_completer->complete();
    else m_completer->popup()->hide();
}

void AddAppointmentDialog::onPatientSelected(int index) {
    if (index >= 0 && index < m_foundPatients.size()) {
        m_selectedPatient = m_foundPatients[index];
        m_isNewPatient = false;
        m_patientSearchCombo->blockSignals(true);
        QString fullName = QString("%1 %2 (%3)").arg(m_selectedPatient.firstName, m_selectedPatient.lastName, m_selectedPatient.phoneNumber);
        m_patientSearchCombo->lineEdit()->setText(fullName);
        m_patientSearchCombo->blockSignals(false);
        updatePatientFields(false);
    }
}

void AddAppointmentDialog::onCompleterActivated(const QString& text) {
    for(int i = 0; i < m_foundPatients.size(); ++i) {
        QString itemText = QString("%1 %2 (%3)").arg(m_foundPatients[i].firstName, m_foundPatients[i].lastName, m_foundPatients[i].phoneNumber);
        if (itemText == text) {
            onPatientSelected(i);
            break;
        }
    }
}

void AddAppointmentDialog::onCreatePatientClicked() {
    m_isNewPatient = true;
    m_patientSearchCombo->blockSignals(true);
    m_patientSearchCombo->clear();
    m_patientSearchCombo->lineEdit()->clear();
    m_patientSearchCombo->blockSignals(false);
    updatePatientFields(true);
}

void AddAppointmentDialog::onCancelClicked() { reject(); }
void AddAppointmentDialog::onAppointmentCreated() {}

void AddAppointmentDialog::updatePatientFields(bool isNewPatient) {
    m_isNewPatient = isNewPatient;
    if (isNewPatient) {
        m_patientCardTitle->setText("Створення нового пацієнта");
        m_firstNameEdit->setEnabled(true);
        m_lastNameEdit->setEnabled(true);
        m_phoneEdit->setEnabled(true);
        clearPatientFields();
        m_createPatientButton->hide();
    } else {
        m_patientCardTitle->setText("Обраний пацієнт");
        m_firstNameEdit->setEnabled(false);
        m_lastNameEdit->setEnabled(false);
        m_phoneEdit->setEnabled(false);
        if (m_selectedPatient.id != 0) {
            m_firstNameEdit->setText(m_selectedPatient.firstName);
            m_lastNameEdit->setText(m_selectedPatient.lastName);
            m_phoneEdit->setText(m_selectedPatient.phoneNumber);
        }
        m_createPatientButton->show();
    }
}

void AddAppointmentDialog::clearPatientFields() {
    m_firstNameEdit->clear();
    m_lastNameEdit->clear();
    m_phoneEdit->clear();
}

void AddAppointmentDialog::setLoading(bool loading) {
    m_isLoading = loading;
    m_saveButton->setEnabled(!loading);
    m_cancelButton->setEnabled(!loading);
    if (loading) {
        m_saveButton->setText("Збереження...");
        QApplication::setOverrideCursor(Qt::WaitCursor);
    } else {
        m_saveButton->setText("Зберегти запис");
        QApplication::restoreOverrideCursor();
    }
}
