import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CHECKOUT from "./pages/chekout";
import Success from "./pages/Success";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/checkout" element={<CHECKOUT />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </Router>
  );
}
