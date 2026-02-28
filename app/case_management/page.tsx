"use client";

import React, { useState } from "react";
import { amlAPI, CaseRecord } from "../../AML_frontend/services/api";


export default function CaseManagement() {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [newStatus, setNewStatus] = useState<CaseRecord["status"]>("new");
  const [discussion, setDiscussion] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [audit, setAudit] = useState<string[]>([]);

  // mock load
  React.useEffect(() => {
    // load case from API plus supplemental data
    async function fetchCase() {
      try {
        const data = await amlAPI.getCase("CASE-1234");
        setCaseData(data);
        const disc = await amlAPI.getCaseDiscussion(data.id);
        setDiscussion(disc.entries.map((e) => `${e.user}: ${e.message}`));
        const aud = await amlAPI.getCaseAudit(data.id);
        setAudit(aud.timeline.map((t) => `${t.timestamp} ${t.user} ${t.event}`));
      } catch (err) {
        console.error(err);
      }
    }
    fetchCase();
  }, []);

  const updateStatus = async (status: CaseRecord["status"]) => {
    if (!caseData) return;
    try {
      await amlAPI.updateCaseStatus(caseData.id, status);
      setCaseData({ ...caseData, status });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20, color: "#e5e7eb" }}>
      <h1>Case Management</h1>

      {/* case summary panel */}
      {caseData && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div style={{ background: "#0b1220", padding: 12, borderRadius: 6 }}>
            <h2>Case Summary</h2>
            <p><strong>Case ID:</strong> {caseData.id}</p>
            <p><strong>Linked Alerts:</strong> {caseData.linkedAlerts.join(", ")}</p>
            <p><strong>Customer:</strong> {caseData.customer}</p>
            <p><strong>Risk Level:</strong> {caseData.riskLevel}</p>
            <p><strong>Investigator:</strong> {caseData.investigator}</p>
            <p><strong>Status:</strong> {caseData.status}</p>
            <p><strong>Escalation:</strong> Level {caseData.escalationLevel}</p>
            <p><strong>Deadline:</strong> {caseData.complianceDeadline}</p>
          </div>

          {/* tools & timeline */}
          <div>
                  {/* lifecycle enforcement */}
            <section style={{ background: "#0b1220", padding: 12, borderRadius: 6, marginBottom: 20 }}>
              <h2>Lifecycle Control</h2>
              <select value={caseData.status} onChange={(e) => updateStatus(e.target.value as any)} style={{ background: "#0b1220", color: "#f9fafb" }} disabled={caseData.status === "strSubmitted" || caseData.status === "closed"}>
                <option value="new">New</option>
                <option value="underReview">Under Review</option>
                <option value="escalated">Escalated</option>
                <option value="strSubmitted">STR Submitted</option>
                <option value="closed">Closed</option>
              </select>
              <p style={{ marginTop: 8 }}><em>Reopen requests require supervisor approval</em></p>
            </section>

            {/* SLA tools */}
            <section style={{ background: "#0b1220", padding: 12, borderRadius: 6, marginBottom: 20 }}>
              <h2>SLA</h2>
              <p>Remaining: {caseData.slaRemainingHours}h {caseData.overdue && <span style={{ color: "#ef4444" }}>(Overdue)</span>}</p>
              {caseData.slaRemainingHours < 4 && <p style={{ color: "#f97316" }}>Escalation warning!</p>}
            </section>

            {/* collaboration */}
            <section style={{ background: "#0b1220", padding: 12, borderRadius: 6, marginBottom: 20 }}>
              <h2>Discussion</h2>
              <div style={{ maxHeight: 120, overflowY: "auto", background: "#111827", padding: 8, borderRadius: 4 }}>
                {discussion.map((msg, idx) => <div key={idx}>{msg}</div>)}
              </div>
              <textarea id="newMsg" style={{ width: "100%", marginTop: 8 }} placeholder="Add note..." />
              <button style={{ marginTop: 4 }} onClick={async () => {
                const txt = (document.getElementById('newMsg') as HTMLTextAreaElement).value;
                if (txt && caseData) {
                  await amlAPI.postCaseDiscussion(caseData.id, txt);
                  setDiscussion([...discussion, txt]);
                }
              }}>Post</button>

              <h3>Attachments</h3>
              <div>
                {attachments.map((a, i) => <div key={i}>{a}</div>)}
              </div>
              <button style={{ marginTop: 8 }}>Upload document</button>

              <h3>Tags</h3>
              <div>[tagging control placeholder]</div>
            </section>

            {/* audit timeline */}
            <section style={{ background: "#0b1220", padding: 12, borderRadius: 6 }}>
              <h2>Audit Timeline</h2>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                {audit.length ? audit.map((e, i) => <div key={i}>{e}</div>) : '[status changes / activity log with timestamps & IPs]'}
              </div>
            </section>
          </div>
        </div>
      )}

      {!caseData && <div>Loading case...</div>}
    </div>
  );
}