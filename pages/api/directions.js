// pages/api/directions.js

export default async function handler(req, res) {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: "from と to を指定してください。" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // サーバー用 API キー（制限なし推奨）

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        from
      )}&destination=${encodeURIComponent(to)}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(500).json({ error: data.error_message || data.status });
    }

    // 必要な情報だけ返す
    const routeInfo = {
      summary: data.routes[0].summary,
      legs: data.routes[0].legs,
      overview_polyline: data.routes[0].overview_polyline,
    };

    res.status(200).json(routeInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Directions API 取得中にエラーが発生しました。" });
  }
}
