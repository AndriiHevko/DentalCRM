#include <QApplication>
#include "mainwindow.h"
#include "logindialog.h"
#include "services/apiclient.h"

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);
    a.setApplicationName("Dental Clinic Pro");
    a.setOrganizationName("DentalSoft");

    MainWindow* mainWin = nullptr;
    LoginDialog login;

    auto startSession = [&mainWin, &login]() {
        if (mainWin) {
            mainWin->deleteLater();
        }

        mainWin = new MainWindow();

        QObject::connect(&ApiClient::instance(), &ApiClient::unauthorized, [&mainWin, &login]() {
            if (mainWin) {
                mainWin->hide();
                mainWin->deleteLater();
                mainWin = nullptr;
            }
            login.show();
        });

        mainWin->show();
    };

    QObject::connect(&login, &LoginDialog::loginSuccessful, [&]() {
        login.hide();
        startSession();
    });

    if (ApiClient::instance().isAuthenticated()) {
        startSession();
    } else {
        login.show();
    }

    return a.exec();
}
