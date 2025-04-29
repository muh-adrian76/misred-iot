// routes/alarm.ts
import { Elysia } from 'elysia';
import { ResultSetHeader } from 'mysql2';
import { authorizeRequest } from '../utils/authorize';
import { JWT } from '../utils/interface';
import { db } from '../utils/middleware';

export const alarmRoutes = new Elysia({ prefix: '/alarm' })

  // ➕ CREATE Alarm
  .post('/', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { name, device_id, operator, threshold, sensor } = req.body;
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO alarms (description, device_id, operator, threshold, last_sended, sensor_type)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [name, device_id, operator, threshold, sensor]
    );

    return new Response(JSON.stringify({
      message: 'Berhasil menambah data alarm',
      id: result.insertId,
    }), { status: 201 });
  })

  // 📄 READ Semua Alarm
  .get('/', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const [data] = await db.query("SELECT * FROM alarms");
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  })

  // 📄 READ Alarm by Device ID
  .get('/:device_id', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const { device_id } = req.params;
    const [data] = await db.query("SELECT * FROM alarms WHERE device_id = ?", [device_id]);
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  })

  // ✏️ UPDATE Alarm
  .put('/:id', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { name, device_id, operator, threshold, sensor } = req.body;
    await db.query(
      `UPDATE alarms SET description = ?, device_id = ?, operator = ?, threshold = ?, sensor_type = ? WHERE id = ?`,
      [name, device_id, operator, threshold, sensor, req.params.id]
    );

    return new Response(JSON.stringify({ message: "Berhasil mengupdate data alarm." }), { status: 200 });
  })

  // ❌ DELETE Alarm
  .delete('/:id', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    await db.query("DELETE FROM alarms WHERE id = ?", [req.params.id]);
    return new Response(JSON.stringify({ message: "Berhasil menghapus data alarm." }), { status: 200 });
  });
