"use client";
import { useRouter } from "next/navigation";
import JoinRoomForm from "@/components/home/JoinRoomForm";
import RoomCreationOptions from "@/components/home/RoomCreationOptions";
import { FaGithub } from "react-icons/fa";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const [bgImg, setBgImg] = useState("");

  useEffect(() => {
    setBgImg(theme === "dark" ? "/home-bg-dark.svg" : "/home-bg-light.svg");
  }, [theme]);

  const handleJoinRoom = (roomId: string) => {
    router.push(`/${roomId}`);
  };

  const handleCreateRoom = (roomId: string) => {
    router.push(`/${roomId}`);
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 dark:from-gray-800 dark:to-gray-900"
      style={{
        backgroundImage: `url('${bgImg}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row dark:bg-gray-800">
          {/* Left side - Hero image and branding */}
          <div className="w-full md:w-1/2 bg-indigo-600 text-white p-8 flex flex-col justify-center dark:bg-gray-700">
            <div className="m-6 p-2 bg-white rounded-lg shadow-lg flex items-center justify-center">
              <img
                className="h-20 md:w-full"
                src="/logo.svg"
                alt="header icon"
              />
            </div>
            <p className="text-indigo-100 mb-6 dark:text-gray-300">
              Real-time collaboration made simple. Share code and files
              instantly.
            </p>

            <div className="hidden md:block relative h-64">
              {/* Replace with your own image or illustration */}
              <div className="absolute inset-0 bg-indigo-500 opacity-50 rounded-lg dark:bg-gray-600"></div>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">
              Start Collaborating
            </h2>

            {/* Join Room Form Component */}
            <JoinRoomForm onJoinRoom={handleJoinRoom} />

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-gray-500 text-sm dark:bg-gray-800 dark:text-gray-400">or</span>
              </div>
            </div>

            {/* Room Creation Options Component */}
            <RoomCreationOptions onCreateRoom={handleCreateRoom} />

            <p className="mt-6 text-center text-gray-600 text-sm dark:text-gray-400">
              Create a room and share the URL with friends to collaborate!
            </p>
            <div className="mt-6 flex justify-center">
              <a
                href="https://github.com/krchx/weshare"
                target="_blank"
                rel="noopener noreferrer"
                className="items-center flex px-4 py-3 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors shadow-sm duration-200 dark:bg-gray-600 dark:hover:bg-gray-500"
                aria-label="View source on GitHub"
              >
                <FaGithub className="w-7 h-7 mr-2" />
                <span className="inline">GitHub Repo</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm dark:text-gray-400">
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