"use client";

import { Header } from "@/components/room/Header";
import { TextEditor } from "@/components/room/TextEditor";
import { FileSharing } from "@/components/room/FileSharing";
import { RoomInfo } from "@/components/room/RoomInfo";
import { useRoom } from "@/hooks/useRoom";

export default function Room() {
  const {
    roomId,
    text,
    updateText,
    localFiles,
    sharedFiles,
    handleFileUpload,
    downloadFile,
    connected,
    peers,
    userId,
    shareRoom,
    isTextLoading,
    downloadingFiles,
  } = useRoom();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateText(e.target.value);
  };

  const handleFileUploadWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-100 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/room-bg.svg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Header
        roomId={roomId}
        connected={connected}
        isLoading={isTextLoading}
        onShareRoom={shareRoom}
      />

      <div className="flex flex-col md:flex-row flex-1">
        <TextEditor
          text={text}
          onChange={handleTextChange}
          disabled={isTextLoading}
          isLoading={isTextLoading}
        />

        <div className="flex flex-col md:w-80 border-2 border-gray-300 rounded-lg p-4 mx-4 my-2 md:my-4 bg-blue-300/30 backdrop-blur-sm">
          <FileSharing
            downloadingFiles={downloadingFiles}
            localFiles={localFiles}
            sharedFiles={sharedFiles}
            onFileUpload={handleFileUploadWrapper}
            onDownloadFile={downloadFile}
          />

          <RoomInfo roomId={roomId} peers={peers} userId={userId} />
        </div>
      </div>
    </div>
  );
}
