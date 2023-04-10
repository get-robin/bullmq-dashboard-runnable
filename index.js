const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { Queue } = require("bullmq");
const express = require("express");
const { program } = require("commander");

const split = (str) => str.split(",");

function myParseInt(value) {
  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) {
    throw new program.InvalidArgumentError("Not a number.");
  }

  return parsedValue;
}

program
  .version("0.0.1")
  .showHelpAfterError()
  .option("-P, --port <port>", "Port to run UI", myParseInt, 3000)
  .option("--redis-port <port>", "Redis port", myParseInt, 6379)
  .option("--redis-host <host>", "Redis host", "localhost")
  .option("--redis-user <user>", "Redis user", "bob")
  .option("--redis-password <password>", "Redis password", undefined)
  .option("--prefix <prefix>", "BullMQ prefix", undefined)
  .argument("<queue names>", "comma separated queue names", split)
  .parse(process.argv);

const names = program.args
const opts = program.opts()


if (!opts) {
  process.exit()
}

const redisOptions = {
  username: opts.redisUser,
  port: opts.redisPort,
  host: opts.redisHost,
  password: opts.redisPassword,
};

const run = async () => {
  const queues = names.map(
    (name) =>
      new BullMQAdapter(new Queue(name, { ...(opts.prefix ? {prefix: opts.prefix}: {}),  connection: redisOptions }))
  );

  const app = express();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/");

  createBullBoard({ queues, serverAdapter });

  app.use("/", serverAdapter.getRouter());

  app.listen(opts.port, () => {
    console.log(`For the UI, open http://localhost:${opts.port}/`);
  });
};

run().catch((e) => console.error(e));