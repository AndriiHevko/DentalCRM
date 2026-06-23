#ifndef SCHEDULEVIEW_H
#define SCHEDULEVIEW_H

#include <QWidget>
#include <QStackedWidget>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QJsonArray>
#include <QDate>
#include <QCalendarWidget>
#include <QPushButton>
#include <QMenu>
#include <QLineEdit>

class ScheduleView;

namespace ScheduleViewUi {
    void buildUi(ScheduleView *view);
    void renderPage(ScheduleView *view);
    void updatePaginationUi(ScheduleView *view);
}

class AppointmentDetailView;
class Appointment;
class ScheduleController;

class ScheduleView : public QWidget {
    Q_OBJECT
public:
    explicit ScheduleView(QWidget *parent = nullptr);

    void loadData();

signals:
    void addAppointmentRequested();

protected:
    void showEvent(QShowEvent *event) override;

private slots:
    void showList();
    void showDetail(const Appointment &appt);
    
    void onDateSelected(const QDate &date);
    void setPage(int page);
    void selectToday();
    void onAddAppointmentClicked();

private:
    void setupUi();
    void renderPage();
    void updatePaginationUI();

    friend void ScheduleViewUi::buildUi(ScheduleView *view);
    friend void ScheduleViewUi::renderPage(ScheduleView *view);
    friend void ScheduleViewUi::updatePaginationUi(ScheduleView *view);

    QStackedWidget *m_stack;
    QWidget *m_listPage;
    AppointmentDetailView *m_detailView;

    QVBoxLayout *m_cardsLayout;
    
    QLabel *m_dateLabel;
    QPushButton *m_calendarBtn;
    QMenu *m_calendarMenu;
    QCalendarWidget *m_calendar;
    
    QLineEdit *m_searchInput;
    QPushButton *m_addAppointmentBtn;
    
    QWidget *m_paginationContainer;
    QHBoxLayout *m_paginationLayout;
    ScheduleController *m_controller;

    QJsonArray m_currentData;
    QDate m_selectedDate;
    QString m_searchQuery;
    int m_currentPage = 1;
    const int ITEMS_PER_PAGE = 6;
};

#endif // SCHEDULEVIEW_H
