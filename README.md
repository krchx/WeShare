# WeShare 🌟

Welcome to **WeShare** – the ultimate real-time file and code sharing platform! 🚀  
With **WeShare**, you can instantly share files and collaborate on code with your peers using secure peer-to-peer technology. No sign-ups, no hassle – just seamless collaboration.

## ✨ Features

- **Real-Time Collaboration**: Share files and edit code together in real-time.
- **Peer-to-Peer Sharing**: Your data stays private and never touches a server.
- **No Sign-Up Required**: Jump straight into collaboration without creating an account.
- **Custom & Random Rooms**: Create a room with a custom name or let us generate one for you.
- **Secure Sharing**: Built with WebRTC for secure and direct connections.
- **Cross-Platform**: Works on any device with a modern browser.

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/krchx/weshare.git
   cd weshare
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Go to **Project Settings** and find your Firebase configuration.
   - Create a `.env.local` file in the root of the project and add the following variables:
     ```env
     FIREBASE_API_KEY=your-firebase-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
     NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-firebase-database-url
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
     FIREBASE_APP_ID=your-firebase-app-id
     NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
     ```
   - Replace the placeholders (`your-firebase-*`) with the actual values from your Firebase project.
   - **Important**: To set up the `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, create a Firebase Realtime Database in your Firebase project:
     1. Navigate to the **Realtime Database** section in the Firebase Console.
     2. Click **Create Database** and follow the prompts to set it up.
     3. Copy the database URL and use it as the value for `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.

4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

## 📜 License

This project is licensed under the **Apache License 2.0**.  
Feel free to use, modify, and distribute it as per the terms of the license.  
For more details, check the [LICENSE](LICENSE) file.

## 🤝 Contributing

We welcome contributions from the community! ❤️  
Here’s how you can get involved:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request, and we’ll review it as soon as possible.

## ⭐ Show Your Support

If you find **WeShare** helpful, please give us a ⭐ on GitHub!  
Your support helps us grow and improve this project for everyone.

---

Thank you for being a part of the **WeShare** community! Together, we can make collaboration effortless and enjoyable. 🌍
