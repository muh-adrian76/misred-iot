import { Elysia } from 'elysia';
import { ResultSetHeader } from 'mysql2';
import { authorizeRequest } from '../utils/authorize';
import { Auth, JWT } from '../utils/interface';
import { db } from '../utils/middleware';

export const userRoutes = new Elysia({ prefix: "/user" })
  // 📝 Register User
  .post('/register', async (req: Auth) => {
    const { username, password, email } = req.body;

    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return new Response(
        JSON.stringify({ message: 'Email tidak valid. Gagal menambahkan user.' }),
        { status: 400 }
      );
    }

    const hashedPassword = await Bun.password.hash(password, {
      algorithm: 'bcrypt',
    });

    const [result] = email
      ? await db.query<ResultSetHeader>(
          'INSERT INTO users (email, password, last_login) VALUES (?, ?, NOW())',
          [email, hashedPassword]
        )
      : await db.query<ResultSetHeader>(
          'INSERT INTO users (username, password, last_login) VALUES (?, ?, NOW())',
          [username, hashedPassword]
        );

    return new Response(
      JSON.stringify({ message: 'User berhasil terdaftar', id: result.insertId }),
      { status: 201 }
    );
  })

  // 🔐 Login User
  .post('/login', async (req: JWT) => {
    const { username, password, email } = req.body;

    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return new Response(
        JSON.stringify({ message: 'Email tidak valid. Gagal menambahkan user.' }),
        { status: 400 }
      );
    }

    const [rows] = await db.query<any[]>(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
      });
    }

    const user = rows[0];
    const isMatch = await Bun.password.verify(password, user.password);

    if (!user || !isMatch) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
      });
    }

    const accessToken = await req.jwt.sign({
      sub: user.id,
      iat: Math.floor(Date.now() / 1000),
      type: 'access',
    });

    const response = await fetch(`http://localhost:7601/sign/${user.id}`);
    const refreshToken = await response.text();

    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [
      refreshToken,
      user.id,
    ]);

    return new Response(JSON.stringify({ accessToken, refreshToken }), {
      status: 200,
    });
  })

  // 🔁 Refresh Token
  .get('/renew/:id', async (req: JWT) => {
    const { id } = req.params;

    const [rows] = await db.query<any[]>(
      'SELECT refresh_token FROM users WHERE id = ?',
      [id]
    );

    const refreshToken = rows?.[0]?.refresh_token;

    try {
      const decoded = await req.jwt.verify(refreshToken);

      const newAccessToken = await req.jwt.sign({
        sub: decoded.sub,
        iat: Math.floor(Date.now() / 1000),
        type: 'access',
      });

      return new Response(JSON.stringify({ accessToken: newAccessToken }), {
        status: 200,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ message: 'Invalid or expired refresh token' }),
        { status: 401 }
      );
    }
  })

  
  // Logout
  .post("/logout/:id", async (req: JWT) => {
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
  })

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
  })