import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { ResultSetHeader } from "mysql2/promise";
import { chirpstack, db, mqttClient } from "./middleware";

interface JWT {
  json():
    | {
        name: any;
        description: any;
      }
    | PromiseLike<{
        name: any;
        description: any;
      }>;
  body: {
    name: string;
    board: string;
    protocol: string;
    device_id: number;
    ph: number;
    cod: number;
    tss: number;
    nh3_n: number;
    flow: number;
    server_time: string;
    operator: string;
    threshold: number;
    sensor: string;
  };
  params: {
    id: number;
    device_id: number;
    sensor: string;
  };
  headers: {
    [x: string]: any;
  };
  jwt: {
    sign(arg0: { sub: string; iat: number; type: string }): any;
    verify: (arg0: any) => any;
  };
  user: any;
  error: any;
}

interface Auth {
  params: { sub: string; iat: number; type: string; };
  body: {
    username?: string;
    password: string;
    email?: string;
  };
  jwt: {
    sign(arg0: { sub: string; iat: number; type: string }): any;
  };
}

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

async function authorizeRequest(req: JWT) {
  console.log("Headers received: ", req.headers);
  const { jwt, error, headers } = req;
  if (!headers || typeof headers.authorization !== "string") {
    throw new Error("Authorization header missing or invalid");
  }

  const authHeader = headers["authorization"];
  const token = authHeader.split(" ")[1];
  const authorize = await jwt.verify(token);

  try {
    if (!authorize) return error(401, "Unauthorized");
    return authorize; // Return user data if needed
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      try {
        const response = await fetch(`http://localhost:7600/renew/${authorize.sub}`);
        const { accessToken } = await response.json(); 

        if (!accessToken) {
          throw new Error('Unable to refresh access token');
        }

        return { accessToken };
      } catch (error) {
        throw new Error('Invalid or expired refresh token');
      }
    }
  }
}

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
  const { id } = await req.params;
  
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

// CREATE Device
app.post("/device", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { name, board, protocol } = req.body;
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO devices (description, board_type, protocol) VALUES (?, ?, ?)",
    [name, board, protocol]
  );

  if(protocol === 'lora') {
    chirpstack();
  }

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

  const { device_id, ph, cod, tss, nh3_n, flow } = req.body;
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time) VALUES (?, ?, ?, ?, ?, ?, NOW())",
    [device_id, ph, cod, tss, nh3_n, flow]
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

// Logout
app.post("/logout/:id", async (req: JWT) => {
  console.log("Headers received: ", req.headers);
  await authorizeRequest(req);

  const { id } = req.params;

  const [result] = await db.query<any[]>('SELECT refresh_token FROM users WHERE id = ?', [id]);
  const refreshToken = result[0];
  if (!refreshToken)
    return new Response(JSON.stringify({ message: "Invalid refresh token." }), {
      status: 400,
    });

  await db.query("UPDATE users SET refresh_token = ?", [""]);
  return new Response(JSON.stringify({ message: "User berhasil logout" }), {
    status: 200,
  });
});

app.listen(7600, () => {
  // MQTT Setup
  // connectRabbitMQ();
  mqttClient.on('connect', () => {
    console.log('✅ Berhasil terkoneksi ke MQTT broker');
    mqttClient.subscribe('device/data', (err) => {
      if (!err) {
        console.log('✅ Berhasil subscribe topik: device/data');
      } else {
        console.error('❌ Gagal melakukan subscribe:', err);
      }
    });
  });
  
  mqttClient.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Payload dari publisher:", data);
  
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


