import { useState, useEffect } from "react";
import Script from "next/script";

export default function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [route, setRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  let map;
  let directionsRenderer;
  let directionsService;

  // 地図初期化
  const initMap = () => {
    if (typeof window.google === "undefined") return;

    map = new window.google.maps.Map(document.getElementById("map"), {
      center: { lat: 35.681236, lng: 139.767125 }, // 東京駅
      zoom: 14,
    });

    directionsRenderer = new window.google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    directionsService = new window.google.maps.DirectionsService();
    setMapLoaded(true);
  };

  const calculateRoute = async () => {
    if (!from || !to || !mapLoaded) return;

    const response = await fetch(
      `/api/directions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    const data = await response.json();

    setRoute(data);

    // ルート描画
    directionsService.route(
      {
        origin: from,
        destination: to,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
        } else {
          alert("ルート取得に失敗しました: " + status);
        }
      }
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trip Itinerary Maker</h1>

      <div style={{ marginBottom: "10px" }}>
        <label>出発地: </label>
        <input value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>到着地: </label>
        <input value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <button onClick={calculateRoute}>ルート計算</button>

      {route && (
        <div style={{ marginTop: "20px" }}>
          <h3>ルート結果 (JSON):</h3>
          <pre>{JSON.stringify(route, null, 2)}</pre>
        </div>
      )}

      <div id="map" style={{ width: "100%", height: "500px", marginTop: "20px" }}></div>

      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
        onLoad={initMap}
      />
    </div>
  );
}
