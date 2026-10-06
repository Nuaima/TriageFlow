const net = require("node:net");

const host = process.env.DB_HOST || "db";
const port = Number(process.env.DB_PORT || 5432);
const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS || 30);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 2000);

let attempts = 0;

function tryConnect() {
  attempts += 1;

  const socket = net.createConnection({ host, port });

  const fail = () => {
    socket.destroy();

    if (attempts >= maxAttempts) {
      console.error(`Database did not become reachable at ${host}:${port} after ${attempts} attempts.`);
      process.exit(1);
    }

    console.log(`Waiting for TCP connection to ${host}:${port}... attempt ${attempts}/${maxAttempts}`);
    setTimeout(tryConnect, delayMs);
  };

  socket.setTimeout(2000);
  socket.once("connect", () => {
    console.log(`Database TCP connection established at ${host}:${port}.`);
    socket.end();
    process.exit(0);
  });
  socket.once("error", fail);
  socket.once("timeout", fail);
}

tryConnect();
