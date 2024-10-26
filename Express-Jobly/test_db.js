const { Pool } = require("pg");
const { getDatabaseUri } = require("./config");

async function testConnection() {
  const client = new Pool({
    connectionString: "postgresql:///jobly",
  });

  try {
    await client.connect();
    console.log("Connected successfully");
    await client.query("SELECT NOW()");
    await client.end();
  } catch (err) {
    console.error("Connection error", err);
  }
}

testConnection();
