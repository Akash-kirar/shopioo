import express from "express";
import cors from "cors";
import path from "path";
import { db } from "./db/index.ts";
import { users, shops, items } from "./db/schema.ts";
import { requireAuth, AuthRequest } from "./middleware/auth.ts";
import { eq } from "drizzle-orm";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Configure CORS for the frontend origin
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  }));

  app.use(express.json());


  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example secure endpoint
  app.get("/api/users/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      const userRecords = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (userRecords.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(userRecords[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync user profile
  app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      const { name, email, role } = req.body;
      const uid = req.user.uid;

      const result = await db.insert(users).values({
        id: uid,
        uid,
        name,
        email,
        role: role || 'user'
      }).onConflictDoUpdate({
        target: users.uid,
        set: { name, email }
      }).returning();
      
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shops endpoints
  app.get("/api/shops", async (req, res) => {
    try {
      const allShops = await db.select().from(shops);
      res.json(allShops);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shops", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const shopData = req.body;
      const result = await db.insert(shops).values({
        ...shopData,
        ownerId: req.user.uid
      }).returning();
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve frontend in production
  if (process.env.NODE_ENV === "production") {
    // Assuming backend is run from backend folder and frontend is built in frontend/dist
    const distPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
