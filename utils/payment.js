const axios = require("axios");
const crypto = require("crypto");
const ErrorResponse = require("./errorResponse");
require("dotenv").config();

class PayKadunaMotorMarket {
  constructor() {
    this.apiKey = process.env.PAYKADUNA_API_KEY;
    this.engineCode = process.env.PAYKADUNA_ENGINE_CODE;
    this.baseUrl = process.env.PAYKADUNA_BASE_URL;
  }

  computeSignature(payload) {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac("sha256", this.apiKey);
    hmac.update(payloadString);
    return Buffer.from(hmac.digest()).toString("base64");
  }

  async createBill(billData) {
    try {
      // const signature = this.computeSignature(billData);
      // console.log(signature, billData, this.engineCode);
      const response = await axios.post(
        `https://paypro.quantumcloud.ng/api/paykaduna/MotorMarket/create-bill`,
        billData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error creating bill:",
        error.response?.data || error.message
      );
      // Return the error response so controller can handle it
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error.message
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
          headers: {
            "Content-Type": "application/json",
          },
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
            "Content-Type": "application/json",
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
