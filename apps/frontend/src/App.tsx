import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Success from "./pages/Success";
import Home from "./pages/Home";
import Checkout from "./pages/checkout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </Router>
  );
}
