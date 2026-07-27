from pathlib import Path
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]


def test_participaciones_suman_cien():
    df = pd.read_csv(ROOT / "data/processed/indicadores_exportaciones.csv")
    total = df["participacion_petrolera_pct"] + df["participacion_no_petrolera_pct"]
    assert ((total - 100).abs() <= 0.01).all()
