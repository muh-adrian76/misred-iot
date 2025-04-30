import { randomBytes } from 'crypto';
import { Elysia } from 'elysia';
import { ResultSetHeader } from 'mysql2';
import { authorizeRequest } from '../utils/authorize';
import { JWT } from '../utils/types';
import { Chirpstack, db } from '../utils/middleware';

export const deviceRoutes = new Elysia({ prefix: '/device' })
  // 🔘 Create device
  .post('/', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    const { name, board, protocol } = req.body;
    let topic: string | undefined
    let qos: string | undefined
    let loraProfile: string | undefined;
    const jwtSecret = randomBytes(32).toString("hex");

    if (protocol === "mqtt" && token) {
      topic = "device/data", qos = "0";
    }

    if (protocol === "lora" && token) {
      loraProfile = await Chirpstack(token);
    }

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO devices (description, board_type, protocol, mqtt_topic, mqtt_qos, lora_profile, jwt_signature) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, board, protocol, topic ?? null, qos ?? null, loraProfile ?? null, jwtSecret]
    );

    return new Response(
      JSON.stringify({
        message: "Perangkat berhasil terdaftar",
        id: result.insertId,
      }),
      { status: 201 }
    );
  })

  // 📥 Get all devices
  .get("/", async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const [data] = await db.query<any[]>("SELECT * FROM devices");
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  })

  // 📥 Get device by ID
  .get("/:id", async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { id } = req.params;
    const [data] = await db.query<any[]>("SELECT * FROM devices WHERE id = ?", [id]);
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  })

  // ✏️ Update device
  .put("/:id", async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { id } = req.params;
    const { name, board, protocol } = req.body;
    await db.query(
      "UPDATE devices SET description = ?, board_type = ?, protocol = ? WHERE id = ?",
      [name, board, protocol, id]
    );

    return new Response(
      JSON.stringify({ message: "Perangkat berhasil diupdate" }),
      { status: 200 }
    );
  })

  // ❌ Delete device
  .delete("/:id", async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { id } = req.params;
    await db.query("DELETE FROM devices WHERE id = ?", [id]);
    await db.query("DELETE FROM payloads WHERE devices_id = ?", [id]);
    await db.query("DELETE FROM widgets WHERE devices_id = ?", [id]);
    await db.query("DELETE FROM alarms WHERE devices_id = ?", [id]);

    return new Response(
      JSON.stringify({ message: "Perangkat berhasil dihapus" }),
      { status: 200 }
    );
  });
