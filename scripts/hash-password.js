const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "KnowlersHub"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(hash);