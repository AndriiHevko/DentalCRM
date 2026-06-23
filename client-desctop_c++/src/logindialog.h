#ifndef LOGINDIALOG_H
#define LOGINDIALOG_H

#include <QDialog>
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QVBoxLayout>

class LoginDialog : public QDialog {
    Q_OBJECT
public:
    explicit LoginDialog(QWidget *parent = nullptr);

signals:
    void loginSuccessful();

private slots:
    void onLoginClicked();

private:
    QLineEdit *m_usernameEdit;
    QLineEdit *m_passwordEdit;
    QPushButton *m_loginButton;
    QLabel *m_statusLabel;
};

#endif // LOGINDIALOG_H
