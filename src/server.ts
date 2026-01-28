import { prisma } from "./lib/prisma";
import app from "./app";

const PORT = process.env.PORT;

async function server() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully!");

    app.listen(PORT, () => {
      console.log(`Pharmatix server is running at port: ${PORT}`);
    });
  } catch (error) {
    console.log("Error occured", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

server();
