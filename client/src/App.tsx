import { useState } from "react";
import "./styles.css";
import { Sidebar } from "./components/SideBar";
import { ApprovalPanel } from "./components/ApprovalPanel";
import AskLLM from "./components/AskLLM";
import AppGenerator from "./components/AppGenerator";
import Test from "./components/TestComponent";
import McpChat from "./components/McpChat";

export default function App() {
  const [activeTab, setActiveTab] = useState("approval");

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} />

      <main className="main-content">
        {activeTab === "approval" && <ApprovalPanel />}
        {activeTab === "askllm" && <AskLLM />}
        {activeTab === "app-generate" && <AppGenerator />}
        {activeTab === "MCP" && <McpChat />}
        {activeTab === "test" && <Test />}
      </main>
    </div>
  );
}
