"""
Project Guardian — Streamlit parent dashboard (events, mood heatmap, simple social graph).
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from supabase import create_client

st.set_page_config(page_title="Project Guardian", layout="wide")
st.title("Project Guardian — Parent Dashboard")

url = os.getenv("SUPABASE_URL", "").strip()
key = os.getenv("SUPABASE_KEY", "").strip()
if not url or not key:
    st.error("Set SUPABASE_URL and SUPABASE_KEY (anon or service role per your RLS policy).")
    st.stop()

sb = create_client(url, key)


@st.cache_data(ttl=30)
def load_events(limit: int = 500) -> pd.DataFrame:
    r = (
        sb.table("events")
        .select("*")
        .order("captured_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = r.data or []
    return pd.DataFrame(rows)


df = load_events()
if df.empty:
    st.info("No events yet. Run the Windows agent and FastAPI brain with Supabase configured.")
    st.stop()

df["captured_at"] = pd.to_datetime(df["captured_at"], utc=True)

devices = sorted(df["device_id"].dropna().unique().tolist())
device = st.sidebar.selectbox("Device", devices, index=0)
d0 = datetime.now(timezone.utc).date()
start = st.sidebar.date_input("From", d0 - timedelta(days=7))
end = st.sidebar.date_input("To", d0)

mask = df["device_id"] == device
sub = df.loc[mask].copy()
sub = sub[(sub["captured_at"].dt.date >= start) & (sub["captured_at"].dt.date <= end)]

st.subheader("Recent alerts")
if "alert" in sub.columns:
    alerts = sub[sub["alert"] == True]
else:
    alerts = sub.iloc[0:0]
if alerts.empty:
    st.success("No alerts in the selected range.")
else:
    st.dataframe(
        alerts[
            [
                "captured_at",
                "process_name",
                "window_title",
                "risk_score",
                "sentiment_label",
                "text_snippet",
            ]
        ],
        use_container_width=True,
    )

st.subheader("All recent rows (highlight risk)")
display = sub.sort_values("captured_at", ascending=False).head(100)
st.dataframe(display, use_container_width=True)

# --- 7-day mood heatmap: day-of-week x hour-of-day, value = mean sentiment_score ---
st.subheader("7-day mood heatmap (sentiment intensity)")
heat = sub.copy()
if heat.empty:
    st.warning("No data in range.")
else:
    heat["dow"] = heat["captured_at"].dt.day_name()
    heat["hour"] = heat["captured_at"].dt.hour
    # Map sentiment to numeric if needed
    if "sentiment_score" not in heat.columns:
        heat["sentiment_score"] = 0.0
    pivot = heat.pivot_table(
        index="dow",
        columns="hour",
        values="sentiment_score",
        aggfunc="mean",
    )
    dow_order = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    pivot = pivot.reindex([d for d in dow_order if d in pivot.index])
    fig_h = px.imshow(
        pivot.values,
        labels=dict(x="Hour (UTC)", y="Day", color="Avg sentiment score"),
        x=[str(c) for c in pivot.columns],
        y=list(pivot.index),
        aspect="auto",
        color_continuous_scale="RdYlGn",
    )
    st.plotly_chart(fig_h, use_container_width=True)

# --- Friend-or-Foe style graph: nodes = process_name, edge weight = interaction count ---
st.subheader("Friend-or-Foe graph (by app / window activity)")
gdf = sub.copy()
if len(gdf) < 2:
    st.caption("Need more events to build a graph.")
else:
    nodes = gdf["process_name"].fillna("unknown").value_counts().reset_index()
    nodes.columns = ["id", "weight"]
    # Synthetic edges: connect top processes to a virtual "device" node for visualization
    node_names = nodes["id"].tolist()
    x = [0] + [1] * len(node_names)
    y = [0] + list(range(len(node_names)))
    labels = ["device"] + node_names
    edge_x: list[float] = []
    edge_y: list[float] = []
    for i, n in enumerate(node_names):
        edge_x += [0, 1, None]
        edge_y += [0, y[i + 1], None]
    edge_trace = go.Scatter(
        x=edge_x,
        y=edge_y,
        mode="lines",
        line=dict(width=1, color="#888"),
        hoverinfo="none",
    )
    sizes = [20] + [12 + min(30, int(w)) for w in nodes["weight"].tolist()]
    hovers = ["device hub"] + [f"{n}: {int(w)} events" for n, w in zip(nodes["id"], nodes["weight"])]
    node_trace = go.Scatter(
        x=x,
        y=y,
        mode="markers+text",
        marker=dict(size=sizes, color="#4e79a7"),
        text=labels,
        textposition="top center",
        hovertext=hovers,
        hoverinfo="text",
    )
    fig_g = go.Figure(data=[edge_trace, node_trace])
    fig_g.update_layout(showlegend=False, margin=dict(l=20, r=20, t=20, b=20), height=420)
    fig_g.update_xaxes(showgrid=False, zeroline=False, showticklabels=False)
    fig_g.update_yaxes(showgrid=False, zeroline=False, showticklabels=False)
    st.plotly_chart(fig_g, use_container_width=True)
    st.caption("MVP: star graph from device to each process; weights = event counts. Replace with contact graph when NLP extracts names.")
