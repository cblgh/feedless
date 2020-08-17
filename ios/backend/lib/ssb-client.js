const Client = require("ssb-client");
const ssbKeys = require("ssb-keys");
const queries = require("./queries");
const debug = require("debug")("express");
const { ssbFolder } = require("./utils");
const fetch = require("node-fetch").default;

let ssbClient;
let syncing = false;
let indexing = true;

const ssbSecret = ssbKeys.loadOrCreateSync(`${ssbFolder()}/secret`);

const connectClient = (ssbSecret) => {
  Client(
    ssbSecret,
    {
      host: "127.0.0.1",
      port: process.env.SSB_PORT || 8008,
      key: ssbSecret.id,
      caps: {
        shs: "1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=",
      },
    },
    (err, server) => {
      if (err) {
        console.log("err", err, "trying to reconnect in 1s");
        setTimeout(() => connectClient(ssbSecret), 1000);
        return;
      }

      ssbClient = server;

      queries.progress((data) => {
        const { incompleteFeeds } = data;
        if (incompleteFeeds > 0) {
          if (!syncing) debug("syncing");
          syncing = true;
        } else {
          if (syncing) debug("ready");
          syncing = false;
        }
      });

      console.log("SSB Client ready");

      queries.getAllEntries(1).then(() => {
        status = "ready";
      });

      addFirstPub();
    }
  );
};

const addFirstPub = async () => {
  const peers = await ssbClient.gossip.peers();
  if (peers.length == 0) {
    console.log("No pubs found, adding pub.feedless.social as a first pub");
    try {
      const response = await fetch("https://feedless.social/pub_invite");
      const { invite } = await response.json();
      await ssbClient.invite.accept(invite);
    } catch (e) {
      console.error("Could add feedless pub", e);
    }
  }
};

let indexingState = { current: 0, target: 0 };

const checkIndexing = async () => {
  if (!ssbClient) return;

  let indexes;
  try {
    const progress = await ssbClient.progress();
    indexes = progress.indexes;
  } catch (e) {
    // Check indexing error, continuing is dangerous, app won't work, I tried everything
    // I think it's better to just wait for the Rust implementation to replace this
    process.exit(1);
  }
  const { start, current, target } = indexes;

  indexingState = { current: current - start, target: target - start };

  if (current < target) {
    if (!indexing) debug("indexing");
    indexing = true;
  } else {
    if (indexing) debug("finish indexing");
    indexing = false;
  }
};

setInterval(checkIndexing, 1000);

connectClient(ssbSecret);

module.exports.client = () => ssbClient;
module.exports.getStatus = () => {
  if (!ssbClient) return "connecting";
  if (syncing) return "syncing";
  if (indexing) return "indexing";
  return "ready";
};
module.exports.getIndexingState = () => indexingState;
module.exports.reconnectWith = connectClient;
