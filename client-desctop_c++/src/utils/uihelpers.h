#ifndef UIHELPERS_H
#define UIHELPERS_H

#include <QLabel>
#include <QFrame>
#include <QWidget>
#include <QGraphicsDropShadowEffect>

QLabel *fieldLbl(const QString &t, QWidget *p = nullptr);
QLabel *valueLbl(const QString &t, QWidget *p = nullptr);
QFrame *hline();
void addShadow(QWidget *w);
QWidget* legendItem(const QString &color, const QString &text);

#endif // UIHELPERS_H
