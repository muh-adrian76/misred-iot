import { randomBytes } from "crypto";
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { DeviceService } from "../../services/DeviceService";
import { chirpstackService } from "../../lib/middleware";
import {
  deleteDeviceSchema,
  getAllDevicesSchema,
  getDeviceByIdSchema,
  getSecretByDeviceSchema,
  postDeviceSchema,
  putDeviceSchema,
  uploadFirmwareSchema,
  getFirmwareVersionSchema,
  pingSchema,
  getFirmwareListSchema,
  downloadFirmwareFileSchema,
  renewSecretSchema,
} from "./elysiaSchema";
import { datastreamRoutes } from "../datastream";

export function deviceRoutes(deviceService: DeviceService) {
  return (
    new Elysia({ prefix: "/device" })

      // Connectivity Check
      .get(
        "/ping",
        (): any => {
          return new Response(
            JSON.stringify({
              status: "ok",
              timestamp: new Date().toISOString(),
              server: "IoT Device Verification Server",
            })
          );
        },
        pingSchema
      )

      // Create device
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const {
            name,
            board,
            protocol,
            mqtt_topic,
            mqtt_qos,
            dev_eui,
            app_eui,
            app_key,
            firmware_version,
            firmware_url,
          } = body;
          const new_secret = randomBytes(16).toString("hex");
          const user_id = decoded.sub;

          const insertId = await deviceService.createDevice({
            name,
            board,
            protocol,
            topic: mqtt_topic,
            qos: mqtt_qos,
            dev_eui,
            app_eui,
            app_key,
            new_secret,
            firmware_version: firmware_version ?? null,
            firmware_url: firmware_url ?? null,
            user_id,
          });

          return new Response(
            JSON.stringify({
              message: "Perangkat berhasil terdaftar",
              id: insertId,
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
          if (!datastreamRoutes) {
            return new Response(
              JSON.stringify({ message: "Perangkat tidak ditemukan." }),
              { status: 404 }
            );
          }
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getDeviceByIdSchema
      )

      // Get device by secret/key
      .get(
        "/secret/:id",
        //@ts-ignore
        async ({ params }) => {
          const data = await deviceService.getSecretByDevice(params.id);
          if (!data) {
            return new Response(
              JSON.stringify({ message: "Device tidak ditemukan" }),
              { status: 404 }
            );
          }
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getSecretByDeviceSchema
      )

      // Upload firmware
      .post(
        "/firmware/upload/:deviceId",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          await authorizeRequest(jwt, cookie);
          const deviceId = params.id;
          //@ts-ignore
          const { filename, file_base64, firmware_version } = body;
          if (!file_base64 || !filename) {
            set.status = 400;
            return { message: "File firmware tidak ditemukan di request" };
          }
          // Validasi ekstensi file
          const allowedExt = [".bin", ".hex"];
          const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
          if (!allowedExt.includes(ext)) {
            set.status = 400;
            return { message: "Hanya file .bin atau .hex yang diperbolehkan" };
          }
          // Decode base64 ke buffer
          const data = Buffer.from(file_base64, "base64");
          const firmwareDir = join(
            process.cwd(),
            "src",
            "assets",
            "firmware",
            deviceId
          );
          if (!existsSync(firmwareDir))
            mkdirSync(firmwareDir, { recursive: true });

          const firmwarePath = join(firmwareDir, filename);
          writeFileSync(firmwarePath, data);

          // Simpan path/URL ke DB (opsional)
          const firmware_url = `/device/firmware/${deviceId}/${filename}`;
          const updated_at = await deviceService.updateFirmwareUrl(
            deviceId,
            firmware_version,
            firmware_url
          );

          return new Response(
            JSON.stringify({
              message: "Firmware berhasil diupload",
              device_id: deviceId,
              firmware_version,
              filename,
              firmware_url,
              updated_at,
            }),
            { status: 200 }
          );
        },
        uploadFirmwareSchema
      )

      // Get firmware version
      .get(
        "/firmware/version/:deviceId",
        //@ts-ignore
        async ({ params }) => {
          const version = await deviceService.getFirmwareVersion(
            params.deviceId
          );
          return new Response(
            JSON.stringify({
              message: "Versi firmware perangkat",
              device_id: params.deviceId,
              firmware_version: version,
            }),
            { status: 200 }
          );
        },
        getFirmwareVersionSchema
      )

      // Download Firmware Device
      .get(
        "/firmware/:deviceId/",
        async ({ params, set }) => {
          const firmwareDir = join(
            process.cwd(),
            "src",
            "assets",
            "firmware",
            params.deviceId
          );
          if (!existsSync(firmwareDir)) {
            set.status = 404;
            return "Firmware tidak ditemukan";
          }
          const files = readdirSync(firmwareDir);
          return files.map((file) => ({
            name: file,
            url: `/device/firmware/${params.deviceId}/${file}`,
          }));
        },
        getFirmwareListSchema
      )

      .get(
        "/firmware/:deviceId/:filename",
        //@ts-ignore
        async ({ params, set }) => {
          const filePath = join(
            process.cwd(),
            "src",
            "assets",
            "firmware",
            params.deviceId,
            params.filename
          );
          console.log(filePath);
          if (!existsSync(filePath)) {
            set.status = 404;
            return "Firmware tidak ditemukan";
          }
          set.headers["Content-Type"] = "application/octet-stream";
          set.headers[
            "Content-Disposition"
          ] = `attachment; filename="${params.filename}"`;
          return readFileSync(filePath);
        },
        downloadFirmwareFileSchema
      )

      // Renew device secret
      .post(
        "/renew-secret/:device_id",
        //@ts-ignore
        async ({ params, body }: { params: any; body: any }) => {
          const deviceID = params.device_id;
          const oldSecret = body.old_secret;

          const newSecret = await deviceService.getNewSecret(
            deviceID,
            oldSecret
          );

          // Kirim secret baru
          return new Response(
            JSON.stringify({
              message: "Berhasil memperbarui secret perangkat",
              device_id: deviceID,
              secret_key: newSecret,
            }),
            { status: 200 }
          );
        },
        renewSecretSchema
      )

      // Update device
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const updated = await deviceService.updateDevice(
            params.id,
            decoded.sub,
            body
          );
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
          const deleted = await deviceService.deleteDevice(
            params.id,
            decoded.sub
          );
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
