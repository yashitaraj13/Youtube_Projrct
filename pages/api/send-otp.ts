import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, otp } = req.body;

  try {
    const response = await axios.post(
      "https://control.msg91.com/api/v5/otp",
      {
        mobile: `91${phone}`,
        otp,
        template_id: process.env.MSG91_TEMPLATE_ID
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY!
        }
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    return res.status(500).json({
      error: error.response?.data || error.message
    });
  }
}