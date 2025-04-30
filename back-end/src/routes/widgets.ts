// routes/widget.ts
import { Elysia } from 'elysia';
import { ResultSetHeader } from 'mysql2';
import { authorizeRequest } from '../utils/authorize';
import { JWT } from '../utils/types';
import { db } from '../utils/middleware';

export const widgetRoutes = new Elysia({ prefix: '/widget' })

  // ➕ CREATE Widget
  .post('/', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { description, device_id, sensor_type } = req.body;
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO widgets (description, device_id, sensor_type)
       VALUES (?, ?, ?)`,
      [description, device_id, sensor_type]
    );

    return new Response(JSON.stringify({
      message: 'Berhasil menambah data widget',
      id: result.insertId,
    }), { status: 201 });
  })

  // 📄 READ Semua Widget
  .get('/', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const [data] = await db.query("SELECT * FROM widgets");
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  })

  // 📄 READ Widget by Device ID
  .get('/:device_id', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    const { device_id } = req.params;
    const [data] = await db.query("SELECT * FROM widgets WHERE device_id = ?", [device_id]);
    return new Response(JSON.stringify({ result: data }), { status: 200 });
  })

  // ✏️ UPDATE Widget
  .put('/:id', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);

    const { description, device_id, sensor_type } = req.body;
    await db.query(
      `UPDATE widgets SET description = ?, device_id = ?, sensor_type = ? WHERE id = ?`,
      [description, device_id, sensor_type, req.params.id]
    );

    return new Response(JSON.stringify({ message: "Berhasil mengupdate data widget." }), { status: 200 });
  })

  // ❌ DELETE Widget
  .delete('/:id', async (req: JWT) => {
    console.log("Headers received: ", req.headers);
    await authorizeRequest(req);
    await db.query("DELETE FROM widgets WHERE id = ?", [req.params.id]);
    return new Response(JSON.stringify({ message: "Berhasil menghapus data widget." }), { status: 200 });
  });
