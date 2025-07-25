import { Elysia } from "elysia";
import { PayloadService } from "../../services/PayloadService";
import {
  getAllPayloadsSchema,
  getPayloadByDeviceIdSchema,
  postPayloadHttpSchema,
  postPayloadLoraSchema,
  getPayloadByDeviceAndDatastreamSchema,
} from "./elysiaSchema";
import { authorizeRequest } from "../../lib/utils";

export function payloadRoutes(payloadService: PayloadService) {
  return (
    new Elysia({ prefix: "/payload" })

      // CREATE Data Sensor HTTP
      .post(
        "/http",
        //@ts-ignore
        async ({ jwt, headers, set }) => {
          try {
            const deviceId = headers["x-device-id"];
            const authHeader = headers["authorization"];
            
            if (!deviceId || !authHeader) {
              set.status = 400;
              return { 
                error: "Header tidak lengkap",
                message: "x-device-id and authorization headers are required"
              };
            }
            
            const token = authHeader.split(" ")[1];
            if (!token) {
              set.status = 401;
              return { 
                error: "Format token tidak valid",
                message: "Bearer token format required"
              };
            }
            
            const decrypted = await payloadService.verifyDeviceJWTAndDecrypt({
              deviceId,
              token,
            });

            const insertId = await payloadService.saveHttpPayload({
              deviceId,
              decrypted,
            });

            return {
              message: "Berhasil menambah data sensor",
              id: insertId,
              device_id: deviceId,
            };
          } catch (error: any) {
            console.error("Error processing HTTP payload:", error);
            set.status = 500;
            return { 
              error: "Failed to process payload",
              message: error.message || "Internal server error"
            };
          }
        },
        postPayloadHttpSchema
      )

      // CREATE Data Sensor LoRaWAN
      .post("/lora", async ({ body, set }) => {
        try {
          //@ts-ignore
          const { dev_eui, datastream_id, value } = body;
          
          if (!dev_eui || !datastream_id || value === undefined) {
            set.status = 400;
            return { 
              error: "Missing required parameters",
              message: "dev_eui, datastream_id, and value are required"
            };
          }
          
          const insertId = await payloadService.saveLoraPayload(
            dev_eui,
            datastream_id,
            value
          );
          set.status = 201;
          return {
            message: "Berhasil menambah data sensor dari LoRa",
            id: insertId,
          };
        } catch (e: any) {
          console.error("Error processing LoRa payload:", e);
          set.status = e.message === "Device not found" ? 404 : 500;
          return { 
            error: "Failed to process LoRa payload",
            message: e.message || "Internal server error"
          };
        }
      },
      postPayloadLoraSchema
    )

            // READ Payload by Device ID
      .get(
        "/:device_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const data = await payloadService.getByDeviceId(params.device_id);
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching payloads by device ID:", error);
            return new Response(
              JSON.stringify({ 
                error: "Failed to fetch payloads",
                message: error.message || "Internal server error"
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getPayloadByDeviceIdSchema
      )

      // READ Payload by Device ID & Datastream ID
      .get(
        "/:device_id/:datastream_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const data = await payloadService.getByDeviceAndDatastream(
              params.device_id,
              params.datastream_id
            );
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching payloads by device and datastream:", error);
            return new Response(
              JSON.stringify({ 
                error: "Failed to fetch payloads",
                message: error.message || "Internal server error"
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getPayloadByDeviceAndDatastreamSchema
      )

      // GET Widget Data (menggunakan view widget_data)
      .get(
        "/widget/:widget_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const data = await payloadService.getWidgetData(params.widget_id);
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching widget data:", error);
            return new Response(
              JSON.stringify({ 
                error: "Failed to fetch widget data",
                message: error.message || "Internal server error"
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      )

      // GET Time Series Data untuk Chart
      .get(
        "/timeseries/:device_id/:datastream_id",
        //@ts-ignore
        async ({ jwt, cookie, params, query }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const timeRange = query.range || '24h'; // Default 24 jam
            const data = await payloadService.getTimeSeriesData(
              params.device_id,
              params.datastream_id,
              timeRange
            );
            return new Response(JSON.stringify({ 
              result: data,
              timeRange: timeRange,
              count: Array.isArray(data) ? data.length : 0
            }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching time series data:", error);
            return new Response(
              JSON.stringify({ 
                error: "Failed to fetch time series data",
                message: error.message || "Internal server error"
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      )
  );
}
