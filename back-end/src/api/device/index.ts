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
// import { chirpstackService } from "../../lib/middleware";
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
          try {
            return new Response(
              JSON.stringify({
                status: "ok",
                timestamp: new Date().toISOString(),
                server: "IoT Device Verification Server",
              })
            );
          } catch (error: any) {
            console.error("Error in ping endpoint:", error);
            return new Response(
              JSON.stringify({
                error: "Server error",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        pingSchema
      )

      // Create device
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const {
              name,
              board,
              protocol,
              mqtt_topic,
              // mqtt_qos,
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
              // qos: mqtt_qos,
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
          } catch (error: any) {
            console.error("Error creating device:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to create device",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        postDeviceSchema
      )

      // Get all devices
      .get(
        "/",
        //@ts-ignore
        async ({ jwt, cookie }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const data = await deviceService.getAllUserDevices(decoded.sub);
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching all devices:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to fetch devices",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getAllDevicesSchema
      )

      // Get device by ID
      .get(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const data = await deviceService.getDeviceById(params.id);
            if (!data || (Array.isArray(data) && data.length === 0)) {
              return new Response(
                JSON.stringify({ message: "Perangkat tidak ditemukan." }),
                { status: 404 }
              );
            }
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching device by ID:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to fetch device",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getDeviceByIdSchema
      )

      // Get device by secret/key
      .get(
        "/secret/:id",
        //@ts-ignore
        async ({ params }) => {
          try {
            const data = await deviceService.getSecretByDevice(params.id);
            if (!data || (Array.isArray(data) && data.length === 0)) {
              return new Response(
                JSON.stringify({ message: "Device tidak ditemukan" }),
                { status: 404 }
              );
            }
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error fetching device secret:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to fetch device secret",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getSecretByDeviceSchema
      )

      // Upload firmware
      .post(
        "/firmware/upload/:deviceId",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const deviceId = params.deviceId;
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
              return {
                message: "Hanya file .bin atau .hex yang diperbolehkan",
              };
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
          } catch (error: any) {
            console.error("Error uploading firmware:", error);
            set.status = 500;
            return {
              error: "Failed to upload firmware",
              message: error.message || "Internal server error",
            };
          }
        },
        uploadFirmwareSchema
      )

      // Get firmware version
      .get(
        "/firmware/version/:deviceId",
        //@ts-ignore
        async ({ params }) => {
          try {
            const version = await deviceService.getFirmwareVersion(
              params.deviceId
            );
            return new Response(
              JSON.stringify({
                message: "Versi firmware perangkat",
                device_id: params.deviceId,
                firmware_version: version.firmware_version, // Sesuaikan dengan ESP32
                current_version: version.current_version,
                board_type: version.board_type,
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error fetching firmware version:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to fetch firmware version",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getFirmwareVersionSchema
      )

      // ESP32 Report Firmware Version (untuk update setelah OTA)
      .post(
        "/firmware/report/:deviceId",
        //@ts-ignore
        async ({ params, body, set }) => {
          try {
            //@ts-ignore
            const { firmware_version } = body;
            const deviceId = params.deviceId;

            if (!firmware_version) {
              set.status = 400;
              return {
                success: false,
                message: "firmware_version is required",
              };
            }

            // Update firmware_version di database
            await deviceService.updateDeviceFirmwareVersion(
              deviceId,
              firmware_version
            );

            console.log(
              `✅ Device ${deviceId} reported firmware version: ${firmware_version}`
            );

            return {
              success: true,
              message: "Firmware version updated successfully",
              device_id: deviceId,
              new_version: firmware_version,
            };
          } catch (error) {
            console.error("Error updating device firmware version:", error);
            set.status = 500;
            return {
              success: false,
              message: "Failed to update firmware version",
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }
      )

      // Download Firmware Device
      .get(
        "/firmware/:deviceId/",
        async ({ params, set }) => {
          try {
            const files = await deviceService.getFirmwareList(params.deviceId);
            return files;
          } catch (error) {
            set.status = 404;
            return "Firmware tidak ditemukan";
          }
        },
        getFirmwareListSchema
      )

      .get(
        "/firmware/:deviceId/:filename",
        //@ts-ignore
        async ({ params, set }) => {
          try {
            const filePath = await deviceService.getFirmwareFile(
              params.deviceId,
              params.filename
            );

            const file = Bun.file(filePath);
            if (!(await file.exists())) {
              set.status = 404;
              return "Firmware tidak ditemukan";
            }

            return new Response(file, {
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${params.filename}"`,
              },
            });
          } catch (error) {
            set.status = 404;
            return "Firmware tidak ditemukan";
          }
        },
        downloadFirmwareFileSchema
      )

      .post("/firmware/report/:deviceId", async ({ params, body }) => {
        try {
          //@ts-ignore
          const { firmware_version } = body;
          await deviceService.updateDeviceFirmwareVersion(
            params.deviceId,
            firmware_version
          );
          return {
            success: true,
            message: "Firmware version updated successfully",
            device_id: params.deviceId,
            new_version: firmware_version,
          };
        } catch (error) {
          return {
            success: false,
            message: "Failed to update firmware version",
          };
        }
      })

      // Renew device secret
      .post(
        "/renew-secret/:device_id",
        //@ts-ignore
        async ({ params, body }: { params: any; body: any }) => {
          try {
            const deviceID = params.device_id;
            const oldSecret = body.old_secret;

            if (!deviceID || !oldSecret) {
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
            } else {
              return new Response(
                JSON.stringify({
                  message: "Gagal memperbarui secret perangkat",
                }),
                { status: 401 }
              );
            }
          } catch (error) {
            console.error(error);
            return new Response(
              JSON.stringify({
                message: "Gagal memperbarui secret perangkat",
              }),
              { status: 400 }
            );
          }
        },
        renewSecretSchema
      )

      // Update device
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const updated = await deviceService.updateDevice(
              params.id,
              decoded.sub,
              body
            );
            if (!updated) {
              return new Response(
                JSON.stringify({
                  error: "Failed to update device",
                  message: "Perangkat gagal diupdate",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }
            return new Response(
              JSON.stringify({
                message: "Perangkat berhasil diupdate",
                id: params.id,
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error updating device:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to update device",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        putDeviceSchema
      )

      // Delete device
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const deleted = await deviceService.deleteDevice(
              params.id,
              decoded.sub
            );
            if (!deleted) {
              return new Response(
                JSON.stringify({
                  error: "Failed to delete device",
                  message: "Perangkat gagal dihapus",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }
            return new Response(
              JSON.stringify({ message: "Perangkat berhasil dihapus" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error deleting device:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to delete device",
                message: error.message || "Internal server error",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        deleteDeviceSchema
      )
  );
}
