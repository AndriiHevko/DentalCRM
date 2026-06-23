#include "uihelpers.h"
#include <QHBoxLayout>
#include <QVBoxLayout>

QLabel *fieldLbl(const QString &t, QWidget *p) {
    QLabel *l = new QLabel(t, p);
    l->setProperty("type", "subtitle");
    l->setStyleSheet("font-size:13px;");
    return l;
}

QLabel *valueLbl(const QString &t, QWidget *p) {
    QLabel *l = new QLabel(t.isEmpty() ? "—" : t, p);
    l->setStyleSheet("font-size:14px; font-weight:600;");
    l->setWordWrap(true);
    return l;
}

QFrame *hline() {
    QFrame *f = new QFrame();
    f->setFrameShape(QFrame::HLine);
    f->setStyleSheet("color:#E2E8F0; margin: 2px 0;");
    return f;
}

void addShadow(QWidget *w) {
    QGraphicsDropShadowEffect *s = new QGraphicsDropShadowEffect(w);
    s->setBlurRadius(10);
    s->setXOffset(0);
    s->setYOffset(2);
    s->setColor(QColor(0, 0, 0, 15));
    w->setGraphicsEffect(s);
}

QWidget* legendItem(const QString &color, const QString &text) {
    QWidget *w = new QWidget();
    QHBoxLayout *l = new QHBoxLayout(w);
    l->setContentsMargins(0, 0, 0, 0);
    l->setSpacing(6);

    QLabel *dot = new QLabel("●", w);
    dot->setStyleSheet(QString("font-size:12px; color:%1;").arg(color));

    QLabel *txt = new QLabel(text, w);
    txt->setProperty("type", "subtitle");
    txt->setStyleSheet("font-size:12px;");

    l->addWidget(dot);
    l->addWidget(txt);
    l->addStretch();

    return w;
}
