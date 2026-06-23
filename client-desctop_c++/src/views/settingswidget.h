#ifndef SETTINGSWIDGET_H
#define SETTINGSWIDGET_H

#include <QWidget>
#include <QTabWidget>
#include <QFormLayout>
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QComboBox>
#include <QMessageBox>
#include <QSettings>
#include <QApplication>
#include <QCheckBox>
#include "../services/apiclient.h"

class SettingsWidget : public QWidget {
    Q_OBJECT

public:
    explicit SettingsWidget(QWidget *parent = nullptr);

private slots:
    void onSavePasswordClicked();
    void applyAndSaveTheme(const QString &theme);
    void onShowPasswordsToggled(bool checked);

private:
    void setupProfileTab();
    void setupClientTab();
    void loadProfileData();

    QTabWidget *m_tabWidget;

    // Профіль
    QLabel *m_nameLabel;
    QLabel *m_phoneLabel;
    QLabel *m_emailLabel;
    QLabel *m_specialtyLabel;
    QLineEdit *m_oldPasswordEdit;
    QLineEdit *m_newPasswordEdit;
    QLineEdit *m_confirmPasswordEdit;
    QPushButton *m_savePasswordBtn;
    QCheckBox *m_showPasswordsCheckBox;

    QPushButton *m_lightThemeBtn;
    QPushButton *m_darkThemeBtn;
    void updateThemeSelection(const QString &theme);
    QString m_currentUsername;

signals:
    void themeChanged(const QString& theme);
};

#endif // SETTINGSWIDGET_H
