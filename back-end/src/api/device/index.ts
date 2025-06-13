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
  return new Elysia({ prefix: "/device" })
  
    // Create device
    .post(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, body }) => {
        await authorizeRequest(jwt, cookie.auth);

        const { name, board, protocol } = body;
        let topic, qos, loraProfile;
        const aesKey = randomBytes(32).toString("hex");

        if (protocol === "mqtt") {
          topic = "device/data";
          qos = "0";
        }

        // if (protocol === "lora") {
        //   loraProfile = await chirpstackService(cookie.auth);
        // }

        const insertId = await deviceService.createDevice({
          name,
          board,
          protocol,
          topic,
          qos,
          loraProfile,
          aesKey,
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
      "/all",
      //@ts-ignore
      async ({ jwt, cookie }) => {
        await authorizeRequest(jwt, cookie.auth);
        const data = await deviceService.getAllDevices();
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getAllDevicesSchema
    )

    // Get device by ID
    .get(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie.auth);
        const data = await deviceService.getDeviceById(params.id);
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getDeviceByIdSchema
    )

    // Update device
    .put(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params, body }) => {
        await authorizeRequest(jwt, cookie.auth);
        const updated = await deviceService.updateDevice(params.id, body);
        if (!updated) {
          return new Response("Perangkat gagal diupdate", { status: 400 });
        }
        return new Response(
          JSON.stringify({ message: "Perangkat berhasil diupdate", id: params.id }),
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
        await authorizeRequest(jwt, cookie.auth);
        const deleted = await deviceService.deleteDevice(params.id);
        if (!deleted) {
          return new Response("Perangkat gagal dihapus", { status: 400 });
        }
        return new Response(
          JSON.stringify({ message: "Perangkat berhasil dihapus" }),
          { status: 200 }
        );
      },
      deleteDeviceSchema
    );
}
