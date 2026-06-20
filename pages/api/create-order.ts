import Razorpay from "razorpay";
import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({});
  }

  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to create order"
    });
  }
}