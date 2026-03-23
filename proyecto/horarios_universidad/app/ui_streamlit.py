import streamlit as st
import pandas as pd
from core.config import DEFAULT_CONFIG
from core.pipeline import run_pipeline

st.set_page_config(page_title="Generador de Horarios", layout="wide")
st.title("Generador de Horarios - Ingeniería de Software")

cfg = DEFAULT_CONFIG.copy()

c1, c2, c3 = st.columns(3)
with c1:
    cfg["num_salones_comunes"] = st.number_input("Salones comunes", min_value=1, value=cfg["num_salones_comunes"])
    cfg["num_salones_pc"] = st.number_input("Salones PC", min_value=1, value=cfg["num_salones_pc"])
with c2:
    cfg["max_clases_profe_semana"] = st.number_input("Máx semanal profesor", min_value=1, value=cfg["max_clases_profe_semana"])
    cfg["max_clases_profe_dia"] = st.number_input("Máx diario profesor", min_value=1, value=cfg["max_clases_profe_dia"])
with c3:
    cfg["k_candidatos"] = st.number_input("Candidatos por curso", min_value=1, value=cfg["k_candidatos"])
    cfg["max_time_seconds"] = st.number_input("Tiempo solver (s)", min_value=10, value=cfg["max_time_seconds"])

def render_horario(df_asig: pd.DataFrame):
    st.subheader("Vista de Horario (en Streamlit)")
    if df_asig is None or df_asig.empty:
        st.warning("No hay asignaciones para mostrar.")
        return

    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
    bloques = sorted(df_asig["Bloque"].dropna().unique().tolist())
    grid = pd.DataFrame("", index=bloques, columns=dias)

    for _, r in df_asig.iterrows():
        d = r["Día"]
        b = r["Bloque"]
        if d in dias and b in grid.index:
            txt = f"{r['Materia']} ({r['Curso']})\n{r['Profesor']} | {r['Salón']}"
            if grid.loc[b, d]:
                grid.loc[b, d] += "\n\n" + txt
            else:
                grid.loc[b, d] = txt

    grid.index.name = "Bloque"
    st.dataframe(grid, use_container_width=True, height=600)

if st.button("Generar horario", type="primary"):
    with st.spinner("Resolviendo modelo..."):
        result = run_pipeline(cfg)

    st.write(f"Estado: **{result['status']}**")
    st.info(result["message"])

    # Mostrar horario si pipeline lo retorna
    df_asig = result.get("df_asig", None)
    render_horario(df_asig)

    # Descargar Excel
    if result.get("excel_path"):
        st.success(f"Excel generado: {result['excel_path']}")
        with open(result["excel_path"], "rb") as f:
            st.download_button(
                "Descargar Excel",
                data=f,
                file_name=result["excel_path"].split("/")[-1],
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )