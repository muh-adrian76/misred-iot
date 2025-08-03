/**
 * ===== OTAA (OVER-THE-AIR AUTHENTICATION) API ROUTES - FIRMWARE MANAGEMENT =====
 * File ini mengatur OTAA firmware management untuk device IoT
 * Meliputi: upload firmware, download, update check, board type management
 */

import Elysia, { t } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { OtaaUpdateService } from "../../services/OtaaUpdateService";
import {
  uploadFirmwareSchema,
  getFirmwaresSchema,
  getFirmwareByBoardSchema,
  getBoardTypesSchema,
  checkUpdateSchema,
  deleteFirmwareSchema,
} from "./elysiaSchema";

export function otaaRoutes(otaaService: OtaaUpdateService) {
  return new Elysia({ prefix: "/otaa" })
    // ===== UPLOAD FIRMWARE ENDPOINT =====
    // POST /otaa/upload - Upload firmware file untuk OTAA update
    .post(
      "/upload",
      //@ts-ignore
      async ({ jwt, cookie, body }) => {
        try {
          const { board_type, firmware_version, filename, file_base64 } = body as any;
          const decoded = await authorizeRequest(jwt, cookie);

          if (!file_base64) {
            return new Response(
              JSON.stringify({ error: "File firmware tidak ditemukan" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Validasi tipe file yang diizinkan
          const allowedTypes = [".bin", ".hex"];
          const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
          
          if (!allowedTypes.includes(ext)) {
            return new Response(
              JSON.stringify({ error: "Tipe file tidak valid. Hanya file .bin dan .hex yang diizinkan." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Simpan file dengan struktur folder berdasarkan user dan board
          const timestamp = Date.now();
          const newFileName = `${board_type}_v${firmware_version}_${timestamp}${ext}`;
          const userFirmwareDir = `user-${decoded.sub}`;
          const firmware_url = `/public/firmware/${userFirmwareDir}/${newFileName}`;

          // Convert base64 ke buffer dan tulis file
          const buffer = Buffer.from(file_base64, 'base64');
          
          const uploadDir = `${process.cwd()}/src/assets/firmware/${userFirmwareDir}`;
          
          // Buat direktori user jika belum ada
          await Bun.write(`${uploadDir}/.gitkeep`, ''); // Pastikan direktori dibuat
          await Bun.write(`${uploadDir}/${newFileName}`, buffer);

          // Calculate file metadata
          const fileSize = buffer.length;
          const crypto = await import('crypto');
          const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

          // Simpan metadata firmware ke database
          const firmwareId = await otaaService.createOrUpdateFirmware({
            board_type,
            firmware_version,
            firmware_url,
            user_id: decoded.sub,
            file_size: fileSize,
            original_filename: filename,
            checksum: checksum,
            description: `User firmware untuk ${board_type} v${firmware_version}`,
          });

          return {
            success: true,
            message: "Firmware berhasil diupload",
            data: {
              id: firmwareId,
              board_type,
              firmware_version,
              firmware_url,
            },
          };
        } catch (error: any) {
          console.error("Error uploading firmware:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Gagal upload firmware" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      uploadFirmwareSchema
    )
    // ===== GET ALL FIRMWARES ENDPOINT =====
    // GET /otaa - Ambil semua firmware milik user
    .get(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const firmwares = await otaaService.getAllFirmwares(decoded.sub);
          return { success: true, data: firmwares as any[] };
        } catch (error: any) {
          console.error("Error fetching firmwares:", error);
          return new Response(
            JSON.stringify({ 
              error: "Gagal mengambil data firmware",
              message: error.message || "Gagal mengambil data firmware"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      getFirmwaresSchema
    )
    
    // ===== GET FIRMWARE BY BOARD TYPE ENDPOINT =====
    // GET /otaa/board/:board_type - Ambil firmware berdasarkan tipe board
    .get(
      "/board/:board_type",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const firmware = await otaaService.getFirmwareByBoardType(
            params.board_type,
            decoded.sub
          );
          
          if (!firmware) {
            return new Response(
              JSON.stringify({ 
                error: "Firmware tidak ditemukan",
                message: "Tidak ada firmware untuk tipe board ini"
              }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          return { success: true, data: firmware };
        } catch (error: any) {
          console.error("Error fetching firmware:", error);
          return new Response(
            JSON.stringify({ 
              error: "Gagal mengambil firmware",
              message: error.message || "Gagal mengambil firmware"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      getFirmwareByBoardSchema
    )
    // ===== DOWNLOAD FIRMWARE ENDPOINT =====
    // GET /otaa/download/:board_type/:filename - Download file firmware
    .get(
      "/download/:board_type/:filename",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const { board_type, filename } = params;
          
          // Cari file berdasarkan user dan filename
          const filePath = `${process.cwd()}/src/assets/firmware/user-${decoded.sub}/${filename}`;
          const file = Bun.file(filePath);
          
          if (!(await file.exists())) {
            return new Response(
              JSON.stringify({ 
                error: "File tidak ditemukan",
                message: "File firmware tidak ada"
              }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }
          
          // Return file untuk download
          return new Response(file, {
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `attachment; filename="${filename}"`,
            },
          });
        } catch (error: any) {
          console.error("Error downloading firmware:", error);
          return new Response(
            JSON.stringify({ 
              error: "Gagal download firmware",
              message: error.message || "Gagal download firmware"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    )
    // ===== CHECK FIRMWARE UPDATE ENDPOINT =====
    // GET /otaa/check-update/:device_id - Cek apakah ada update firmware untuk device
    .get(
      "/check-update/:device_id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        try {
          await authorizeRequest(jwt, cookie);
          const updateInfo = await otaaService.checkFirmwareUpdate(params.device_id);
          return { success: true, data: updateInfo };
        } catch (error: any) {
          console.error("Error checking firmware update:", error);
          return new Response(
            JSON.stringify({ 
              error: "Gagal cek update firmware",
              message: error.message || "Gagal cek update firmware"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      checkUpdateSchema
    )
    
    // ===== DELETE FIRMWARE ENDPOINT =====
    // DELETE /otaa/:id - Hapus firmware berdasarkan ID
    .delete(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const success = await otaaService.deleteFirmware(params.id, decoded.sub);
          
          if (!success) {
            return new Response(
              JSON.stringify({ 
                error: "Firmware tidak ditemukan atau tidak berwenang",
                message: "Firmware tidak ditemukan atau tidak berwenang untuk menghapus"
              }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          return { success: true, message: "Firmware berhasil dihapus" };
        } catch (error: any) {
          console.error("Error deleting firmware:", error);
          return new Response(
            JSON.stringify({ 
              error: "Gagal menghapus firmware",
              message: error.message || "Gagal menghapus firmware"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      deleteFirmwareSchema
    );
}
