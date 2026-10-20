"use client";

export default function ProgramPreview() {
  return (
    <div className="hero-feature">
      <div className="course-window program-preview-frame">
        <div className="course-window-head">
          <span className="window-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span>PROGRAM PREVIEW</span>
        </div>
        <video
          className="program-preview-video"
          src="/program-preview.mp4"
          autoPlay
          muted
          loop
          playsInline
          controls={false}
        />
      </div>
    </div>
  );
}
