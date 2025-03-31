"use client";
import { useRouter } from "next/navigation";
import JoinRoomForm from "@/components/home/JoinRoomForm";
import RoomCreationOptions from "@/components/home/RoomCreationOptions";

export default function Home() {
  const router = useRouter();

  const handleJoinRoom = (roomId: string) => {
    router.push(`/${roomId}`);
  };

  const handleCreateRoom = (roomId: string) => {
    router.push(`/${roomId}`);
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6"
      style={{
        backgroundImage: `url('/home-bg.svg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Left side - Hero image and branding */}
          <div className="w-full md:w-1/2 bg-indigo-600 text-white p-8 flex flex-col justify-center">
            <div className="m-6 p-2 bg-white rounded-lg shadow-lg flex items-center justify-center">
              <img
                className="h-20 md:w-full"
                src="/logo.svg"
                alt="header icon"
              />
            </div>
            <p className="text-indigo-100 mb-6">
              Real-time collaboration made simple. Share code and files
              instantly.
            </p>

            <div className="hidden md:block relative h-64">
              {/* Replace with your own image or illustration */}
              <div className="absolute inset-0 bg-indigo-500 opacity-50 rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/hero-image.svg"
                  alt="Hero Image"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>

            <ul className="mt-8 space-y-2">
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Peer-to-peer file sharing
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Real-time code collaboration
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                No account required
              </li>
            </ul>
          </div>

          {/* Right side - Room controls */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Start Collaborating
            </h2>

            {/* Join Room Form Component */}
            <JoinRoomForm onJoinRoom={handleJoinRoom} />

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-gray-500 text-sm">or</span>
              </div>
            </div>

            {/* Room Creation Options Component */}
            <RoomCreationOptions onCreateRoom={handleCreateRoom} />

            <p className="mt-6 text-center text-gray-600 text-sm">
              Create a room and share the URL with friends to collaborate!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            No sign-up required. Your data stays between you and your peers.
          </p>
          <p className="mt-1">
            © {new Date().getFullYear()} WeShare. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
