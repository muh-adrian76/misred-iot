/**
 * ===== DEVICE API ROUTES - ENDPOINT MANAJEMEN DEVICE IoT =====
 * File ini mengatur semua operasi CRUD untuk device IoT termasuk firmware management
 * Meliputi: registrasi device, update config, delete, firmware upload/download, ping connectivity
 */
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
import { DeviceStatusService } from "../../services/DeviceStatusService";
// import { chirpstackService } from "../../lib/middleware";
import { generateSecretWithAllHexChars } from "../../lib/utils";
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
  updateDeviceStatusSchema,
  resetDeviceDataSchema,
} from "./elysiaSchema";

export function deviceRoutes(
  deviceService: DeviceService,
  deviceStatusService?: DeviceStatusService
) {
  return (
    new Elysia({ prefix: "/device" })

      // ===== ENDPOINT CEK KONEKTIVITAS =====
      // GET /device/ping - Cek konektivitas server untuk device
      .get(
        "/ping",
        (): any => {
          try {
            // Kembalikan status server untuk pengecekan konektivitas device
            return new Response(
              JSON.stringify({
                status: "ok",
                timestamp: new Date().toISOString(),
                server: "IoT Device Verification Server",
              })
            );
          } catch (error: any) {
            console.error("Kesalahan pada endpoint ping:", error);
            return new Response(
              JSON.stringify({
                error: "Kesalahan server",
                message: error.message || "Kesalahan server internal",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        pingSchema
      )

      // ===== ENDPOINT BUAT DEVICE =====
      // POST /device - Buat device IoT baru dengan konfigurasi lengkap
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);

            // Ekstrak data device dari request body
            const {
              name,
              board,
              protocol,
              mqtt_topic,
              offline_timeout_minutes,
              // mqtt_qos,
              // dev_eui,
              // app_eui,
              // app_key,
              firmware_version,
              firmware_url,
            } = body;

            // Generate secret key untuk autentikasi device
            const new_secret = generateSecretWithAllHexChars();
            const user_id = decoded.sub;

            // Buat device baru di database
            const insertId = await deviceService.createDevice({
              name,
              board,
              protocol,
              topic: mqtt_topic,
              offline_timeout_minutes: offline_timeout_minutes || 1, // Default 1 menit
              // qos: mqtt_qos,
              // dev_eui,
              // app_eui,
              // app_key,
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
            console.error("Kesalahan saat membuat perangkat:", error);

            // Periksa jika ini kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
            };
          }
        },
        postDeviceSchema
      )

      // Ambil semua perangkat
      .get(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const devices = await deviceService.getAllUserDevices(decoded.sub);

            // Tambahkan informasi status jika DeviceStatusService tersedia
            let devicesWithStatus = devices;
            if (deviceStatusService) {
              devicesWithStatus =
                await deviceStatusService.getUserDevicesWithStatus(decoded.sub);
            }

            return new Response(JSON.stringify({ result: devicesWithStatus }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Kesalahan saat mengambil semua perangkat:", error);

            // Periksa jika ini kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
                result: [],
              };
            }

            // Tangani kesalahan lainnya
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
              result: [],
            };
          }
        },
        getAllDevicesSchema
      )

      // Ambil perangkat berdasarkan ID
      .get(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
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
            console.error(
              "Kesalahan saat mengambil perangkat berdasarkan ID:",
              error
            );

            // Periksa jika ini kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
            };
          }
        },
        getDeviceByIdSchema
      )

      // Ambil device berdasarkan secret/key
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
            console.error("Kesalahan saat mengambil secret perangkat:", error);
            return new Response(
              JSON.stringify({
                error: "Gagal mengambil secret perangkat",
                message: error.message || "Kesalahan server internal",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getSecretByDeviceSchema
      )

      // Unggah firmware
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
            console.error("Kesalahan saat mengunggah firmware:", error);

            // Periksa jika ini kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
            };
          }
        },
        uploadFirmwareSchema
      )

      // Ambil versi firmware
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
            console.error("Kesalahan saat mengambil versi firmware:", error);
            return new Response(
              JSON.stringify({
                error: "Gagal mengambil versi firmware",
                message: error.message || "Kesalahan server internal",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        },
        getFirmwareVersionSchema
      )

      // ESP32 melaporkan versi firmware (setelah OTA)
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
                message: "firmware_version wajib diisi",
              };
            }

            // Perbarui firmware_version di database
            await deviceService.updateDeviceFirmwareVersion(
              deviceId,
              firmware_version
            );

            console.log(
              `✅ Perangkat ${deviceId} melaporkan versi firmware: ${firmware_version}`
            );

            return {
              success: true,
              message: "Versi firmware berhasil diperbarui",
              device_id: deviceId,
              new_version: firmware_version,
            };
          } catch (error) {
            console.error(
              "Kesalahan saat memperbarui versi firmware perangkat:",
              error
            );
            set.status = 500;
            return {
              success: false,
              message: "Gagal memperbarui versi firmware",
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }
      )

      // Unduh daftar firmware perangkat
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
            message: "Versi firmware berhasil diperbarui",
            device_id: params.deviceId,
            new_version: firmware_version,
          };
        } catch (error) {
          return {
            success: false,
            message: "Gagal memperbarui versi firmware",
          };
        }
      })

      // Perbarui secret perangkat
      .post(
        "/renew-secret/:device_id",
        //@ts-ignore
        async ({ params, body }: { params: any; body: any }) => {
          try {
            const deviceID = params.device_id;
            const oldSecret = body.old_secret;

            if (deviceID && oldSecret) {
              const newSecret = await deviceService.getNewSecret(
                deviceID,
                oldSecret
              );

              console.log(
                `🔄 Secret perangkat ${deviceID} diperbarui:`,
                newSecret
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
                  message: "device_id dan old_secret wajib diisi",
                }),
                { status: 400 }
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

      // Perbarui device
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
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
                  error: "Gagal memperbarui perangkat",
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
            console.error("Kesalahan saat memperbarui perangkat:", error);

            // Periksa jika ini kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Kesalahan server internal",
              }),
              { status: 500 }
            );
          }
        },
        putDeviceSchema
      )

      // Hapus device
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const deleted = await deviceService.deleteDevice(
              params.id,
              decoded.sub
            );
            if (!deleted) {
              return new Response(
                JSON.stringify({
                  error: "Gagal menghapus perangkat",
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
            console.error("Kesalahan saat menghapus perangkat:", error);

            // Periksa jika ini kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Kesalahan server internal",
              }),
              { status: 500 }
            );
          }
        },
        deleteDeviceSchema
      )

      // ===== ENDPOINT PERBARUI STATUS DEVICE =====
      // PUT /device/:id/status - Perbarui status device (online/offline)
      .put(
        "/:id/status",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const { status } = body as { status: "online" | "offline" };
            const deviceId = params.id;

            if (!status || !["online", "offline"].includes(status)) {
              set.status = 400;
              return {
                success: false,
                message: "Status tidak valid. Harus 'online' atau 'offline'",
              };
            }

            // Verifikasi kepemilikan perangkat
            const deviceResult = await deviceService.getDeviceById(deviceId);
            const devices = deviceResult as any[];

            if (!devices || devices.length === 0) {
              set.status = 404;
              return {
                success: false,
                message: "Perangkat tidak ditemukan",
              };
            }

            // Cek apakah perangkat milik pengguna
            if (devices[0].user_id !== parseInt(decoded.sub)) {
              set.status = 403;
              return {
                success: false,
                message: "Akses ditolak",
              };
            }

            // Perbarui hanya status perangkat di database (tanpa notifikasi)
            if (deviceStatusService) {
              await deviceStatusService.updateDeviceStatusOnly(
                deviceId,
                status
              );
            } else {
              // Fallback jika deviceStatusService tidak tersedia
              throw new Error("DeviceStatusService tidak tersedia");
            }

            return {
              success: true,
              message: `Status perangkat diperbarui menjadi ${status}`,
              device_id: deviceId,
              status: status,
            };
          } catch (error: any) {
            console.error(
              "Kesalahan saat memperbarui status perangkat:",
              error
            );

            if (error.message && error.message.includes("Unauthorized")) {
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
            };
          }
        },
        updateDeviceStatusSchema
      )

      // ===== ENDPOINT RESET DATA DEVICE =====
      // DELETE /device/:id/data - Reset seluruh data payload untuk device tertentu
      .delete(
        "/:id/data",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const deviceId = params.id;

            // Verifikasi kepemilikan perangkat
            const deviceResult = await deviceService.getDeviceById(deviceId);
            const devices = deviceResult as any[];

            if (!devices || devices.length === 0) {
              set.status = 404;
              return {
                success: false,
                message: "Perangkat tidak ditemukan",
              };
            }

            // Cek apakah perangkat milik pengguna
            if (devices[0].user_id !== parseInt(decoded.sub)) {
              set.status = 403;
              return {
                success: false,
                message: "Akses ditolak",
              };
            }

            // Reset data payload perangkat
            const deletedCount = await deviceService.resetDeviceData(deviceId);

            return {
              success: true,
              message: `Berhasil mereset semua data untuk perangkat ${devices[0].description}`,
              device_id: deviceId,
              deleted_payload_count: deletedCount.payloads,
              deleted_raw_payload_count: deletedCount.rawPayloads,
            };
          } catch (error: any) {
            console.error("Kesalahan saat mereset data perangkat:", error);

            if (error.message && error.message.includes("Unauthorized")) {
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
            };
          }
        },
        resetDeviceDataSchema
      )
  );
}
