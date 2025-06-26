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
        async ({ jwt, cookie }) => {
          const user = await authorizeRequest(jwt, cookie);
          const datastreams = await datastreamService.getDatastreamsByUserId(
            user.sub
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
          const user = await authorizeRequest(jwt, cookie);
          const { pin, type, unit, description, defaultValue, minValue, maxValue } = body;
          const datastreamId = await datastreamService.createDatastream({
            userId: user.sub,
            pin,
            type,
            unit,
            description,
            defaultValue,
            minValue,
            maxValue,
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

      // Update datastream
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body }) => {
          await authorizeRequest(jwt, cookie);
          const { pin, type, unit, description, defaultValue, minValue, maxValue } = body;
          const updated = await datastreamService.updateDatastream(params.id, {
            pin,
            type,
            unit,
            description,
            defaultValue,
            minValue,
            maxValue,
          });
          if (!updated) {
            return new Response("Datastream gagal diupdate", { status: 400 });
          }
          return new Response(
            JSON.stringify({ message: "Datastream berhasil diupdate" }),
            { status: 200 }
          );
        },
        putDatastreamSchema
      )

      // Delete a datastream
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie);
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
