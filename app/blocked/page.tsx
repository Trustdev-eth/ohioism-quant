import "../members.css";
import Brand from "@/components/landing/brand";

export default function BlockedPage() {
  return (
    <div className="member-app">
      <header className="member-top"><Brand /></header>
      <main className="blocked-card">
        <h1>Access blocked</h1>
        <p>This account can no longer stream course videos. If this was a mistake, contact support on Telegram.</p>
      </main>
    </div>
  );
}
