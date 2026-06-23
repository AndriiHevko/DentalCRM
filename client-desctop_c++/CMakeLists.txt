cmake_minimum_required(VERSION 3.16)

project(DentalClinicApp VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets Network)

add_executable(DentalClinicApp
    # Головні файли
    src/main.cpp
    src/mainwindow.cpp
    src/mainwindow.h
    src/logindialog.cpp
    src/logindialog.h

    # Сервіси та Моделі
    src/services/apiclient.cpp
    src/services/apiclient.h
    src/models/models.h

    # Утиліти
    src/utils/uihelpers.cpp
    src/utils/uihelpers.h

    # Контролери
    src/controllers/addappointmentcontroller.cpp
    src/controllers/addappointmentcontroller.h
    src/controllers/appointmentdetailcontroller.cpp
    src/controllers/appointmentdetailcontroller.h
    src/controllers/patientdetailcontroller.cpp
    src/controllers/patientdetailcontroller.h
    src/controllers/patientscontroller.cpp
    src/controllers/patientscontroller.h
    src/controllers/schedulecontroller.cpp
    src/controllers/schedulecontroller.h
    src/controllers/workinghourscontroller.cpp
    src/controllers/workinghourscontroller.h

    # Екрани (Діалоги)
    src/screens/addappointmentdialog.cpp
    src/screens/addappointmentdialog.h

    # В'юшки (Views)
    src/views/appointmentdetailview.cpp
    src/views/appointmentdetailview.h
    src/views/appointmentdetailview_ui.cpp
    src/views/appointmentdetailview_ui.h
    src/views/patientdetailview.cpp
    src/views/patientdetailview.h
    src/views/patientsview.cpp
    src/views/patientsview.h
    src/views/scheduleview.cpp
    src/views/scheduleview.h
    src/views/scheduleview_ui.cpp
    src/views/scheduleview_ui.h
    src/views/settingswidget.cpp
    src/views/settingswidget.h
    src/views/workinghoursview.cpp
    src/views/workinghoursview.h
)

target_link_libraries(DentalClinicApp PRIVATE Qt6::Core Qt6::Gui Qt6::Widgets Qt6::Network)

# Set output directory
set_target_properties(DentalClinicApp PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)
