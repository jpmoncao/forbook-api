import "dotenv/config";

import express, { json, Response } from "express";
import cors from "cors";

import { connectPrisma, disconnectPrisma } from "@/config/prisma";
import userRouter from "@/routers/user.router";
import authRouter from "@/routers/auth.router";
import imageRouter from "@/routers/image.router";

const app = express();

app.use(json());
app.use(cors());

app.get("/health", (_, res: Response) => {
    res.status(200).json({ message: "Forbook API is running" });
});

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/images", imageRouter);

const PORT = 3002;

async function bootstrap() {
    await connectPrisma();
    console.log("Prisma ligado à base de dados.");

    app.listen(PORT, () => {
        console.log(`Forbook API is running on port ${PORT}`);
    });
}

bootstrap().catch((err) => {
    console.error("Falha ao iniciar a API (Prisma ou servidor):", err);
    process.exit(1);
});

const shutdown = async () => {
    await disconnectPrisma();
    process.exit(0);
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

export default app;
