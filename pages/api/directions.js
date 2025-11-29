export default function handler(req, res) {
  const { from, to } = req.query;
  res.status(200).json({ message: `from=${from}, to=${to}` });
}
