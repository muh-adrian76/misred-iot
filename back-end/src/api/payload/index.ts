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
          const deviceId = headers["x-device-id"];
          const authHeader = headers["authorization"];
          if (!deviceId || !authHeader) {
            set.status = 400;
            return { error: "Header tidak lengkap" };
          }
          const token = authHeader.split(" ")[1];
          if (!token) {
            set.status = 401;
            return { error: "Format token tidak valid" };
          }
          const decrypted = await payloadService.verifyDeviceJWTAndDecrypt({
            jwt,
            deviceId,
            token,
          });

          const insertId = await payloadService.saveHttpPayload({
            deviceId,
            decrypted,
          });

          return new Response(
            JSON.stringify({
              message: "Berhasil menambah data sensor",
              id: insertId,
              device_id: deviceId,
            }),
            { status: 201 }
          );
        },
        postPayloadHttpSchema
      )

      // CREATE Data Sensor LoRaWAN
      .post("/lora", async ({ body, set }) => {
        try {
          //@ts-ignore
          const { dev_eui, datastream_id, value } = body;
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
          set.status = 404;
          return { error: e.message || "internal_error" };
        }
      },
      postPayloadLoraSchema
    )

      // READ Semua Payload
      .get(
        "/all",
        //@ts-ignore
        async ({ jwt, cookie }) => {
          await authorizeRequest(jwt, cookie);
          const data = await payloadService.getAll();
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getAllPayloadsSchema
      )

      // READ Payload by Device ID
      .get(
        "/:device_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie);
          const data = await payloadService.getByDeviceId(params.device_id);
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getPayloadByDeviceIdSchema
      )

      // READ Payload by Device ID & Datastream ID
      .get(
        "/:device_id/:datastream_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie);
          const data = await payloadService.getByDeviceAndDatastream(
            params.device_id,
            params.datastream_id
          );
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getPayloadByDeviceAndDatastreamSchema
      )
  );
}
