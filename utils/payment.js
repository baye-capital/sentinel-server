const axios = require("axios");
const crypto = require("crypto");
const ErrorResponse = require("./errorResponse");
require("dotenv").config();

class PayKadunaMotorMarket {
  constructor() {
    this.apiKey = process.env.PAYKADUNA_API_KEY;
    this.engineCode = process.env.PAYKADUNA_ENGINE_CODE;
    this.baseUrl = process.env.PAYKADUNA_BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    };
  }

  computeSignature(payload) {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac("sha256", this.apiKey);
    hmac.update(payloadString);
    return Buffer.from(hmac.digest()).toString("base64");
  }

  async createBill(billData) {
    try {
      console.log(
        "[PayKaduna] Creating bill. Endpoint: https://paypro.quantumcloud.ng/api/paykaduna/MotorMarket/create-bill"
      );
      console.log("[PayKaduna] Payload:", JSON.stringify(billData, null, 2));
      // const signature = this.computeSignature(billData);
      // console.log(signature, billData, this.engineCode);
      const response = await axios.post(
        `https://paypro.quantumcloud.ng/api/paykaduna/MotorMarket/create-bill`,
        billData,
        {
          headers: this.defaultHeaders,
        }
      );
      console.log(
        "[PayKaduna] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error) {
      console.error(
        "[PayKaduna] Error creating bill:",
        error.response?.data || error.message
      );
      if (error.response) {
        console.error("[PayKaduna] Error status:", error.response.status);
        console.error("[PayKaduna] Error headers:", error.response.headers);
        console.error(
          "[PayKaduna] Error response data:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      // Return the error response so controller can handle it
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error.message,
      };
    }
  }

  async createTransaction(payload) {
    try {
      // const signature = this.computeSignature(payload);

      const response = await axios.post(
        `https://paypro.quantumcloud.ng/api/paykaduna/MotorMarket/create-transaction`,
        payload,
        {
          headers: this.defaultHeaders,
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error creating transaction:",
        error.response?.data || error.message
      );

      const message =
        error.response?.data?.error || error.message || "Unknown error";
      const status = error.response?.status || 500;

      throw new ErrorResponse(`Payment provider Error: ${message}`, status);
    }
  }

  async getInvoiceUrl(billReference) {
    try {
      // const payload = { billReference };
      // const signature = this.computeSignature(payload);

      const response = await axios.get(
        `https://paypro.quantumcloud.ng/api/paykaduna/MotorMarket/get-invoice`,
        {
          params: { billReference },
          headers: this.defaultHeaders,
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error getting invoice URL:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getBill(billReference) {
    try {
      // const payload = { billReference };
      // const signature = this.computeSignature(payload);

      const response = await axios.get(
        `https://paypro.quantumcloud.ng/api/paykaduna/MotorMarket/get-bill`,
        {
          params: { billReference, t: Date.now() },
          headers: this.defaultHeaders,
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error getting invoice URL:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async registerTaxpayer(taxpayerData) {
    try {
      const signature = this.computeSignature(taxpayerData);

      const response = await axios.post(
        `${this.baseUrl}/register-taxpayer`,
        taxpayerData,
        {
          headers: {
            ...this.defaultHeaders,
            "X-Api-Signature": signature,
            "Engine-Code": this.engineCode,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error registering taxpayer:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getRevenueHeads() {
    try {
      const response = await axios.get(`${this.baseUrl}/revenue-heads`, {
        headers: {
          ...this.defaultHeaders,
          "Engine-Code": this.engineCode,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        "Error getting revenue heads:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getLookupData(lookupType) {
    try {
      const validLookups = [
        "states",
        "lgas",
        "genders",
        "tax-stations",
        "user-types",
      ];
      if (!validLookups.includes(lookupType)) {
        throw new Error("Invalid lookup type");
      }

      const response = await axios.get(
        `https://paypro.quantumcloud.ng/api/paykaduna/MotorMarket/${lookupType}`,
        {
          headers: {
            ...this.defaultHeaders,
            engineCode: this.engineCode,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        `Error getting ${lookupType}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = PayKadunaMotorMarket;
