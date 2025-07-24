
import { cors } from "@elysiajs/cors";
import Elysia from "elysia";
import usersRoute from "./routes/users";


const app = new Elysia()

app.use(cors());

app.get("/api", "The server is up and running")
app.get("/", "Hey this is the home page route...");
app.use(usersRoute);

const port = Bun.env.PORT || 8080;

app.listen(port, () => {
    console.log(`💫 App is running on http://localhost:${port}`);
});
