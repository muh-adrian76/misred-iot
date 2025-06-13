import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { DatastreamService } from "../../services/DatastreamService";
import {
  getAllDatastreamsSchema,
  postDatastreamSchema,
  deleteDatastreamSchema,
} from "./elysiaSchema";

export function datastreamRoutes(datastreamService: DatastreamService) {
  return (
    new Elysia({ prefix: "/datastream" })
      // Get all datastreams for a device
      .get(
        "/:deviceId",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie.auth);
          const datastreams = await datastreamService.getDatastreamsByDeviceId(
            params.deviceId
          );
          return new Response(JSON.stringify({ result: datastreams }), {
            status: 200,
          });
        },
        getAllDatastreamsSchema
      )

      // Create a new datastream
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body }) => {
          await authorizeRequest(jwt, cookie.auth);
          const { deviceId, pin, type, unit, description } = body;
          const datastreamId = await datastreamService.createDatastream({
            deviceId,
            pin,
            type,
            unit,
            description,
          });
          return new Response(
            JSON.stringify({
              message: "Datastream berhasil dibuat",
              id: datastreamId,
            }),
            { status: 201 }
          );
        },
        postDatastreamSchema
      )

      // Delete a datastream
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie.auth);
          const deleted = await datastreamService.deleteDatastream(params.id);
          if (!deleted) {
            return new Response("Datastream gagal dihapus", { status: 400 });
          }
          return new Response(
            JSON.stringify({ message: "Datastream berhasil dihapus" }),
            { status: 200 }
          );
        },
        deleteDatastreamSchema
      )
  );
}
