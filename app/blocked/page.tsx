import "../members.css";
import Brand from "@/components/landing/brand";

export default function BlockedPage() {
  return (
    <div className="member-app">
      <header className="member-top"><Brand /></header>
      <main className="blocked-card">
        <h1>Access blocked</h1>
        <p>
          This account was blocked because unauthorized video download activity was detected.
          Download managers such as Internet Download Manager are not allowed.
        </p>
        <p>If this was a mistake, contact Telegram @ohioism1.</p>
      </main>
    </div>
  );
}
