import "dotenv/config";

import express, { json, Response } from "express";
import cors from "cors";

import { connectPrisma, disconnectPrisma } from "@/config/prisma";

import userRouter from "@/routers/user.router";
import authRouter from "@/routers/auth.router";
import imageRouter from "@/routers/image.router";
import userBookRouter from "@/routers/userBook.router";
import catalogBookRouter from "@/routers/catalogBook.router";
import ratingRouter from "@/routers/rating.router";

import { errorHandler } from "@/middlewares/error-handler";

const PORT = 3002;
const app = express();

const routerPathMap = new Map<Function, string>();
const _originalUse = app.use.bind(app);
(app as any).use = function (path: any, ...fns: any[]) {
    if (typeof path === "string") {
        fns.forEach((fn) => {
            if (typeof fn === "function") routerPathMap.set(fn, path);
        });
    }
    return _originalUse(path, ...fns);
};

app.use(json());
app.use(cors());

app.get("/health", (_, res: Response) => {
    res.status(200).json({ message: "Forbook API is running" });
});

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/images", imageRouter);
app.use("/user-books", userBookRouter);
app.use("/catalog-books", catalogBookRouter);
app.use("/ratings", ratingRouter);

app.use(errorHandler);

async function bootstrap() {
    await connectPrisma().catch((error) => {
        console.error(`[${new Date().toISOString()}] Erro ao conectar à base de dados:`, error);
        process.exit(1);
    });

    app.listen(PORT, () => {
        console.log(`[${new Date().toISOString()}] Forbook API is running on port ${PORT}`);
    });

    function listRoutes(stack: any[], prefix = ""): void {
        for (const layer of stack) {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods)
                    .map((m) => m.toUpperCase())
                    .join(", ");
                console.log(`[${methods}] ${prefix}${layer.route.path}`);
            } else if (layer.handle?.stack) {
                const routerPrefix = routerPathMap.get(layer.handle) ?? "";
                listRoutes(layer.handle.stack, prefix + routerPrefix);
            }
        }
    }

    console.log("\nRotas registradas:");
    listRoutes(app.router.stack);
    console.log("\n");
}

bootstrap().catch((err) => {
    console.error(err);
    console.error(`[${new Date().toISOString()}] Falha ao iniciar a API`);
    process.exit(1);
});

const shutdown = async () => {
    await disconnectPrisma();
    process.exit(0);
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

export default app;
