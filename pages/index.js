import { useState, useEffect } from "react";

export default function Home() {
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);

  // Google Maps 初期化
  useEffect(() => {
    if (!window.google) return;

    const mapOptions = {
      zoom: 10,
      center: { lat: 35.6895, lng: 139.6917 },
    };

    const newMap = new window.google.maps.Map(
      document.getElementById("map"),
      mapOptions
    );

    const renderer = new window.google.maps.DirectionsRenderer({
      map: newMap,
      suppressMarkers: false,
    });

    setMap(newMap);
    setDirectionsRenderer(renderer);
  }, []);

  // ルート検索
  const fetchRoute = async () => {
    if (points.length < 2) {
      alert("少なくとも2地点を追加してください。");
      return;
    }

    const res = await fetch(`/api/directions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });

    const data = await res.json();
    if (!data || !data.routes || data.routes.length === 0) {
      alert("Google Directions API がルートを返しませんでした。");
      return;
    }

    setResult(data);

    // ★ 地図に描画するため DirectionsRenderer が読める形式に変換
    const gRoute = data.routes[0]; // 1つ目の候補を地図に描画

    directionsRenderer.setDirections({
      routes: [
        {
          legs: gRoute.legs,
          overview_polyline: {
            // Google が返す polyline をそのまま使う
            points: gRoute.overview_polyline.points,
          },
        },
      ],
      request: {},
    });
  };

  return (
    <div>
      <h1>ルート検索</h1>

      {/* 地点追加 */}
      <input
        type="text"
        placeholder="場所名を入力"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setPoints([...points, e.target.value]);
            e.target.value = "";
          }
        }}
      />

      <ul>
        {points.map((p, i) => (
          <li key={i}>{i + 1}. {p}</li>
        ))}
      </ul>

      <button onClick={fetchRoute}>ルート検索</button>

      {/* ルート文字情報 */}
      {result && (
        <div>
          <h2>検索結果</h2>
          {result.routes.map((r, i) => (
            <div key={i}>
              <h3>候補 {i + 1}</h3>
              {r.legs.map((l, j) => (
                <p key={j}>
                  {l.start_address} → {l.end_address}（{l.distance.text}, {l.duration.text}）
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <div
        id="map"
        style={{ width: "100%", height: "500px", marginTop: "20px" }}
      ></div>
    </div>
  );
}
