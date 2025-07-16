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
    .post(
      "/upload",
      //@ts-ignore
      async ({ jwt, cookie, body }) => {
        try {
          const { board_type, firmware_version, filename, file_base64 } = body as any;
          const decoded = await authorizeRequest(jwt, cookie);

          if (!file_base64) {
            return new Response(
              JSON.stringify({ error: "No firmware file provided" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Validate file type
          const allowedTypes = [".bin", ".hex"];
          const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
          
          if (!allowedTypes.includes(ext)) {
            return new Response(
              JSON.stringify({ error: "Invalid file type. Only .bin and .hex files are allowed." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Save file dengan struktur folder berdasarkan user dan board
          const timestamp = Date.now();
          const newFileName = `${board_type}_v${firmware_version}_${timestamp}${ext}`;
          const userFirmwareDir = `user-${decoded.sub}`;
          const firmware_url = `/public/firmware/${userFirmwareDir}/${newFileName}`;

          // Convert base64 to buffer and write file
          const buffer = Buffer.from(file_base64, 'base64');
          
          const uploadDir = `${process.cwd()}/src/assets/firmware/${userFirmwareDir}`;
          
          // Buat direktori user jika belum ada
          await Bun.write(`${uploadDir}/.gitkeep`, ''); // Pastikan direktori dibuat
          await Bun.write(`${uploadDir}/${newFileName}`, buffer);

          const firmwareId = await otaaService.createOrUpdateFirmware({
            board_type,
            firmware_version,
            firmware_url,
            user_id: decoded.sub,
          });

          return {
            success: true,
            message: "Firmware uploaded successfully",
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
            JSON.stringify({ error: error.message || "Failed to upload firmware" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      uploadFirmwareSchema
    )
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
            JSON.stringify({ error: error.message || "Failed to fetch firmwares" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      getFirmwaresSchema
    )
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
              JSON.stringify({ error: "No firmware found for this board type" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          return { success: true, data: firmware };
        } catch (error: any) {
          console.error("Error fetching firmware:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to fetch firmware" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      getFirmwareByBoardSchema
    )
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
            return new Response("File not found", { status: 404 });
          }
          
          return new Response(file, {
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `attachment; filename="${filename}"`,
            },
          });
        } catch (error: any) {
          console.error("Error downloading firmware:", error);
          return new Response("Failed to download firmware", { status: 500 });
        }
      }
    )
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
            JSON.stringify({ error: error.message || "Failed to check firmware update" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      checkUpdateSchema
    )
    .delete(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const success = await otaaService.deleteFirmware(params.id, decoded.sub);
          
          if (!success) {
            return new Response(
              JSON.stringify({ error: "Firmware not found or unauthorized" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          return { success: true, message: "Firmware deleted successfully" };
        } catch (error: any) {
          console.error("Error deleting firmware:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to delete firmware" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      deleteFirmwareSchema
    );
}
