"use client";

import { useEffect, useState } from "react";
import "../members.css";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { fetchMe, type PublicMember } from "@/lib/session-client";

export default function AdminPage() {
  const [member, setMember] = useState<PublicMember | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchMe()
      .then((data) => {
        if (data.member?.plan !== "admin") {
          window.location.href = "/";
          return;
        }
        setMember(data.member);
        setReady(true);
      })
      .catch(() => {
        window.location.href = "/login?next=/admin";
      });
  }, []);

  if (!ready) {
    return (
      <div className="member-app">
        <p className="admin-wrap auth-lead">Loading admin…</p>
      </div>
    );
  }

  return <AdminDashboard member={member} />;
}
