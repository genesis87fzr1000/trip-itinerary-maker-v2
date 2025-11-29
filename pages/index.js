// pages/index.js
import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

export default function Home() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // 初期地図を作る（script の onLoad 後に呼ぶ）
  const initMap = useCallback(() => {
    try {
      if (!mapRef.current || typeof window === "undefined" || !window.google) return;

      // 既に作成済みなら何もしない
      if (mapInstanceRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 35.681236, lng: 139.767125 }, // 東京駅付近
        zoom: 13,
      });
      mapInstanceRef.current = map;

      const renderer = new window.google.maps.DirectionsRenderer({ suppressMarkers: false });
      renderer.setMap(map);
      directionsRendererRef.current = renderer;

      setStatusMsg("地図読み込み完了");
    } catch (e) {
      console.error("initMap error:", e);
      setStatusMsg("地図初期化でエラー");
    }
  }, []);

  // ルート計算（フロント側で DirectionsService を使わず、サーバーから帰ってきた内容を DirectionsService に再取得させる方法）
  const calculateRoute = async () => {
    if (!from || !to) {
      setStatusMsg("出発地と到着地を入力してください");
      return;
    }
    if (!window || !window.google) {
      setStatusMsg("Google Maps が読み込まれていません");
      return;
    }
    setStatusMsg("ルート取得中...");

    try {
      const res = await fetch(`/api/directions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const data = await res.json();

      if (!data || !data.legs || data.legs.length === 0) {
        setStatusMsg("ルートが見つかりませんでした");
        console.warn("directions API result:", data);
        return;
      }

      // DirectionsService を使って正規の DirectionsResult を得て描画する方法（安定）
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: from,
          destination: to,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK || status === "OK") {
            if (directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(result);
              setStatusMsg("ルート表示完了: " + data.legs[0].distance.text + " / " + data.legs[0].duration.text);
            } else {
              setStatusMsg("レンダラーが未セットです");
            }
          } else {
            console.error("DirectionsService.status:", status, result);
            setStatusMsg("DirectionsService エラー: " + status);
          }
        }
      );
    } catch (err) {
      console.error("calculateRoute error:", err);
      setStatusMsg("ルート取得に失敗しました");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Trip Itinerary Maker</h1>

      {/* Google Maps スクリプトを読み込む */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
        onLoad={() => {
          console.log("Google Maps script loaded");
          initMap();
        }}
        onError={(e) => {
          console.error("Google Maps script load error:", e);
          setStatusMsg("Google Maps スクリプトの読み込みに失敗しました");
        }}
      />

      <div style={{ marginTop: 10 }}>
        <label>出発地: </label>
        <input value={from} onChange={(e) => setFrom(e.target.value)} style={{ marginRight: 10 }} />
        <label>到着地: </label>
        <input value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={calculateRoute} style={{ marginLeft: 10 }}>ルート計算</button>
      </div>

      <div style={{ marginTop: 10, color: "#333" }}>{statusMsg}</div>

      <div
        ref={mapRef}
        id="map"
        style={{ width: "100%", height: "520px", marginTop: 16, border: "1px solid #ddd" }}
      />
    </div>
  );
}
