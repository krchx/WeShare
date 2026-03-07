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
    <div className="flex flex-col min-h-screen lg:h-[100dvh] bg-[var(--paper-page)] dark:bg-[var(--paper-page-dark)] text-[var(--ink)] dark:text-[var(--ink-dark)] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 left-8 h-64 w-64 rounded-full bg-white/20 blur-3xl dark:bg-stone-200/5" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-100/20 blur-3xl dark:bg-amber-100/5" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.3] dark:opacity-[0.14] mix-blend-overlay"
        style={{ backgroundImage: "var(--noise-light)" }}
      ></div>

      <Header roomId={roomId} connected={connected} isLoading={isTextLoading} />

      <div className="flex flex-col lg:flex-row flex-1 w-full px-3 pb-3 pt-2 sm:px-4 sm:pb-4 gap-4 lg:gap-5 h-auto lg:h-[calc(100vh-90px)] lg:overflow-hidden z-10">
        <div className="flex flex-col w-full flex-none min-h-[60vh] lg:flex-1 lg:min-h-0 lg:h-full overflow-hidden">
          <TextEditor
            text={text}
            onChange={handleTextChange}
            disabled={isTextLoading}
            isLoading={isTextLoading}
          />
        </div>

        <div className="flex flex-col lg:w-[360px] xl:w-[400px] shrink-0 gap-4 w-full lg:h-full lg:overflow-y-auto pb-2">
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
