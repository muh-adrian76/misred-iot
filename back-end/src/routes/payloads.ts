// routes/sensor.ts
import { Elysia } from 'elysia';
import { ResultSetHeader } from 'mysql2';
import { authorizeRequest } from '../utils/authorize';
import { JWT } from '../utils/types';
import { db } from '../utils/middleware';

export const sensorRoutes = new Elysia({ prefix: '/payload' })

  // 🆕 CREATE Data Sensor
  .post('/', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { device_id, ph, cod, tss, nh3n, flow } = req.body;
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [device_id, ph, cod, tss, nh3n, flow]
    );

    return new Response(JSON.stringify({
      message: 'Berhasil menambah data sensor',
      id: result.insertId,
    }), { status: 201 });
  })

  // 🔍 READ Semua Payload
  .get('/', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const [data] = await db.query("SELECT * FROM payloads");
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  })

  // 🔍 READ Payload by Device ID
  .get('/:device_id', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const { device_id } = req.params;
    const [data] = await db.query("SELECT * FROM payloads WHERE device_id = ?", [device_id]);
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  });
