/**
 * Generates a catchy user ID consisting of an adjective, animal, and number
 */
export function generateCatchyUserId(): string {
    const adjectives = [
      'cool', 'swift', 'smart', 'bold', 'brave', 'calm', 'eager', 'fair', 
      'kind', 'lively', 'proud', 'quick', 'sharp', 'wise', 'zesty'
    ];
    
    const animals = [
      'fox', 'wolf', 'bear', 'hawk', 'deer', 'owl', 'puma', 'seal', 
      'lion', 'tiger', 'eagle', 'duck', 'frog', 'lynx', 'mole'
    ];
    
    // Get random adjective and animal
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    
    // Generate a 2-3 digit number
    const number = Math.floor(Math.random() * 900) + 100;
    
    // Combine them
    return `${adjective}${animal}${number}`;
  }
  
  /**
   * Generates a random 5-character room ID with letters and numbers
   */
  export function generateRoomId(): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }