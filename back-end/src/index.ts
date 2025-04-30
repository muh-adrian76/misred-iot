import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { randomBytes } from "crypto";
import { Elysia, t } from "elysia";
import { ResultSetHeader } from 'mysql2';
import { authorizeRequest } from "./utils/authorize";
import { Auth, JWT } from './utils/types';
import { Chirpstack, db, mqttClient } from "./utils/middleware";

const app = new Elysia()
  .use(
    cors({
      preflight: true,
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(swagger())
  // USER ENDPOINTS
  .post('/user/register', ({ body }) => ({ message: `User ${body.username} registered.` }), {
    body: t.Object({ username: t.String(), email: t.String(), password: t.String() })
  })
  .post('/user/login', ({ body }) => ({ message: `User ${body.email} logged in.` }), {
    body: t.Object({ email: t.String(), password: t.String() })
  })
  .get('/user/renew/:id', ({ params }) => ({ message: `Token renewed for user ${params.id}` }), {
    params: t.Object({ id: t.String() })
  })
  .post('/user/logout/:id', ({ params }) => ({ message: `User ${params.id} logged out.` }), {
    params: t.Object({ id: t.String() })
  })
  .get('/user', () => ({ message: 'All users fetched.' }))
  .get('/user/:id', ({ params }) => ({ message: `User ${params.id} fetched.` }), {
    params: t.Object({ id: t.String() })
  })
  .put('/user/:id', ({ params, body }) => ({ message: `User ${params.id} updated.` }), {
    params: t.Object({ id: t.String() }),
    body: t.Partial(t.Object({ username: t.String(), email: t.String(), password: t.String() }))
  })
  .delete('/user/:id', ({ params }) => ({ message: `User ${params.id} deleted.` }), {
    params: t.Object({ id: t.String() })
  })

  // DEVICE ENDPOINTS
  .post('/device', ({ body }) => ({ message: `Device ${body.name} created.` }), {
    body: t.Object({ name: t.String(), location: t.String(), description: t.Optional(t.String()) })
  })
  .get('/device', () => ({ message: 'All devices fetched.' }))
  .get('/device/:id', ({ params }) => ({ message: `Device ${params.id} fetched.` }), {
    params: t.Object({ id: t.String() })
  })
  .put('/device/:id', ({ params, body }) => ({ message: `Device ${params.id} updated.` }), {
    params: t.Object({ id: t.String() }),
    body: t.Partial(t.Object({ name: t.String(), location: t.String(), description: t.String() }))
  })
  .delete('/device/:id', ({ params }) => ({ message: `Device ${params.id} deleted.` }), {
    params: t.Object({ id: t.String() })
  })

  // PAYLOAD ENDPOINTS
  .post('/payload', ({ body }) => ({ message: `Payload for device ${body.device_id} stored.` }), {
    body: t.Object({
      device_id: t.String(), ph: t.Number(), cod: t.Number(), tss: t.Number(),
      nh3n: t.Number(), flow: t.Number(), timestamp: t.Optional(t.String())
    })
  })
  .get('/payload', () => ({ message: 'All payloads fetched.' }))
  .get('/payload/:device_id', ({ params }) => ({ message: `Payload for device ${params.device_id} fetched.` }), {
    params: t.Object({ device_id: t.String() })
  })

  // WIDGET ENDPOINTS
  .post('/widget', ({ body }) => ({ message: `Widget for device ${body.device_id} created.` }), {
    body: t.Object({ device_id: t.String(), type: t.String(), config: t.Record(t.String(), t.Any()) })
  })
  .get('/widget', () => ({ message: 'All widgets fetched.' }))
  .get('/widget/:device_id', ({ params }) => ({ message: `Widgets for device ${params.device_id} fetched.` }), {
    params: t.Object({ device_id: t.String() })
  })
  .put('/widget/:id', ({ params, body }) => ({ message: `Widget ${params.id} updated.` }), {
    params: t.Object({ id: t.String() }),
    body: t.Partial(t.Object({ type: t.String(), config: t.Record(t.String(), t.Any()) }))
  })
  .delete('/widget/:id', ({ params }) => ({ message: `Widget ${params.id} deleted.` }), {
    params: t.Object({ id: t.String() })
  })

  // ALARM ENDPOINTS
  .post('/alarm', ({ body }) => ({ message: `Alarm for ${body.parameter} created.` }), {
    body: t.Object({
      device_id: t.String(), parameter: t.String(), threshold: t.Number(),
      condition: t.String(), message: t.String()
    })
  })
  .get('/alarm', () => ({ message: 'All alarms fetched.' }))
  .get('/alarm/:device_id', ({ params }) => ({ message: `Alarms for device ${params.device_id} fetched.` }), {
    params: t.Object({ device_id: t.String() })
  })
  .put('/alarm/:id', ({ params, body }) => ({ message: `Alarm ${params.id} updated.` }), {
    params: t.Object({ id: t.String() }),
    body: t.Partial(t.Object({
      parameter: t.String(), threshold: t.Number(), condition: t.String(), message: t.String()
    }))
  })
  .delete('/alarm/:id', ({ params }) => ({ message: `Alarm ${params.id} deleted.` }), {
    params: t.Object({ id: t.String() })
  })
  .use(
    jwt({
      name: "jwt",
      secret: Bun.env.JWT_SECRET!,
      exp: Bun.env.ACCESS_TOKEN_AGE
    })
  )
  .onError(({ code }) => {
    if (code === "NOT_FOUND") {
      return "Route not found :(";
    }
  });

// Register User
app.post("/register", async (req: Auth) => {
  const { username, password, email } = req.body;
  if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return new Response(
      JSON.stringify({ message: "Email tidak valid. Gagal menambahkan user." }),
      { status: 400 }
    );
  }

  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
  });

  const [result] = email
    ? await db.query<ResultSetHeader>(
        "INSERT INTO users (email, password, last_login) VALUES (?, ?, NOW())",
        [email, hashedPassword]
      )
    : await db.query<ResultSetHeader>(
        "INSERT INTO users (username, password, last_login) VALUES (?, ?, NOW())",
        [username, hashedPassword]
      );

  return new Response(
    JSON.stringify({ message: "User berhasil terdaftar", id: result.insertId }),
    { status: 201 }
  );
});

// Login User
app.post("/login", async (req: Auth) => {
  const { username, password, email } = req.body;
  if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return new Response(
      JSON.stringify({ message: "Email tidak valid. Gagal menambahkan user." }),
      { status: 400 }
    );
  }
  const [rows] = await db.query<any[]>(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email]
  );
  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ message: "Invalid credentials" }), {
      status: 401,
    });
  }

  const user = rows[0];
  const isMatch = await Bun.password.verify(password, user.password);

  if (!user || !isMatch) {
    return new Response(JSON.stringify({ message: "Invalid credentials" }), {
      status: 401,
    });
  }

  const accessToken = await req.jwt.sign({
    sub: user.id,
    iat: Math.floor(Date.now() / 1000),
    type: "access",
  });

  const response = await fetch(`http://localhost:7601/sign/${user.id}`);
  const refreshToken = await response.text(); 

  
  await db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [
    refreshToken,
    user.id,
  ]);

  return new Response(JSON.stringify({ accessToken, refreshToken }), {
    status: 200,
  });
});

// Refresh Token JWT
app.get("/renew/:id", async (req: JWT) => {
  const { id } = req.params;
  
  const [rows] = await db.query<any[]>('SELECT refresh_token FROM users WHERE id = ?', [id]);
  const refreshToken = rows?.[0]?.refresh_token;

  try {
    const decoded = await req.jwt.verify(refreshToken);

    const newAccessToken = await req.jwt.sign({
      sub: decoded.sub,
      iat: Math.floor(Date.now() / 1000),
      type: "access",
    });

    return new Response(JSON.stringify({ accessToken: newAccessToken }), {
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "Invalid or expired refresh token" }),
      { status: 401 }
    );
  }
});


export const userRoutes = new Elysia({ prefix: "/users" })
// 🔍 Get all users
.get("/", async (req: JWT) => {
  await authorizeRequest(req)
  const [rows] = await db.query<any[]>("SELECT * FROM users");
  return rows;
})

// 🔍 Get user by ID
.get("/:id", async (req: JWT) => {
  await authorizeRequest(req);
  const [rows] = await db.query<any[]>("SELECT * FROM users WHERE id = ?", [req.params.id]);
  return rows[0] || new Response("User not found", { status: 404 });
})

// ✏️ Update user by ID
.put("/:id", async (req: JWT) => {
  await authorizeRequest(req);
  const { username, password, name, email } = req.body;

  const [result] = await db.query<ResultSetHeader>(
    `UPDATE users SET username=?, password=?, name=?, email=? WHERE id=?`,
    [username, password, name, email, req.params.id]
  );

  return {
    message: "User berhasil diperbarui",
    affectedRows: result.affectedRows,
  };
})

// ❌ Delete user
.delete("/:id", async (req: JWT) => {
  await authorizeRequest(req);
  const [result] = await db.query<ResultSetHeader>("DELETE FROM users WHERE id = ?", [req.params.id]);

  return {
    message: "User berhasil dihapus",
    affectedRows: result.affectedRows,
  };
});

// CREATE Device
app.post("/device", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  // Data
  const { name, board, protocol } = req.body;
  let topic: string | undefined, qos: string | undefined, loraProfile: string | undefined;
  const jwtSecret = randomBytes(32).toString("hex");
  
  // MQTT
  if (protocol === "mqtt" && token) {
    topic = "device/data", qos = "0";
  }

  // LoRa
  if (protocol === "lora" && token) {
    loraProfile = await Chirpstack(token);
  }
  
  // Database
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
});

// READ Device
app.get("/devices", async (req: JWT) => {
  console.log("Headers received: ", req.headers)
  await authorizeRequest(req);

  const [data] = await db.query<any[]>("SELECT * FROM devices");
  return new Response(JSON.stringify({ result: data }), { status: 200 });
});
app.get("/device/:id", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { id } = req.params;
  const [data] = await db.query<any[]>("SELECT * FROM devices WHERE id = ?", [
    id,
  ]);
  return new Response(JSON.stringify({ result: data }), { status: 200 });
});

// UPDATE Device
app.put("/device/:id", async (req: JWT) => {
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
});

// DELETE Device
app.delete("/device/:id", async (req: JWT) => {
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

// CREATE Data Sensor
app.post("/payload", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { device_id, ph, cod, tss, nh3n, flow } = req.body;
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time) VALUES (?, ?, ?, ?, ?, ?, NOW())",
    [device_id, ph, cod, tss, nh3n, flow]
  );
  return new Response(
    JSON.stringify({
      message: "Berhasil menambah data sensor",
      id: result.insertId,
    }),
    { status: 201 }
  );
});

// READ Data Sensor
app.get("/payloads", async (req: JWT) => {
  await authorizeRequest(req);

  const [data] = await db.query("SELECT * FROM payloads");
  return new Response(JSON.stringify({ result: data }), { status: 200 });
});
app.get("/payload/:device_id", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { device_id } = req.params;
  const [data] = await db.query("SELECT * FROM payloads WHERE device_id = ?", [
    device_id,
  ]);
  return new Response(JSON.stringify({ result: data }), { status: 200 });
});

// POST Alarm
app.post("/alarm", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { name, device_id, operator, threshold, sensor } = req.body;
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO alarms (description, device_id, operator, threshold, last_sended, sensor_type) VALUES (?, ?, ?, ?, NOW(), ?)",
    [name, device_id, operator, threshold, sensor]
  );
  return new Response(
    JSON.stringify({
      message: "Berhasil menambah data alarm",
      id: result.insertId,
    }),
    { status: 201 }
  );
});

// READ Alarm
app.get("/alarms", async (req: JWT) => {
  await authorizeRequest(req);

  const [data] = await db.query<any[]>("SELECT * FROM alarms");
  return new Response(JSON.stringify({ result: data }), { status: 200 });
});
app.get("/alarm/:device_id", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { device_id } = req.params;
  const [data] = await db.query<any[]>(
    "SELECT * FROM alarms WHERE device_id = ?",
    [device_id]
  );
  return new Response(JSON.stringify({ result: data }), { status: 200 });
});

// UPDATE Alarm
app.put("/alarm/:id", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { name, device_id, operator, threshold, sensor } = req.body;
  await db.query(
    "UPDATE alarms SET description = ?, device_id = ?, operator = ?, threshold = ?, sensor_type = ? WHERE id = ?",
    [name, device_id, operator, threshold, sensor, req.params.id]
  );
  return { message: "Berhasil mengupdate data alarm." };
});

// DELETE Alarm
app.delete("/alarm/:id", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  await db.query("DELETE FROM alarms WHERE id = ?", [req.params.id]);
  return { message: "Berhasil menghapus data alarm." };
});

app.listen(Bun.env.SERVER_PORT!, () => {
  // MQTT Setup
  mqttClient.on('connect', () => {
    console.log('✅ Berhasil terkoneksi ke MQTT broker');
    
    // MQTT Topic
    const topics = ['device/data', 'device_2/data'];

    topics.forEach(topic => {
      mqttClient.subscribe(topic, (err) => {
        if (!err) {
          console.log(`✅ Berhasil subscribe topik: ${topic}`);
        } else {
          console.error(`❌ Gagal subscribe topik: ${topic}`, err);
        }
      });
    });
  });
  
  mqttClient.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Menerima payload dari topik ${topic}:`, data);
  
      // Simpan data ke database
      await db.query(
        `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [data.device_id, data.ph, data.cod, data.tss, data.nh3n, data.flow]
      );
  
      console.log(`Berhasil menyimpan data sensor pada topik ${topic} ke database.`);
    } catch (error) {
      console.error("❌ Gagal memproses pesan publisher:", error);
    }
  });
  
  console.log(
    `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`
  );
});


