const { Client } = require('pg');

async function testPassword(password) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: password,
    port: 5432,
  });
  try {
    await client.connect();
    console.log(`Success with password: "${password}"`);
    await client.query('CREATE DATABASE workshops_dev;');
    await client.query('CREATE DATABASE workshops_test;');
    await client.end();
    return true;
  } catch (e) {
    // console.log(`Failed with password: "${password}" - ${e.message}`);
    return false;
  }
}

async function main() {
  const passwords = ['postgres', 'root', 'password', 'admin', '1234', '123456', '', 'test'];
  for (const p of passwords) {
    if (await testPassword(p)) {
      process.exit(0);
    }
  }
  console.log('None of the passwords worked.');
}
main();
