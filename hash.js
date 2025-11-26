// hash.js
import bcrypt from "bcrypt";

const password = "admin123"; // password admin
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error generating hash:", err);
    return;
  }
  console.log("Hash untuk password admin123:");
  console.log(hash);
});
