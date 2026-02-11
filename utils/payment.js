const axios = require("axios");
const crypto = require("crypto");
const ErrorResponse = require("./errorResponse");
require("dotenv").config();

class PayKadunaMotorMarket {
  constructor() {
    this.apiKey = process.env.PAYKADUNA_API_KEY;
    this.engineCode = process.env.PAYKADUNA_ENGINE_CODE;
    this.baseUrl = process.env.PAYKADUNA_URL;
  }

  /**
   * Compute HMAC SHA256 signature (Base64) for POST requests.
   * Uses the JSON payload as the message and the API key as the secret.
   */
  computeSignature(payload) {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac("sha256", this.apiKey);
    hmac.update(payloadString);
    return Buffer.from(hmac.digest()).toString("base64");
  }

  /**
   * Compute HMAC SHA256 signature (Base64) for GET requests.
   * Uses the API path + query string as the message.
   * e.g. for GET https://api.paykaduna.com/api/ESBills/GetBill?billreference=123
   * you hash: /api/ESBills/GetBill?billreference=123
   */
  computeGetSignature(pathAndQuery) {
    const hmac = crypto.createHmac("sha256", this.apiKey);
    hmac.update(pathAndQuery);
    return Buffer.from(hmac.digest()).toString("base64");
  }

  /**
   * Create a bill on PayKaduna.
   * Accepts: { amount, mdasId, narration, firstName, middleName, lastName, phone, address }
   * Returns: { billReference, ... } or { success: false, ... }
   */
  async createBill(billData) {
    try {
      // Transform to official PayKaduna API format
      const payload = {
        engineCode: this.engineCode,
        identifier: billData.phone || `ID-${Date.now()}`,
        firstName: billData.firstName,
        middleName: billData.middleName || ".",
        lastName: billData.lastName || ".",
        telephone: billData.phone,
        address: billData.address,
        esBillDetailsDto: [
          {
            amount: billData.amount,
            mdasId: billData.mdasId,
            narration: billData.narration,
          },
        ],
      };

      const signature = this.computeSignature(payload);

      console.log(
        "[PayKaduna] Creating bill. Endpoint:",
        `${this.baseUrl}/api/ESBills/CreateESBill`
      );
      console.log("[PayKaduna] Payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/api/ESBills/CreateESBill`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Signature": signature,
          },
        }
      );

      console.log(
        "[PayKaduna] Response:",
        JSON.stringify(response.data, null, 2)
      );

      // Extract billReference from nested response for backward compatibility
      // Official API returns: { bill: { billReference, payStatus, ... }, billItems: [...], failedBillItems: [...] }
      const result = response.data;
      if (result?.bill?.billReference) {
        return {
          billReference: result.bill.billReference,
          payStatus: result.bill.payStatus,
          bill: result.bill,
          billItems: result.billItems,
          failedBillItems: result.failedBillItems,
        };
      }

      return result;
    } catch (error) {
      console.error(
        "[PayKaduna] Error creating bill:",
        error.response?.data || error.message
      );
      if (error.response) {
        console.error("[PayKaduna] Error status:", error.response.status);
        console.error(
          "[PayKaduna] Error response data:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Create a payment transaction on PayKaduna.
   * Accepts: { billReference, tpui }
   * Returns: { checkoutUrl, rawResponse }
   */
  async createTransaction(payload) {
    try {
      const signature = this.computeSignature(payload);

      console.log(
        "[PayKaduna] Creating transaction. Endpoint:",
        `${this.baseUrl}/api/ESBills/CreateESTransaction`
      );
      console.log(
        "[PayKaduna] Transaction payload:",
        JSON.stringify(payload, null, 2)
      );

      const response = await axios.post(
        `${this.baseUrl}/api/ESBills/CreateESTransaction`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Signature": signature,
          },
        }
      );

      console.log(
        "[PayKaduna] Transaction response:",
        JSON.stringify(response.data, null, 2)
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

  /**
   * Get invoice URL for a bill.
   * GET /api/ESBills/GetInvoiceUrl?billreference=...
   */
  async getInvoiceUrl(billReference) {
    try {
      const pathAndQuery = `/api/ESBills/GetInvoiceUrl?billreference=${billReference}`;
      const signature = this.computeGetSignature(pathAndQuery);

      const response = await axios.get(
        `${this.baseUrl}${pathAndQuery}`,
        {
          headers: {
            "X-Api-Signature": signature,
          },
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

  /**
   * Get bill information / payment status.
   * GET /api/ESBills/GetBill?billreference=...
   * Returns: { payStatus, billReference, ... }
   */
  async getBill(billReference) {
    try {
      const pathAndQuery = `/api/ESBills/GetBill?billreference=${billReference}`;
      const signature = this.computeGetSignature(pathAndQuery);

      console.log(
        "[PayKaduna] Getting bill. Endpoint:",
        `${this.baseUrl}${pathAndQuery}`
      );

      const response = await axios.get(
        `${this.baseUrl}${pathAndQuery}`,
        {
          headers: {
            "X-Api-Signature": signature,
          },
        }
      );

      console.log(
        "[PayKaduna] GetBill response:",
        JSON.stringify(response.data, null, 2)
      );

      // Extract payStatus from nested response for backward compatibility
      // Official API returns: { bill: { billReference, payStatus, ... }, billItems: [...] }
      const result = response.data;
      if (result?.bill) {
        return {
          payStatus: result.bill.payStatus,
          billReference: result.bill.billReference,
          narration: result.bill.narration,
          bill: result.bill,
          billItems: result.billItems,
        };
      }

      return result;
    } catch (error) {
      console.error(
        "Error getting bill:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Register a taxpayer on PayKaduna.
   * POST /api/ESBills/RegisterTaxPayer
   */
  async registerTaxpayer(taxpayerData) {
    try {
      const signature = this.computeSignature(taxpayerData);

      const response = await axios.post(
        `${this.baseUrl}/api/ESBills/RegisterTaxPayer`,
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

  /**
   * Get revenue heads.
   */
  async getRevenueHeads() {
    try {
      const pathAndQuery = `/api/ESBills/GetRevenueHeads`;
      const signature = this.computeGetSignature(pathAndQuery);

      const response = await axios.get(`${this.baseUrl}${pathAndQuery}`, {
        headers: {
          "X-Api-Signature": signature,
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

  /**
   * Get lookup data (states, lgas, genders, tax-stations, user-types).
   */
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

      const pathAndQuery = `/api/ESBills/${lookupType}`;
      const signature = this.computeGetSignature(pathAndQuery);

      const response = await axios.get(`${this.baseUrl}${pathAndQuery}`, {
        headers: {
          "X-Api-Signature": signature,
          engineCode: this.engineCode,
        },
      });

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
