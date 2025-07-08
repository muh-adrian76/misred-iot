import { randomBytes } from "crypto";
import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { DeviceService } from "../../services/DeviceService";
import { chirpstackService } from "../../lib/middleware";
import {
  deleteDeviceSchema,
  getAllDevicesSchema,
  getDeviceByIdSchema,
  postDeviceSchema,
  putDeviceSchema,
} from "./elysiaSchema";

export function deviceRoutes(deviceService: DeviceService) {
  return (
    new Elysia({ prefix: "/device" })

      // Create device
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const { name, board, protocol, mqtt_topic, mqtt_qos, lora_profile } =
            body;
          const aesKey = randomBytes(32).toString("hex");
          const user_id = decoded.sub;

          const insertId = await deviceService.createDevice({
            name,
            board,
            protocol,
            topic: mqtt_topic,
            qos: mqtt_qos,
            loraProfile: lora_profile,
            aesKey,
            user_id,
          });

          return new Response(
            JSON.stringify({
              message: "Perangkat berhasil terdaftar",
              id: insertId,
              key: aesKey,
            }),
            { status: 201 }
          );
        },
        postDeviceSchema
      )

      // Get all devices
      .get(
        "/",
        //@ts-ignore
        async ({ jwt, cookie }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const data = await deviceService.getAllUserDevices(decoded.sub);
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getAllDevicesSchema
      )

      // Get device by ID
      .get(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie);
          const data = await deviceService.getDeviceById(params.id);
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getDeviceByIdSchema
      )

      // Update device
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const updated = await deviceService.updateDevice(params.id, decoded.sub, body);
          if (!updated) {
            return new Response("Perangkat gagal diupdate", { status: 400 });
          }
          return new Response(
            JSON.stringify({
              message: "Perangkat berhasil diupdate",
              id: params.id,
            }),
            { status: 200 }
          );
        },
        putDeviceSchema
      )

      // Delete device
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const deleted = await deviceService.deleteDevice(params.id, decoded.sub);
          if (!deleted) {
            return new Response("Perangkat gagal dihapus", { status: 400 });
          }
          return new Response(
            JSON.stringify({ message: "Perangkat berhasil dihapus" }),
            { status: 200 }
          );
        },
        deleteDeviceSchema
      )
  );
}
