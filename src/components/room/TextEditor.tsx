import React from "react";

interface TextEditorProps {
  text: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ text, onChange }) => {
  return (
    <div className="flex-1 p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-2">Collaborative Editor</h1>
      <p className="text-sm text-gray-500 mb-4">
        All changes will automatically sync with everyone in this room.
      </p>
      <textarea
        className="flex-1 p-3 border border-gray-300 rounded resize-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        value={text}
        onChange={onChange}
        placeholder="Start typing here... All changes will sync in real-time with everyone in the room."
      />
    </div>
  );
};
