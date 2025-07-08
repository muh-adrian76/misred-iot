// routes/sensor.ts
import { Elysia, t } from "elysia";
import { ResultSetHeader } from "mysql2";
import { authorizeRequest } from "../../lib/utils";
import { Types } from "../../lib/types";
import { PayloadService } from "../../services/PayloadService";
import { getAllPayloadsSchema, getPayloadByDeviceIdSchema, postPayloadSchema } from "./elysiaSchema";

export function payloadRoutes(payloadService: PayloadService) {
  return new Elysia({ prefix: "/payload" })

  // 🆕 CREATE Data Sensor
  .post(
      "/",
      // @ts-ignore
      async ({ jwt, cookie, body }) => {
        await authorizeRequest(jwt, cookie);

        const { device_id, ph, cod, tss, nh3n, flow } = body;
        const insertId = await payloadService.saveHttpPayload({
          device_id, ph, cod, tss, nh3n, flow
        });

        return new Response(
          JSON.stringify({
            message: "Berhasil menambah data sensor",
            id: insertId,
            device_id: device_id,
          }),
          { status: 201 }
        );
      },
    postPayloadSchema
  )

  // 🔍 READ Semua Payload
  .get(
      "/all",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        await authorizeRequest(jwt, cookie);
        const data = await payloadService.getAll();
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
    getAllPayloadsSchema
  )

  // 🔍 READ Payload by Device ID
  .get(
      "/:device_id",
      // @ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie);
        const data = await payloadService.getByDeviceId(params.device_id);
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
    getPayloadByDeviceIdSchema
  )
}
