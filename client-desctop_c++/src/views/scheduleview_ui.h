#ifndef SCHEDULEVIEW_UI_H
#define SCHEDULEVIEW_UI_H

class ScheduleView;

namespace ScheduleViewUi {
    void buildUi(ScheduleView *view);
    void renderPage(ScheduleView *view);
    void updatePaginationUi(ScheduleView *view);
}

#endif // SCHEDULEVIEW_UI_H