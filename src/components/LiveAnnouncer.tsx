import React, { useEffect } from "react";

let announcerDiv: HTMLDivElement | null = null;

export const announce = (msg: string) => {
  if (!announcerDiv) return;
  announcerDiv.textContent = ""; // clear previous
  // Force reflow to ensure screen readers notice change
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  announcerDiv && announcerDiv.getBoundingClientRect();
  announcerDiv.textContent = msg;
};

export const LiveAnnouncer: React.FC = () => {
  useEffect(() => {
    announcerDiv = document.getElementById("hci-announcer") as HTMLDivElement;
    return () => {
      announcerDiv = null;
    };
  }, []);
  return (
    <div
      id="hci-announcer"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    ></div>
  );
};
