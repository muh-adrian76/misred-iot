/**
 * ===== PAYLOAD API ROUTES - ENDPOINT DATA SENSOR IoT =====
 * File ini mengatur penerimaan dan pembacaan data sensor dari device IoT
 * Meliputi: HTTP payload, LoRa payload, widget data, time series data
 */

import { Elysia } from "elysia";
import { PayloadService } from "../../services/PayloadService";
import {
  getAllPayloadsSchema,
  getPayloadByDeviceIdSchema,
  postPayloadHttpSchema,
  postPayloadLoraSchema,
  getPayloadByDeviceAndDatastreamSchema,
} from "./elysiaSchema";
import { authorizeRequest, extractDeviceIdFromJWT } from "../../lib/utils";

export function payloadRoutes(payloadService: PayloadService) {
  return (
    new Elysia({ prefix: "/payload" })

      // ===== CREATE HTTP PAYLOAD ENDPOINT =====
      // POST /payload/http - Terima data sensor dari device via HTTP
      .post(
        "/http",
        //@ts-ignore
        async ({ headers, body, set }) => {
          try {
            const timestamp = Math.floor(Date.now());
            console.log(`Timestamp saat payload diterima di server: ${timestamp}`);
            console.log("Header Payload diterima:", headers);
            console.log("Body Payload diterima:", body);
            let deviceId = headers["x-device-id"];
            let dataType = headers["x-data-type"];
            const authHeader = headers["authorization"];

            if (!authHeader) {
              set.status = 400;
              return {
                error: "Header tidak lengkap",
                message: "Tidak ada header Authorization",
              };
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
              set.status = 401;
              return {
                error: "Format token tidak valid",
                message: "Bearer token format required",
              };
            }

            // Extract device_id dari header atau JWT payload
            if (!deviceId) {
              const extractedDeviceId = extractDeviceIdFromJWT(token);
              if (!extractedDeviceId) {
                set.status = 400;
                return {
                  error: "Device ID tidak ditemukan",
                  message: "Device ID harus ada di header x-device-id atau di payload JWT",
                };
              }
              deviceId = extractedDeviceId;
            }

            // Verify JWT device dan decrypt payload data
            const decrypted = await payloadService.verifyDeviceJWTAndDecrypt({
              deviceId,
              token,
            });

            // Simpan payload data ke database
            const insertId = await payloadService.saveHttpPayload({
              deviceId,
              decrypted,
              dataType,
            });

            return {
              message: "Berhasil menambah data sensor",
              device_id: deviceId,
            };
          } catch (error: any) {
            console.error("Error processing HTTP payload:", error);
            set.status = 500;
            return {
              error: "Gagal memproses payload",
              message: error.message || "Internal server error",
            };
          }
        },
        postPayloadHttpSchema
      )

      // ===== CREATE LORA PAYLOAD ENDPOINT =====
      // POST /payload/lora - Terima data sensor dari device LoRaWAN
      .post(
        "/lora",
        async ({ body, set }) => {
          try {
            //@ts-ignore
            const { dev_eui, datastream_id, value } = body;

            if (!dev_eui || !datastream_id || value === undefined) {
              set.status = 400;
              return {
                error: "Parameter tidak lengkap",
                message: "dev_eui, datastream_id, dan value diperlukan",
              };
            }

            // Simpan payload LoRa ke database
            const insertId = await payloadService.saveLoraPayload(
              dev_eui,
              datastream_id,
              value
            );
            set.status = 201;
            return {
              message: "Berhasil menambah data sensor dari LoRa",
              device_id: dev_eui,
            };
          } catch (e: any) {
            console.error("Error processing LoRa payload:", e);
            set.status = e.message === "Device not found" ? 404 : 500;
            return {
              error: "Gagal memproses payload LoRa",
              message: e.message || "Internal server error",
            };
          }
        },
        postPayloadLoraSchema
      )

      // ===== GET PAYLOAD BY DEVICE ID ENDPOINT =====
      // GET /payload/:device_id - Ambil payload berdasarkan device ID
      .get(
        "/:device_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            // await authorizeRequest(jwt, cookie);
            const data = await payloadService.getByDeviceId(params.device_id);
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching payloads by device ID:", error);
            return new Response(
              JSON.stringify({
                error: "Gagal mengambil payload",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getPayloadByDeviceIdSchema
      )

      // ===== GET PAYLOAD BY DEVICE & DATASTREAM ENDPOINT =====
      // GET /payload/:device_id/:datastream_id - Ambil payload berdasarkan device dan datastream
      .get(
        "/:device_id/:datastream_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            // await authorizeRequest(jwt, cookie);
            const data = await payloadService.getByDeviceAndDatastream(
              params.device_id,
              params.datastream_id
            );
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error(
              "Error fetching payloads by device and datastream:",
              error
            );
            return new Response(
              JSON.stringify({
                error: "Gagal mengambil payload",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getPayloadByDeviceAndDatastreamSchema
      )

      // ===== GET WIDGET DATA ENDPOINT =====
      // GET /payload/widget/:widget_id - Ambil data untuk widget dashboard
      .get(
        "/widget/:widget_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            // await authorizeRequest(jwt, cookie);
            const data = await payloadService.getWidgetData(params.widget_id);
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching widget data:", error);
            return new Response(
              JSON.stringify({
                error: "Gagal mengambil data widget",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      )

      // ===== GET TIME SERIES DATA ENDPOINT =====
      // GET /payload/timeseries/:device_id/:datastream_id - Ambil time series data untuk chart
      .get(
        "/timeseries/:device_id/:datastream_id",
        //@ts-ignore
        async ({ jwt, cookie, params, query }) => {
          try {
            // await authorizeRequest(jwt, cookie);
            const timeRange = query.range || "1h"; // Default 1 jam
            const count = query.count; // Parameter count untuk filter berdasarkan jumlah data
            
            // Ambil time series data dengan filter range atau count
            const data = await payloadService.getTimeSeriesData(
              params.device_id,
              params.datastream_id,
              timeRange,
              count
            );
            
            return new Response(
              JSON.stringify({
                result: data,
                timeRange: timeRange,
                count: count || null,
                filterType: count ? 'count' : 'time',
                dataCount: Array.isArray(data) ? data.length : 0,
              }),
              {
                status: 200,
              }
            );
          } catch (error: any) {
            console.error("Error fetching time series data:", error);
            return new Response(
              JSON.stringify({
                error: "Gagal mengambil time series data",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      )
  );
}
