import axios from "axios";

export const createCulqiCharge = async (token: string, amount: number) => {
  const response = await axios.post("https://api.culqi.com/v2/charges", {
    amount,
    currency_code: "PEN",
    source_id: token,
    description: "Compra por WhatsApp"
  }, {
    headers: { Authorization: `Bearer ${process.env.CULQI_SECRET}` }
  });

  return response.data;
};
