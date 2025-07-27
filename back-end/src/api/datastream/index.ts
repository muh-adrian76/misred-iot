import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { DatastreamService } from "../../services/DatastreamService";
import {
  getAllDatastreamsSchema,
  postDatastreamSchema,
  deleteDatastreamSchema,
  putDatastreamSchema,
} from "./elysiaSchema";

export function datastreamRoutes(datastreamService: DatastreamService) {
  return (
    new Elysia({ prefix: "/datastream" })
      // Get all datastreams for a device
      .get(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            const datastreams = await datastreamService.getDatastreamsByUserId(
              user.sub
            );
            return new Response(JSON.stringify({ result: datastreams }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error in get all datastreams:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                result: []
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
              result: []
            };
          }
        },
        getAllDatastreamsSchema
      )

      // Get datastreams by device ID
      .get(
        "/device/:deviceId",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            const datastreams = await datastreamService.getDatastreamsByDeviceId(
              params.deviceId,
              user.sub
            );
            return new Response(JSON.stringify({ result: datastreams }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error in get datastreams by device ID:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                result: []
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
              result: []
            };
          }
        }
      )

      // Get single datastream by ID
      .get(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            const datastream = await datastreamService.getDatastreamById(
              params.id,
              user.sub
            );
            if (!datastream) {
              return new Response(
                JSON.stringify({ message: "Datastream tidak ditemukan" }),
                { status: 404 }
              );
            }
            return new Response(JSON.stringify({ result: datastream }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error in get datastream by ID:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed"
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error"
            };
          }
        }
      )

      // Create a new datastream
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            const {
              deviceId,
              pin,
              type,
              unit,
              description,
              defaultValue,
              minValue,
              maxValue,
              decimalValue,
              booleanValue,
            } = body;
            const datastreamId = await datastreamService.createDatastream({
              userId: user.sub,
              deviceId,
              pin,
              type,
              unit,
              description,
              defaultValue,
              minValue,
              maxValue,
              decimalValue,
              booleanValue,
            });
            return new Response(
              JSON.stringify({
                message: "Datastream berhasil dibuat",
                id: datastreamId,
              }),
              { status: 201 }
            );
          } catch (error: any) {
            console.error("Error in create datastream:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed"
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error"
            };
          }
        },
        postDatastreamSchema
      )

      // Update datastream
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const {
              deviceId,
              pin,
              type,
              unit,
              description,
              defaultValue,
              minValue,
              maxValue,
              decimalValue,
              booleanValue,
            } = body;
            const updated = await datastreamService.updateDatastream(params.id, {
              deviceId,
              pin,
              type,
              unit,
              description,
              defaultValue,
              minValue,
              maxValue,
              decimalValue,
              booleanValue,
            });
            if (!updated) {
              return new Response("Datastream gagal diupdate", { status: 400 });
            }
            return new Response(
              JSON.stringify({ message: "Datastream berhasil diupdate" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in update datastream:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed"
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error"
            };
          }
        },
        putDatastreamSchema
      )

      // Delete a datastream
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const deleted = await datastreamService.deleteDatastream(params.id);
            if (!deleted) {
              return new Response("Datastream gagal dihapus", { status: 400 });
            }
            return new Response(
              JSON.stringify({ message: "Datastream berhasil dihapus" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in delete datastream:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed"
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error"
            };
          }
        },
        deleteDatastreamSchema
      )
  );
}
