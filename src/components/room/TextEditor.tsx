import React, { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface TextEditorProps {
  text: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onChange,
  disabled = false,
  isLoading = false,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const lineCount = text.split("\n").length;

  return (
    <div
      className={`flex-1 p-4 flex flex-col m-2 rounded-md backdrop-blur-xs ${
        isDarkMode ? "bg-gray-700/60 text-white/80" : "bg-white text-black"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center">
          Collaborative Editor
          {isLoading && (
            <AiOutlineLoading3Quarters className="ml-3 animate-spin text-yellow-500 h-6 w-6" />
          )}
        </h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full focus:outline-none ring-1 ring-gray-500 focus:ring-2 focus:ring-opacity-50 hover:cursor-pointer"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? (
            <FaSun className="text-white" />
          ) : (
            <FaMoon className="text-gray-600" />
          )}
        </button>
      </div>
      <p className="text-sm mb-4">
        {isLoading ? (
          <span className="text-yellow-500 flex items-center font-medium">
            <AiOutlineLoading3Quarters className="mr-2 animate-spin h-4 w-4" />
            Syncing with other users...
          </span>
        ) : (
          "All changes will automatically sync with everyone in this room."
        )}
      </p>

      {/* Editor container with focus styling */}
      <div
        className={`flex flex-1 rounded overflow-hidden relative ${
          isDarkMode
            ? "ring-1 ring-gray-600 focus-within:ring-2 focus-within:ring-gray-400"
            : "ring-1 ring-gray-300 focus-within:ring-2 focus-within:ring-gray-600"
        }`}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 flex items-center space-x-3 shadow-lg">
              <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Syncing with room...
              </span>
            </div>
          </div>
        )}

        {/* Line Numbers */}
        <div
          className={`flex flex-col items-end pr-2 pt-3 ${
            isDarkMode
              ? "bg-gray-800 text-gray-400"
              : "bg-gray-100 text-gray-600"
          }`}
          style={{ minWidth: "40px" }}
        >
          {Array.from({ length: Math.max(1, lineCount) }, (_, i) => (
            <span key={i} className="text-xs leading-6">
              {i + 1}
            </span>
          ))}
        </div>

        {/* Text Area - removing individual focus ring */}
        <textarea
          className={`flex-1 p-3 resize-none outline-none opacity-90 ${
            isDarkMode
              ? "border-l border-gray-700 bg-gray-800 text-white"
              : "border-l border-gray-300 bg-white text-black"
          }`}
          value={text}
          onChange={onChange}
          placeholder="Start typing here..."
          rows={10}
          disabled={disabled}
        />
      </div>

      <div className="text-sm mt-2 text-right">
        Line Count: <span className="font-bold">{lineCount}</span>
      </div>
    </div>
  );
};
