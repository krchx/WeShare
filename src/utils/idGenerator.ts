/**
 * Generates a catchy user ID consisting of an adjective, animal, and number
 */
export function generateUserId(): string {
  const nameList = [
    "Arya",
    "Tyrion",
    "Cersei",
    "Daenerys",
    "Bran",
    "Sansa",
    "Hagrid",
    "Snape",
    "Draco",
    "Frodo",
    "Gandalf",
    "Aragorn",
    "Legolas",
    "Gollum",
    "Sauron",
    "Bilbo",
    "Katniss",
    "Peeta",
    "Aslan",
    "Sherlock",
    "Watson",
    "Dorian",
    "Gatsby",
    "Atticus",
    "Scarlett",
    "Holden",
    "Elizabeth",
    "Darcy",
    "Heathcliff",
    "Pip",
    "Huck",
    "Tom",
    "Lucy",
    "Susan",
    "Edmund",
    "Peter",
    "Haymitch",
    "Samwise",
    "Legolas",
    "Eowyn",
    "Boromir",
    "Thorin",
    "Beorn",
    "Smaug",
    "Luna",
    "Neville",
    "Bellatrix",
    "Sirius",
    "Remus",
    "Cedric",
  ];

  // Get random adjective and animal
  const animal = nameList[Math.floor(Math.random() * nameList.length)];

  // Generate a 2-3 digit number
  const number = Math.floor(Math.random() * 900) + 100;

  // Combine them
  return `${animal}${number}`;
}

/**
 * Generates a random 5-character room ID with letters and numbers
 */
export function generateRoomId(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}
