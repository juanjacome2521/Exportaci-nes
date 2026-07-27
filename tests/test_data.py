from pathlib import Path
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]


def test_serie_cubre_todo_el_periodo_y_cuadra():
    df = pd.read_csv(ROOT / "data/raw/exportaciones_anuales.csv")
    assert df["anio"].tolist() == list(range(2014, 2026))
    difference = (
        df["exportaciones_totales_usd_millones"]
        - df["petroleras_usd_millones"]
        - df["no_petroleras_usd_millones"]
    ).abs()
    assert (difference <= 1.0).all()
