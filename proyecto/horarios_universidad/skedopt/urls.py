from django.urls import path

from skedopt import views

app_name = "skedopt"

urlpatterns = [
    path("", views.index, name="index"),
    path("optimizar/", views.optimize, name="optimize"),
    path("descargar/", views.download_last, name="download"),
    path("horario/", views.horario_clases, name="horario"),
    path("resultado/", views.resultado, name="resultado"),
]
