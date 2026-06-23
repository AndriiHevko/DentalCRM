#include "patientdetailview.h"
#include "../controllers/patientdetailcontroller.h"
#include "../utils/uihelpers.h"
#include <QHBoxLayout>
#include <QScrollArea>
#include <QFrame>
#include <QListWidget>
#include <QListWidgetItem>
#include <QDateTime>
#include <QDesktopServices>
#include <QUrl>

class TreatmentHistoryWidget : public QWidget {
public:
    explicit TreatmentHistoryWidget(QWidget *parent = nullptr) : QWidget(parent) {
        setupUi();
    }

    void displayTreatments(const QVector<TreatmentRecord> &treatments) {
        m_listWidget->clear();
        m_listWidget->setSpacing(12);

        if (treatments.isEmpty()) {
            QListWidgetItem *item = new QListWidgetItem("Записи про лікування не знайдені");
            item->setFlags(item->flags() & ~Qt::ItemIsSelectable);
            m_listWidget->addItem(item);
            return;
        }

        QVector<TreatmentRecord> sorted = treatments;
        std::sort(sorted.begin(), sorted.end(), [](const TreatmentRecord &a, const TreatmentRecord &b) {
            return a.date > b.date;
        });

        for (const TreatmentRecord &treatment : sorted) {
            QListWidgetItem *item = new QListWidgetItem(m_listWidget);

            QWidget *card = new QWidget();
            card->setObjectName("medicalCard");
            QVBoxLayout *layout = new QVBoxLayout(card);
            layout->setContentsMargins(16, 16, 16, 16);
            layout->setSpacing(8);

            QHBoxLayout *header = new QHBoxLayout();
            QLabel *dateLbl = new QLabel(QString("<b>📅 %1</b>").arg(treatment.date));

            header->addWidget(dateLbl);
            header->addStretch();

            if (!treatment.receiptUrl.isEmpty()) {
                QPushButton *receiptBtn = new QPushButton("📥 Чек");
                receiptBtn->setCursor(Qt::PointingHandCursor);
                receiptBtn->setStyleSheet(
                    "QPushButton {"
                    "   background-color: #f1f5f9;"
                    "   color: #3b82f6;"
                    "   border: 1px solid #cbd5e1;"
                    "   border-radius: 6px;"
                    "   padding: 4px 10px;"
                    "   font-size: 13px;"
                    "   font-weight: bold;"
                    "}"
                    "QPushButton:hover {"
                    "   background-color: #e2e8f0;"
                    "   color: #2563eb;"
                    "}"
                    );

                QString url = treatment.receiptUrl;
                connect(receiptBtn, &QPushButton::clicked, [url]() {
                    QDesktopServices::openUrl(QUrl(url));
                });

                header->addWidget(receiptBtn);
                header->addSpacing(10);
            }

            QLabel *costLbl = new QLabel(QString("<b>%1 грн</b>").arg(treatment.cost, 0, 'f', 2));
            costLbl->setStyleSheet("color: #10b981; font-size: 15px;");

            header->addWidget(costLbl);
            layout->addLayout(header);

            // Інформація про діагноз
            QLabel *diagLbl = new QLabel(QString("<span style='color:#64748b;'>Діагноз:</span> %1").arg(treatment.diagnosis));
            diagLbl->setWordWrap(true);
            layout->addWidget(diagLbl);

            // Інформація про надані послуги
            QLabel *servicesLbl = new QLabel(QString("<span style='color:#64748b;'>Надані послуги:</span> %1").arg(
                treatment.services.isEmpty() ? "—" : treatment.services
                ));
            servicesLbl->setWordWrap(true);
            layout->addWidget(servicesLbl);

            // Інформація про зуби
            QLabel *teethLbl = new QLabel(QString("<span style='color:#64748b;'>Зуби:</span> %1").arg(
                treatment.teeth.isEmpty() ? "не вказано" : treatment.teeth
                ));
            teethLbl->setWordWrap(true);
            layout->addWidget(teethLbl);

            item->setSizeHint(card->sizeHint());
            m_listWidget->addItem(item);
            m_listWidget->setItemWidget(item, card);
        }
    }

private:
    void setupUi() {
        QVBoxLayout *layout = new QVBoxLayout(this);
        layout->setContentsMargins(0, 0, 0, 0);

        m_listWidget = new QListWidget(this);
        m_listWidget->setObjectName("treatmentList");
        m_listWidget->setMinimumHeight(300);
        layout->addWidget(m_listWidget);

        setStyleSheet(R"(
            #treatmentList {
                border: none;
                background-color: transparent;
                outline: none;
            }
            #treatmentList::item:selected {
                background-color: transparent;
            }
        )");
    }

    QListWidget *m_listWidget;
};

PatientDetailView::PatientDetailView(QWidget *parent)
    : QWidget(parent) {
    m_controller = new PatientDetailController(this);
    m_controller->setView(this);
    setupUi();
    applyStyles();
}

void PatientDetailView::setupUi() {
    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    QWidget *headerWidget = new QWidget(this);
    QHBoxLayout *headerLayout = new QHBoxLayout(headerWidget);
    headerLayout->setContentsMargins(32, 16, 32, 16);
    headerLayout->setSpacing(16);

    m_backButton = new QPushButton("← Назад", this);
    m_backButton->setObjectName("backButton");
    m_backButton->setMaximumWidth(100);
    m_backButton->setCursor(Qt::PointingHandCursor);
    connect(m_backButton, &QPushButton::clicked, this, &PatientDetailView::backClicked);
    headerLayout->addWidget(m_backButton);

    m_patientNameLabel = new QLabel(this);
    m_patientNameLabel->setObjectName("detailHeaderTitle");
    headerLayout->addWidget(m_patientNameLabel);
    headerLayout->addStretch();

    headerWidget->setObjectName("detailTopBar");
    mainLayout->addWidget(headerWidget);

    m_errorLabel = new QLabel(this);
    m_errorLabel->setObjectName("errorLabel");
    m_errorLabel->setStyleSheet("color: #dc2626; background-color: #fee2e2; padding: 12px; margin: 16px;");
    m_errorLabel->hide();
    mainLayout->addWidget(m_errorLabel);

    m_tabWidget = new QTabWidget(this);
    m_tabWidget->setObjectName("detailTabs");
    createPersonalInfoTab();
    createDentalChartTab();
    createTreatmentHistoryTab();
    mainLayout->addWidget(m_tabWidget);
}

void PatientDetailView::createPersonalInfoTab() {
    QWidget *tab = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(32, 32, 32, 32);
    layout->setSpacing(20);

    QWidget *formWidget = new QWidget();
    QVBoxLayout *formLayout = new QVBoxLayout(formWidget);
    formLayout->setSpacing(16);

    auto createField = [formLayout](const QString &label, QLabel *&valueLabel) {
        QHBoxLayout *fieldLayout = new QHBoxLayout();

        QLabel *labelWidget = new QLabel(label);
        labelWidget->setProperty("type", "subtitle");
        labelWidget->setMinimumWidth(120);
        labelWidget->setStyleSheet("font-weight: bold;");
        valueLabel = new QLabel();
        valueLabel->setWordWrap(true);
        fieldLayout->addWidget(labelWidget);
        fieldLayout->addWidget(valueLabel);
        fieldLayout->addStretch();
        formLayout->addLayout(fieldLayout);
    };

    createField("ПІБ:", m_fullNameValue);
    createField("Телефон:", m_phoneValue);
    createField("Email:", m_emailValue);
    createField("Вік:", m_ageValue);
    createField("Стать:", m_genderValue);
    createField("Адреса:", m_addressValue);

    QLabel *notesLabel = new QLabel("Загальні примітки:");
    notesLabel->setProperty("type", "subtitle");
    notesLabel->setStyleSheet("font-weight: bold;");
    formLayout->addWidget(notesLabel);
    m_notesValue = new QLabel();
    m_notesValue->setObjectName("patientCard");
    m_notesValue->setWordWrap(true);
    m_notesValue->setMargin(12);
    m_notesValue->setMinimumHeight(80);
    formLayout->addWidget(m_notesValue);

    formLayout->addStretch();
    layout->addWidget(formWidget);
    layout->addStretch();

    m_tabWidget->addTab(tab, "📋 Особиста інформація");
}


void PatientDetailView::createTreatmentHistoryTab() {
    QWidget *tab = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(32, 32, 32, 32);
    layout->setSpacing(16);

    QLabel *titleLabel = new QLabel("Історія лікування");
    titleLabel->setStyleSheet("font-weight: bold; color: #1e293b; font-size: 14px;");
    layout->addWidget(titleLabel);

    m_treatmentHistoryWidget = new TreatmentHistoryWidget();
    layout->addWidget(m_treatmentHistoryWidget);

    m_tabWidget->addTab(tab, "📝 Історія лікування");
}

void PatientDetailView::fillPersonalInfo(const Patient &patient) {
    m_patientNameLabel->setText(patient.fullName());
    m_fullNameValue->setText(patient.fullName());
    m_phoneValue->setText(patient.phoneNumber.isEmpty() ? "—" : patient.phoneNumber);
    m_emailValue->setText(patient.email.isEmpty() ? "—" : patient.email);

    if (!patient.dateOfBirth.isEmpty()) {
        QDate dob = QDate::fromString(patient.dateOfBirth, Qt::ISODate);
        if (dob.isValid()) {
            int age = QDate::currentDate().year() - dob.year();
            m_ageValue->setText(QString("%1 років (дата нар.: %2)")
                .arg(age).arg(dob.toString("dd.MM.yyyy")));
        } else {
            m_ageValue->setText("—");
        }
    } else {
        m_ageValue->setText("—");
    }

    QString genderDisplay = "—";
    if (patient.gender == "M") genderDisplay = "Чоловік";
    else if (patient.gender == "F") genderDisplay = "Жінка";
    m_genderValue->setText(genderDisplay);

    m_addressValue->setText(patient.address.isEmpty() ? "—" : patient.address);
    m_notesValue->setText(patient.generalNotes.isEmpty() ? "Немає приміток" : patient.generalNotes);
}

void PatientDetailView::updateToothStyle(QPushButton *btn, const QString &status) {
    btn->setEnabled(false);
    btn->setProperty("toothClass", true);
    btn->setProperty("toothState", status.toLower());
    btn->style()->unpolish(btn);
    btn->style()->polish(btn);
}

QPushButton* PatientDetailView::createToothButton(int toothNumber) {
    QPushButton *btn = new QPushButton(QString::number(toothNumber));
    btn->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    btn->setMinimumSize(34, 46);
    btn->setMaximumSize(55, 65);

    btn->setCursor(Qt::ArrowCursor);

    m_toothButtons[toothNumber] = btn;
    updateToothStyle(btn, "healthy");
    return btn;
}

void PatientDetailView::createDentalChartTab() {
    QWidget *tab = new QWidget();
    QVBoxLayout *layout = new QVBoxLayout(tab);
    layout->setContentsMargins(32, 32, 32, 32);
    layout->setSpacing(24);

    QHBoxLayout *hdrLay = new QHBoxLayout();
    QLabel *hdrIcon = new QLabel("🦷");
    hdrIcon->setStyleSheet("font-size: 26px; background: transparent;");

    QLabel *hdrText = new QLabel("Зубна Формула (FDI)");
    hdrText->setObjectName("pageTitle");

    hdrLay->addWidget(hdrIcon);
    hdrLay->addSpacing(8);
    hdrLay->addWidget(hdrText);
    hdrLay->addStretch();
    layout->addLayout(hdrLay);

    QLabel *fdiHintLabel = new QLabel("❗Карта пацієнта доступна лише для перегляду.");
    fdiHintLabel->setProperty("type", "subtitle");
    layout->addWidget(fdiHintLabel);

    QWidget *legendContainer = new QWidget();
    QHBoxLayout *legLay = new QHBoxLayout(legendContainer);
    legLay->setSpacing(16);
    legLay->setContentsMargins(0, 0, 0, 0);
    legLay->setAlignment(Qt::AlignCenter);

    legLay->addWidget(legendItem("#86EFAC", "Здоровий"));
    legLay->addWidget(legendItem("#FCA5A5", "Карієс"));
    legLay->addWidget(legendItem("#93C5FD", "Пломба"));
    legLay->addWidget(legendItem("#E2E8F0", "Видалений"));
    legLay->addWidget(legendItem("#D8B4FE", "Коронка"));
    legLay->addWidget(legendItem("#FDE047", "Імплант"));
    legLay->addWidget(legendItem("#CBD5E1", "Інше"));
    layout->addWidget(legendContainer);

    // Сітка зубів
    m_dentalChartContainer = new QWidget();
    m_dentalGridLayout = new QGridLayout(m_dentalChartContainer);
    m_dentalGridLayout->setSpacing(8);
    m_dentalGridLayout->setContentsMargins(0, 10, 0, 0);

    int col = 0;
    for (int i = 18; i >= 11; --i) {
        m_dentalGridLayout->addWidget(createToothButton(i), 0, col);
        m_dentalGridLayout->setColumnStretch(col, 1);
        col++;
    }

    QFrame *vLine1 = new QFrame(); vLine1->setFrameShape(QFrame::VLine);
    vLine1->setStyleSheet("border-left: 2px dashed #CBD5E1;");
    m_dentalGridLayout->addWidget(vLine1, 0, col);
    m_dentalGridLayout->setAlignment(vLine1, Qt::AlignCenter);
    int centerCol = col;
    col++;

    for (int i = 21; i <= 28; ++i) {
        m_dentalGridLayout->addWidget(createToothButton(i), 0, col);
        m_dentalGridLayout->setColumnStretch(col, 1);
        col++;
    }

    QFrame *hLine = new QFrame(); hLine->setFrameShape(QFrame::HLine);
    hLine->setStyleSheet("border-top: 2px dashed #CBD5E1; margin: 16px 0;");
    m_dentalGridLayout->addWidget(hLine, 1, 0, 1, col);

    col = 0;
    for (int i = 48; i >= 41; --i) {
        m_dentalGridLayout->addWidget(createToothButton(i), 2, col++);
    }

    QFrame *vLine2 = new QFrame(); vLine2->setFrameShape(QFrame::VLine);
    vLine2->setStyleSheet("border-left: 2px dashed #CBD5E1;");
    m_dentalGridLayout->addWidget(vLine2, 2, centerCol);
    m_dentalGridLayout->setAlignment(vLine2, Qt::AlignCenter);
    col = centerCol + 1;

    for (int i = 31; i <= 38; ++i) {
        m_dentalGridLayout->addWidget(createToothButton(i), 2, col++);
    }

    layout->addWidget(m_dentalChartContainer);

    m_noDentalChartLabel = new QLabel("Медична карта порожня або не знайдена");
    m_noDentalChartLabel->setAlignment(Qt::AlignCenter);
    m_noDentalChartLabel->setStyleSheet("color: #94a3b8; font-size: 14px; margin-top: 20px;");
    layout->addWidget(m_noDentalChartLabel);
    m_noDentalChartLabel->hide();

    layout->addStretch();
    m_tabWidget->addTab(tab, "🦷 Медична карта");
}

void PatientDetailView::fillDentalChart(const MedicalRecord &record) {
    for (auto btn : m_toothButtons.values()) {
        updateToothStyle(btn, "healthy");
    }

    if (record.dentalChart.isEmpty()) {
        if (m_dentalChartContainer) m_dentalChartContainer->hide();
        m_noDentalChartLabel->show();
        return;
    }

    if (m_dentalChartContainer) m_dentalChartContainer->show();
    m_noDentalChartLabel->hide();

    for (const Tooth &tooth : record.dentalChart) {
        if (m_toothButtons.contains(tooth.toothNumber)) {
            updateToothStyle(m_toothButtons[tooth.toothNumber], tooth.status);
        }
    }
}

void PatientDetailView::setPatientId(int patientId) {
    m_patientId = patientId;
    m_controller->loadPatientDetail(patientId);
}

void PatientDetailView::displayPatientInfo(const Patient &patient) {
    fillPersonalInfo(patient);
    m_errorLabel->hide();
}

void PatientDetailView::displayDentalChart(const MedicalRecord &record) {
    if (m_dentalChartContainer) {
        m_dentalChartContainer->show();
    }
    m_noDentalChartLabel->hide();

    fillDentalChart(record);
}

void PatientDetailView::displayTreatmentHistory(const MedicalRecord &record) {
    QVector<TreatmentRecord> completedTreatments;
    for (const TreatmentRecord &treatment : record.treatments) {
        completedTreatments.append(treatment);
    }
    
    if (m_treatmentHistoryWidget) {
        m_treatmentHistoryWidget->displayTreatments(completedTreatments);
    }
}

void PatientDetailView::displayNoDentalChart() {
    if (m_dentalChartContainer) {
        m_dentalChartContainer->hide();
    }

    m_noDentalChartLabel->setText("Медична карта не знайдена");
    m_noDentalChartLabel->show();

    if (m_treatmentHistoryWidget) {
        m_treatmentHistoryWidget->displayTreatments(QVector<TreatmentRecord>());
    }
}

void PatientDetailView::displayDentalChartError(const QString &error) {
    m_noDentalChartLabel->setText(QString("Помилка: %1").arg(error));
    m_noDentalChartLabel->setStyleSheet("color: #dc2626;");
    m_noDentalChartLabel->show();
}

void PatientDetailView::displayError(const QString &error) {
    m_errorLabel->setText(QString("Помилка: %1").arg(error));
    m_errorLabel->show();
}

void PatientDetailView::applyStyles() {
    setStyleSheet(R"(
        QTabBar::tab {
            background-color: transparent;
            padding: 8px 16px;
            margin-right: 2px;
            font-size: 14px;
            font-weight: bold;
        }
        QTabBar::tab:selected {
            border-bottom: 2px solid #007ACC;
            color: #007ACC;
        }
        QTabWidget::pane {
            border: none;
            background-color: transparent;
        }
    )");
}
